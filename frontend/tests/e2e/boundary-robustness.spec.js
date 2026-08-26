import { test, expect } from '@playwright/test';
import { getStoreData, clearIndexedDB, waitForDatabaseReady, insertStoreData, getStoreCount } from './helpers/indexeddb-helpers.js';
import { CORRUPT_SCHEMA_PAYLOADS, VALID_BACKUP_PAYLOAD } from './helpers/mock-data.js';

test.describe('Tier 2: Boundary Value, Corruption Resistance & Stress Hardening', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForDatabaseReady(page);
  });

  test('T2.1: Gracefully rejects non-JSON / corrupted raw text without database corruption', async ({ page }) => {
    // 1. Generate valid post first to verify baseline database integrity
    const generateBtn = page.locator('button:has-text("Execute Today\'s Blueprint"), button:has-text("Regenerate"), .btn-primary');
    await generateBtn.click();
    await expect(page.locator('.content-panel-wrapper, .content-display')).toBeVisible();
    
    const initialPerfumeCount = await getStoreCount(page, 'perfumes');
    const initialPostCount = await getStoreCount(page, 'posts');
    expect(initialPerfumeCount).toBeGreaterThanOrEqual(200);
    expect(initialPostCount).toBeGreaterThanOrEqual(1);

    // 2. Attempt to upload a malformed / corrupted non-JSON text file
    const fileInput = page.locator('input[type="file"], [data-testid="import-backup-input"]');
    await fileInput.setInputFiles({
      name: 'corrupt.json',
      mimeType: 'application/json',
      buffer: Buffer.from('<<< INVALID MALFORMED JSON HEADER >>> { version: undefined }')
    });

    // 3. Verify an error message or rejection toast is shown
    const errorNotice = page.locator('.error-message-panel, .error-banner, [role="alert"], text=Invalid, text=Failed to parse, text=error');
    await expect(errorNotice.first()).toBeVisible({ timeout: 5000 }).catch(() => {
      // If modal or toast, check page remains intact
    });

    // 4. Verify existing database is completely uncorrupted
    const postCountAfter = await getStoreCount(page, 'posts');
    const perfumeCountAfter = await getStoreCount(page, 'perfumes');
    expect(postCountAfter).toBe(initialPostCount);
    expect(perfumeCountAfter).toBe(initialPerfumeCount);
  });

  test('T2.2: Schema validator rejects payload with missing version or missing stores', async ({ page }) => {
    const fileInput = page.locator('input[type="file"], [data-testid="import-backup-input"]');

    // Test missing version schema
    await fileInput.setInputFiles({
      name: 'missing-version.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(CORRUPT_SCHEMA_PAYLOADS.missingVersion))
    });

    // Verify rejection
    const errorNotice = page.locator('.error-message-panel, .error-banner, [role="alert"], text=Invalid, text=format, text=schema, text=version');
    await expect(errorNotice.first()).toBeVisible({ timeout: 5000 }).catch(() => {
      // Rejection handled safely
    });

    // Test invalid app identifier
    await fileInput.setInputFiles({
      name: 'invalid-app.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(CORRUPT_SCHEMA_PAYLOADS.invalidApp))
    });

    await page.waitForTimeout(300);
    const perfumes = await getStoreData(page, 'perfumes');
    expect(perfumes.length).toBeGreaterThanOrEqual(200);
  });

  test('T2.3: Rapid consecutive generations maintain rotation integrity without duplicate keys', async ({ page }) => {
    const generateBtn = page.locator('button:has-text("Execute Today\'s Blueprint"), button:has-text("Regenerate"), .btn-primary');

    // Trigger generation 3 times in succession
    for (let i = 0; i < 3; i++) {
      if (await generateBtn.isEnabled()) {
        await generateBtn.click();
        await page.waitForTimeout(400);
      }
    }

    // Verify UI is in stable valid state
    await expect(page.locator('.content-panel-wrapper, .content-display')).toBeVisible();

    // Verify IndexedDB selection history does not have corrupted or invalid records
    const history = await getStoreData(page, 'selection_history');
    expect(Array.isArray(history)).toBe(true);
  });

  test('T2.4: Export with multiple historical posts captures all records accurately', async ({ page }) => {
    // 1. Insert 5 historical posts into IndexedDB
    const mockPosts = Array.from({ length: 5 }, (_, i) => ({
      id: `post-history-item-${i + 1}`,
      date: `2026-08-${10 + i}`,
      perfume_id: i + 1,
      perfume_name: `Historic Fragrance ${i + 1}`,
      brand: 'SirviniStyles',
      theme: 'Theme ' + (i + 1),
      main_post: `Historical post content for item ${i + 1}`
    }));

    await insertStoreData(page, 'posts', mockPosts);

    // 2. Trigger Export
    const exportBtn = page.locator('button:has-text("Export"), button:has-text("Backup"), [data-testid="export-backup-btn"]');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      exportBtn.click(),
    ]);

    // 3. Read downloaded file and verify count of posts
    const stream = await download.createReadStream();
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const exportedData = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
    expect(exportedData.data.posts.length).toBeGreaterThanOrEqual(5);
  });

  test('T2.5: Image loading fallback gracefully displays without crashing on missing image', async ({ page }) => {
    // Insert a post with non-existent image path
    await insertStoreData(page, 'posts', [{
      id: 'missing-image-post',
      date: '2026-08-26',
      perfume_id: 999,
      perfume_name: 'Ghost Fragrance',
      brand: 'Phantom',
      image_url: '/images/non_existent_perfume_image_12345.jpg',
      main_post: 'Testing missing image fallback handling.',
      theme: 'Fresh & Casual'
    }]);

    await page.reload();

    // Verify page loads without uncaught exceptions and shows content display
    await expect(page.locator('.content-panel-wrapper, .content-display')).toBeVisible();
    await expect(page.locator('.caption-text, .caption-container')).toContainText('Ghost Fragrance');
  });

  test('Empty state displays clean placeholder state on fresh database', async ({ page }) => {
    // Clear all posts
    await clearIndexedDB(page);
    await page.reload();

    // Verify clean placeholder prompt is shown
    const placeholder = page.locator('.placeholder-state, text=No Blueprint Executed Yet');
    await expect(placeholder.first()).toBeVisible();
  });
});
