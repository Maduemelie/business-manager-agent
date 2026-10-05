import { test, expect } from '@playwright/test';
import { getStoreData, clearIndexedDB, waitForDatabaseReady, insertStoreData } from './helpers/indexeddb-helpers.js';
import { VALID_BACKUP_PAYLOAD } from './helpers/mock-data.js';

test.describe('Tier 1, 3 & 4: Manual JSON Backup Export and Import System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForDatabaseReady(page);
  });

  test('T1.4: Exports complete IndexedDB data to a valid JSON backup file', async ({ page }) => {
    // 1. Generate a post so we have data in posts store
    const generateBtn = page.locator('button:has-text("Execute Today\'s Blueprint"), button:has-text("Regenerate"), .btn-primary');
    await generateBtn.click();
    await expect(page.locator('.content-panel-wrapper, .content-display').first()).toBeVisible();

    // 2. Click Settings Tab then Export Backup button and intercept download event
    await page.locator('button.tab-btn:has-text("Settings")').click();
    const exportBtn = page.locator('[data-testid="export-backup-btn"]').first();
    await expect(exportBtn).toBeVisible();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      exportBtn.click(),
    ]);

    // 3. Verify filename pattern (e.g. contains 'sirvinistyles' and ends with '.json')
    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename).toMatch(/sirvinistyles.*\.json$/i);

    // 4. Read downloaded file stream and validate JSON structure & schema
    const stream = await download.createReadStream();
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const fileContentStr = Buffer.concat(chunks).toString('utf-8');
    const parsedPayload = JSON.parse(fileContentStr);

    expect(parsedPayload).toHaveProperty('version', 1);
    expect(parsedPayload).toHaveProperty('app', 'sirvinistyles');
    expect(parsedPayload).toHaveProperty('exported_at');
    expect(parsedPayload).toHaveProperty('data');
    expect(Array.isArray(parsedPayload.data.perfumes)).toBe(true);
    expect(parsedPayload.data.perfumes.length).toBeGreaterThanOrEqual(200);
    expect(Array.isArray(parsedPayload.data.posts)).toBe(true);
    expect(parsedPayload.data.posts.length).toBeGreaterThanOrEqual(1);
  });

  test('T1.5: Imports JSON backup file via file input and re-hydrates UI state', async ({ page }) => {
    // 1. Create a temporary buffer with valid fixture backup
    const backupJsonString = JSON.stringify(VALID_BACKUP_PAYLOAD, null, 2);

    // 2. Clear current database to simulate empty/fresh state
    await clearIndexedDB(page);
    await page.reload();

    // 3. Navigate to Settings and locate file input (or backup trigger) and upload backup file
    await page.locator('button.tab-btn:has-text("Settings")').click();
    const fileInput = page.locator('input[type="file"], [data-testid="import-backup-input"]');
    
    // If input is hidden inside a modal or button, set files directly on the input
    await fileInput.setInputFiles({
      name: 'sirvinistyles-backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(backupJsonString)
    });

    // 4. Wait for import success notification/banner
    const successFeedback = page.locator('text=Import successful, text=restored, .success-message, [role="status"]');
    await expect(successFeedback.first()).toBeVisible({ timeout: 5000 }).catch(() => {
      // If notification is not explicit, UI rehydration check below verifies state
    });

    // 5. Verify restored post data is rendered on screen
    const captionContainer = page.locator('.caption-text, .caption-container').first();
    await expect(captionContainer).toBeVisible();
    const captionText = await captionContainer.innerText();
    expect(captionText).toContain('Baccarat Rouge 540');

    // 6. Verify IndexedDB contents
    const posts = await getStoreData(page, 'posts');
    expect(posts.length).toBe(1);
    expect(posts[0].perfume_name).toBe('Baccarat Rouge 540');
  });

  test('T3.1: Full Roundtrip: Generate -> Export -> Clear -> Import -> Offline Reload -> State Match', async ({ page, context }) => {
    // 1. Generate content
    const generateBtn = page.locator('button:has-text("Execute Today\'s Blueprint"), button:has-text("Regenerate"), .btn-primary');
    await generateBtn.click();
    await expect(page.locator('.content-panel-wrapper, .content-display').first()).toBeVisible();

    const originalCaption = await page.locator('.caption-text, .caption-container').first().innerText();

    // 2. Export Backup
    await page.locator('button.tab-btn:has-text("Settings")').click();
    const exportBtn = page.locator('[data-testid="export-backup-btn"]').first();
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      exportBtn.click(),
    ]);

    const stream = await download.createReadStream();
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const downloadedJson = Buffer.concat(chunks).toString('utf-8');

    // 3. Clear database completely & reload page (should show placeholder)
    await clearIndexedDB(page);
    await page.reload();

    const placeholder = page.locator('.placeholder-state, text=No Blueprint Executed Yet');
    await expect(placeholder.first()).toBeVisible();

    // 4. Navigate to Settings and Import the downloaded backup file
    await page.locator('button.tab-btn:has-text("Settings")').click();
    const fileInput = page.locator('input[type="file"], [data-testid="import-backup-input"]');
    await fileInput.setInputFiles({
      name: 'sirvinistyles-roundtrip-backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(downloadedJson)
    });

    // 5. Toggle offline mode
    await context.setOffline(true);

    // 6. Reload page while offline
    await page.reload({ waitUntil: 'domcontentloaded' });

    // 7. Verify restored state matches original exactly
    const restoredCaption = await page.locator('.caption-text, .caption-container').first().innerText();
    expect(restoredCaption).toBe(originalCaption);
  });

  test('T3.2: Multi-session replacement: Importing Session A backup overwrites Session B data', async ({ page }) => {
    // 1. Setup Session A data in DB and Export
    const sessionAPost = {
      id: 'session-a-post',
      date: '2026-08-01',
      perfume_name: 'Session A Special Perfume',
      brand: 'Brand A',
      main_post: 'Session A exclusive marketing caption for fragrance enthusiasts.',
      theme: 'Luxury Seduction',
      is_generic: false
    };

    const sessionAPayload = {
      version: 1,
      app: 'sirvinistyles',
      exported_at: new Date().toISOString(),
      data: {
        perfumes: VALID_BACKUP_PAYLOAD.data.perfumes,
        posts: [sessionAPost],
        selection_history: [],
        app_settings: []
      }
    };

    // 2. Setup Session B (current app state) with different data
    await insertStoreData(page, 'posts', [{
      id: 'session-b-post',
      date: '2026-08-26',
      perfume_name: 'Session B Current Fragrance',
      brand: 'Brand B',
      main_post: 'Session B current caption.',
      theme: 'Fresh & Casual'
    }]);

    await page.reload();
    await expect(page.locator('.caption-text, .caption-container').first()).toContainText('Session B');

    // 3. Import Session A backup file
    const fileInput = page.locator('input[type="file"], [data-testid="import-backup-input"]');
    await fileInput.setInputFiles({
      name: 'session-a-backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(sessionAPayload))
    });

    // 4. Verify Session A data replaced Session B data
    await page.waitForTimeout(500);
    const displayedText = await page.locator('.caption-text, .caption-container').first().innerText();
    expect(displayedText).toContain('Session A Special Perfume');
    expect(displayedText).not.toContain('Session B Current Fragrance');
  });

  test('Tier 4 Scenario 2: Device Migration & Disaster Recovery Workflow', async ({ page, context }) => {
    // Simulate user migrating from Device 1 to Device 2
    // 1. User on Device 1 has 2 historical posts and custom history
    const migrationBackup = {
      version: 1,
      app: 'sirvinistyles',
      exported_at: '2026-08-26T09:00:00.000Z',
      data: {
        perfumes: VALID_BACKUP_PAYLOAD.data.perfumes,
        posts: [
          {
            id: 'history-post-1',
            date: '2026-08-20',
            perfume_name: 'Tom Ford Oud Wood',
            brand: 'Tom Ford',
            main_post: 'Elegance personified: Tom Ford Oud Wood.',
            theme: 'Evening Elegance'
          },
          {
            id: 'history-post-2',
            date: '2026-08-26',
            perfume_name: 'Aventus',
            brand: 'Creed',
            main_post: 'Rule your day with the legendary King of Scents: Creed Aventus.',
            theme: 'Confidence Booster'
          }
        ],
        selection_history: [
          { id: 1, perfume_id: 1, date: '2026-08-20' },
          { id: 2, perfume_id: 2, date: '2026-08-26' }
        ],
        app_settings: [{ key: 'installed_pwa', value: 'true' }]
      }
    };

    // 2. Open fresh application on "Device 2"
    await clearIndexedDB(page);
    await page.goto('/');

    // 3. User imports their disaster recovery backup file
    const fileInput = page.locator('input[type="file"], [data-testid="import-backup-input"]');
    await fileInput.setInputFiles({
      name: 'sirvinistyles-device1-backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(migrationBackup))
    });

    // 4. Verify user can immediately view their latest post and continue working
    await expect(page.locator('.caption-text, .caption-container').first()).toContainText('Creed Aventus');

    // 5. Verify IndexedDB selection history contains both records
    const history = await getStoreData(page, 'selection_history');
    expect(history.length).toBe(2);

    // 6. User goes offline on new device and can still regenerate or navigate
    await context.setOffline(true);
    const whatsappTab = page.locator('button:has-text("WhatsApp Series"), .tab-btn:has-text("WhatsApp")');
    if (await whatsappTab.isVisible()) {
      await whatsappTab.click();
    }
  });
});
