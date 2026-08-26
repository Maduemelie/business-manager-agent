import { test, expect } from '@playwright/test';
import { getStoreData, getStoreCount, waitForDatabaseReady } from './helpers/indexeddb-helpers.js';

test.describe('Tier 1 & Tier 3: Offline-First PWA & IndexedDB Persistence', () => {
  test.beforeEach(async ({ page, context }) => {
    // Start in online state to load initial assets, then we test offline scenarios
    await context.setOffline(false);
  });

  test('T1.1: App loads with 0 backend running, initializes IndexedDB, and auto-seeds catalog', async ({ page }) => {
    await page.goto('/');

    // Verify header renders
    const header = page.locator('h1, .header');
    await expect(header).toBeVisible();
    await expect(page.locator('text=SirviniStyles').first()).toBeVisible();

    // Verify IndexedDB is initialized and seeded with 209 perfumes
    await waitForDatabaseReady(page);
    const perfumeCount = await getStoreCount(page, 'perfumes');
    expect(perfumeCount).toBeGreaterThanOrEqual(200);

    const perfumes = await getStoreData(page, 'perfumes');
    const firstPerfume = perfumes[0];
    expect(firstPerfume).toHaveProperty('name');
    expect(firstPerfume).toHaveProperty('brand');
  });

  test('T1.2: Generates daily blueprint offline and renders content tabs and strategy banner', async ({ page }) => {
    await page.goto('/');
    await waitForDatabaseReady(page);

    // Click execute blueprint button
    const generateBtn = page.locator('button:has-text("Execute Today\'s Blueprint"), button:has-text("Regenerate"), .btn-primary');
    await expect(generateBtn).toBeVisible();
    await generateBtn.click();

    // Wait for content panel to appear
    const contentPanel = page.locator('.content-panel-wrapper, .content-display');
    await expect(contentPanel).toBeVisible();

    // Verify Strategy Banner is rendered with week and theme
    const strategyBanner = page.locator('.strategy-banner, .banner-badge, text=Theme, text=Week');
    await expect(strategyBanner.first()).toBeVisible();

    // Verify Main Feed caption text is rendered
    const caption = page.locator('.caption-text, .caption-container');
    await expect(caption).toBeVisible();
    const captionText = await caption.innerText();
    expect(captionText.length).toBeGreaterThan(10);

    // Verify post was saved to IndexedDB 'posts' store
    const posts = await getStoreData(page, 'posts');
    expect(posts.length).toBeGreaterThanOrEqual(1);
    expect(posts[0]).toHaveProperty('main_post');
  });

  test('T1.3: Data persists in IndexedDB across full offline reload (setOffline(true))', async ({ page, context }) => {
    // 1. Initial load
    await page.goto('/');
    await waitForDatabaseReady(page);

    // 2. Generate a blueprint
    const generateBtn = page.locator('button:has-text("Execute Today\'s Blueprint"), button:has-text("Regenerate"), .btn-primary');
    await generateBtn.click();

    // Capture generated post title/caption
    const caption = page.locator('.caption-text, .caption-container');
    await expect(caption).toBeVisible();
    const originalCaption = await caption.innerText();

    // 3. Cut off network completely
    await context.setOffline(true);

    // 4. Reload page while offline
    await page.reload({ waitUntil: 'domcontentloaded' });

    // 5. Verify that post is re-hydrated from IndexedDB and displays exact same caption
    const postDisplay = page.locator('.caption-text, .caption-container');
    await expect(postDisplay).toBeVisible();
    const reloadedCaption = await postDisplay.innerText();
    expect(reloadedCaption).toBe(originalCaption);

    // 6. Verify image or placeholder still renders offline
    const imageOrPlaceholder = page.locator('.image-container img, .education-post-placeholder, .image-container');
    await expect(imageOrPlaceholder.first()).toBeVisible();
  });

  test('T3.3: Service Worker and IndexedDB work together under continuous offline mode', async ({ page, context }) => {
    // 1. Load app shell to populate service worker cache
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await waitForDatabaseReady(page);

    // 2. Switch to strict offline mode
    await context.setOffline(true);

    // 3. Perform generation purely client-side while offline
    const generateBtn = page.locator('button:has-text("Execute Today\'s Blueprint"), button:has-text("Regenerate"), .btn-primary');
    await generateBtn.click();

    // Verify UI updates without network errors
    const contentPanel = page.locator('.content-panel-wrapper, .content-display');
    await expect(contentPanel).toBeVisible();

    // 4. Switch tabs offline
    const whatsappTabBtn = page.locator('button:has-text("WhatsApp Series"), .tab-btn:has-text("WhatsApp")');
    await whatsappTabBtn.click();
    await expect(page.locator('.whatsapp-container, .whatsapp-card').first()).toBeVisible();

    // 5. Reload while strictly offline
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('.dashboard-container, h1:has-text("SirviniStyles")')).toBeVisible();
    await expect(page.locator('.content-panel-wrapper, .content-display')).toBeVisible();
  });
});
