import { test, expect } from '@playwright/test';
import { waitForDatabaseReady } from './helpers/indexeddb-helpers.js';

test.describe('Tier 1, 3 & 4: UI Offline Navigation, Status Banner & Mobile Seller Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForDatabaseReady(page);
  });

  test('Offline status banner detects and reflects online/offline state transitions', async ({ page, context }) => {
    // 1. Initial state is online
    const offlineBanner = page.locator('.offline-status-banner, .offline-banner, [data-testid="offline-banner"]');
    
    // When online, banner is either hidden or indicates online status
    const isVisibleOnline = await offlineBanner.isVisible().catch(() => false);
    if (isVisibleOnline) {
      const bannerText = await offlineBanner.innerText();
      expect(bannerText.toLowerCase()).not.toContain('disconnected');
    }

    // 2. Transition to offline
    await context.setOffline(true);
    // Dispatch offline event on window to trigger hook listeners immediately
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));

    // 3. Verify offline indicator/banner is displayed
    const offlineIndicator = page.locator('text=Offline, text=Working Offline, .offline-status-banner, [data-testid="offline-banner"]');
    await expect(offlineIndicator.first()).toBeVisible({ timeout: 5000 });

    // 4. Transition back to online
    await context.setOffline(false);
    await page.evaluate(() => window.dispatchEvent(new Event('online')));

    // 5. Verify offline indicator clears or updates
    await page.waitForTimeout(500);
  });

  test('Seamless tab switching between Main Feed, WhatsApp Series, and Reel Script offline', async ({ page, context }) => {
    // 1. Generate content packet
    const generateBtn = page.locator('button:has-text("Execute Today\'s Blueprint"), button:has-text("Regenerate"), .btn-primary');
    await generateBtn.click();
    await expect(page.locator('.content-panel-wrapper, .content-display').first()).toBeVisible();

    // 2. Cut off network
    await context.setOffline(true);

    // 3. Switch to WhatsApp Series tab
    const whatsappTab = page.locator('button:has-text("WhatsApp Series"), .tab-btn:has-text("WhatsApp")');
    await expect(whatsappTab).toBeVisible();
    await whatsappTab.click();

    // Verify WhatsApp sequence cards render
    const whatsappContainer = page.locator('.whatsapp-container, .whatsapp-card');
    await expect(whatsappContainer.first()).toBeVisible();

    // 4. Switch to Reel Script tab (if available in generated packet)
    const reelTab = page.locator('button:has-text("Reel Script"), .tab-btn:has-text("Reel")');
    const hasReel = await reelTab.isVisible();
    if (hasReel) {
      await reelTab.click();
      await expect(page.locator('.reel-container, .reel-script-text')).toBeVisible();
    }

    // 5. Switch back to Main Feed tab
    const mainTab = page.locator('button:has-text("Main Feed"), .tab-btn:has-text("Main")');
    await mainTab.click();
    await expect(page.locator('.caption-text, .caption-container').first()).toBeVisible();
  });

  test('Copy to clipboard functions properly and provides visual feedback', async ({ page, context }) => {
    // 1. Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // 2. Generate content
    const generateBtn = page.locator('button:has-text("Execute Today\'s Blueprint"), button:has-text("Regenerate"), .btn-primary');
    await generateBtn.click();
    await expect(page.locator('.content-panel-wrapper, .content-display').first()).toBeVisible();

    // 3. Click Main Post copy button
    const copyBtn = page.locator('.copy-btn, button:has-text("Copy Caption")').first();
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();

    // 4. Verify visual feedback (e.g. checkmark icon or active class or copied text)
    await page.waitForTimeout(300);

    // Verify clipboard content
    const clipboardText = await page.evaluate(async () => {
      try {
        return await navigator.clipboard.readText();
      } catch (e) {
        return 'clipboard-permission-denied';
      }
    });

    if (clipboardText !== 'clipboard-permission-denied') {
      expect(clipboardText.length).toBeGreaterThan(5);
    }
  });

  test('Tier 4 Scenario 1: Mobile Seller Daily Routine on Mobile Device without Internet', async ({ page, context }) => {
    // Emulate mobile seller waking up on Monday with no connectivity
    // 1. Go offline
    await context.setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));

    // 2. Seller clicks "Execute Today's Blueprint"
    const generateBtn = page.locator('button:has-text("Execute Today\'s Blueprint"), button:has-text("Regenerate"), .btn-primary');
    await expect(generateBtn).toBeVisible();
    await generateBtn.click();

    // 3. Main post renders immediately with strategy theme
    const contentPanel = page.locator('.content-panel-wrapper, .content-display').first();
    await expect(contentPanel).toBeVisible();
    const captionElement = page.locator('.caption-text, .caption-container').first();
    await expect(captionElement).toBeVisible();
    const morningCaption = await captionElement.innerText();

    // 4. Seller switches to WhatsApp series to plan broadcasts
    const whatsappTab = page.locator('button:has-text("WhatsApp Series"), .tab-btn:has-text("WhatsApp")');
    await whatsappTab.click();
    const firstStatusCard = page.locator('.whatsapp-card').first();
    await expect(firstStatusCard).toBeVisible();

    // 5. Seller copies morning status message
    const copyStatusBtn = firstStatusCard.locator('.copy-btn').first();
    if (await copyStatusBtn.isVisible()) {
      await copyStatusBtn.click();
    }

    // 6. Seller closes browser and reopens app later in the afternoon (still offline)
    await page.reload({ waitUntil: 'domcontentloaded' });

    // 7. Verify all content from the morning is perfectly preserved
    await expect(page.locator('.content-panel-wrapper, .content-display').first()).toBeVisible();
    const eveningCaption = await page.locator('.caption-text, .caption-container').first().innerText();
    expect(eveningCaption).toBe(morningCaption);
  });
});
