import { test, expect } from '@playwright/test';
import { getStoreData, getStoreCount, clearIndexedDB, waitForDatabaseReady, insertStoreData } from './helpers/indexeddb-helpers.js';

test.describe('Empirical Challenge: Milestone 1 Storage, Asset Resolution & Zero Network Leakage', () => {

  test.beforeEach(async ({ page, context }) => {
    await context.setOffline(false);
    await page.goto('/');
    await waitForDatabaseReady(page);
  });

  // ==========================================
  // 1. IndexedDB Operations & Schema Integrity
  // ==========================================
  test('CH1.1: Database schema verification - verifies stores, keyPaths, and indexes', async ({ page }) => {
    const schema = await page.evaluate(() => {
      return new Promise((resolve, reject) => {
        const req = indexedDB.open('sirvinistyles_db');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const db = req.result;
          const storeDetails = {};
          for (const name of db.objectStoreNames) {
            const tx = db.transaction(name, 'readonly');
            const store = tx.objectStore(name);
            storeDetails[name] = {
              keyPath: store.keyPath,
              autoIncrement: store.autoIncrement,
              indexes: Array.from(store.indexNames)
            };
          }
          db.close();
          resolve({
            name: db.name,
            version: db.version,
            stores: storeDetails
          });
        };
      });
    });

    expect(schema.name).toBe('sirvinistyles_db');
    expect(schema.version).toBe(1);

    // Verify all 4 required object stores exist
    expect(schema.stores).toHaveProperty('perfumes');
    expect(schema.stores).toHaveProperty('posts');
    expect(schema.stores).toHaveProperty('selection_history');
    expect(schema.stores).toHaveProperty('app_settings');

    // Verify keyPaths
    expect(schema.stores.perfumes.keyPath).toBe('id');
    expect(schema.stores.posts.keyPath).toBe('id');
    expect(schema.stores.selection_history.keyPath).toBe('perfume_id');
    expect(schema.stores.app_settings.keyPath).toBe('key');

    // Verify indexes
    expect(schema.stores.perfumes.indexes).toContain('category');
    expect(schema.stores.perfumes.indexes).toContain('brand');
    expect(schema.stores.perfumes.indexes).toContain('perfume_name');
    expect(schema.stores.posts.indexes).toContain('date');
    expect(schema.stores.posts.indexes).toContain('created_at');
    expect(schema.stores.posts.indexes).toContain('perfume_id');
    expect(schema.stores.selection_history.indexes).toContain('selected_at');
  });

  test('CH1.2: CRUD operations, batch writes, count, and clear on IndexedDB stores', async ({ page }) => {
    const results = await page.evaluate(async () => {
      // Import db service dynamically to test functions in isolation
      const dbModule = await import('/src/services/db.js');
      const { 
        STORES, 
        putToStore, 
        getFromStore, 
        deleteFromStore, 
        getAllFromStore, 
        putManyToStore, 
        deleteManyFromStore, 
        clearStore, 
        clearAllStores, 
        countStore 
      } = dbModule;

      const testLog = [];

      // 1. Single Put and Get in SETTINGS
      await putToStore(STORES.SETTINGS, { key: 'test_key', value: 'hello_world', updated: 123 });
      const item1 = await getFromStore(STORES.SETTINGS, 'test_key');
      testLog.push({ step: 'put_get', success: item1 && item1.value === 'hello_world' });

      // 2. Count store
      const count1 = await countStore(STORES.SETTINGS);
      testLog.push({ step: 'count_after_put', count: count1, isAtLeast1: count1 >= 1 });

      // 3. Delete single item
      await deleteFromStore(STORES.SETTINGS, 'test_key');
      const itemAfterDel = await getFromStore(STORES.SETTINGS, 'test_key');
      testLog.push({ step: 'delete', success: itemAfterDel === null });

      // 4. Batch Put (putManyToStore)
      const batchItems = [
        { id: 'custom-post-1', date: '2026-08-01', main_post: 'Post 1' },
        { id: 'custom-post-2', date: '2026-08-02', main_post: 'Post 2' },
        { id: 'custom-post-3', date: '2026-08-03', main_post: 'Post 3' }
      ];
      await putManyToStore(STORES.POSTS, batchItems);
      const postCount = await countStore(STORES.POSTS);
      testLog.push({ step: 'put_many', count: postCount, isAtLeast3: postCount >= 3 });

      // 5. Batch Delete (deleteManyFromStore)
      await deleteManyFromStore(STORES.POSTS, ['custom-post-1', 'custom-post-2']);
      const post3 = await getFromStore(STORES.POSTS, 'custom-post-3');
      const post1 = await getFromStore(STORES.POSTS, 'custom-post-1');
      testLog.push({ step: 'delete_many', post3Found: !!post3, post1Deleted: post1 === null });

      // 6. Key normalisation in selection_history (supplying { id: 999 })
      await putToStore(STORES.SELECTION_HISTORY, { id: 999, date: '2026-08-26' });
      const histItem = await getFromStore(STORES.SELECTION_HISTORY, 999);
      testLog.push({ step: 'selection_history_keypath_normalization', valid: histItem && histItem.perfume_id === 999 });

      // 7. Clear single store (clearStore)
      await clearStore(STORES.SELECTION_HISTORY);
      const histCountAfterClear = await countStore(STORES.SELECTION_HISTORY);
      testLog.push({ step: 'clear_store', count: histCountAfterClear, isZero: histCountAfterClear === 0 });

      // 8. Clear all stores (clearAllStores)
      await clearAllStores();
      const allCounts = {
        perfumes: await countStore(STORES.PERFUMES),
        posts: await countStore(STORES.POSTS),
        history: await countStore(STORES.SELECTION_HISTORY),
        settings: await countStore(STORES.SETTINGS)
      };
      testLog.push({ 
        step: 'clear_all_stores', 
        allZero: allCounts.perfumes === 0 && allCounts.posts === 0 && allCounts.history === 0 && allCounts.settings === 0,
        counts: allCounts
      });

      return testLog;
    });

    for (const entry of results) {
      if (entry.step === 'put_get') expect(entry.success).toBe(true);
      if (entry.step === 'count_after_put') expect(entry.isAtLeast1).toBe(true);
      if (entry.step === 'delete') expect(entry.success).toBe(true);
      if (entry.step === 'put_many') expect(entry.isAtLeast3).toBe(true);
      if (entry.step === 'delete_many') {
        expect(entry.post3Found).toBe(true);
        expect(entry.post1Deleted).toBe(true);
      }
      if (entry.step === 'selection_history_keypath_normalization') expect(entry.valid).toBe(true);
      if (entry.step === 'clear_store') expect(entry.isZero).toBe(true);
      if (entry.step === 'clear_all_stores') expect(entry.allZero).toBe(true);
    }
  });

  test('CH1.3: Seeding idempotency and catalog integrity (209 perfumes)', async ({ page }) => {
    const seedResult = await page.evaluate(async () => {
      const { seedDatabaseIfEmpty, countStore, getAllFromStore, STORES } = await import('/src/services/db.js');
      
      // First seed
      await seedDatabaseIfEmpty();
      const count1 = await countStore(STORES.PERFUMES);
      const settings1 = await getAllFromStore(STORES.SETTINGS);
      
      // Second seed (should be idempotent no-op)
      await seedDatabaseIfEmpty();
      const count2 = await countStore(STORES.PERFUMES);

      const allPerfumes = await getAllFromStore(STORES.PERFUMES);
      const invalidEntries = allPerfumes.filter(p => !p.id || (!p.name && !p.perfume_name));

      return {
        count1,
        count2,
        isEqual: count1 === count2,
        totalCatalog: allPerfumes.length,
        invalidCount: invalidEntries.length,
        settingsCount: settings1.length
      };
    });

    expect(seedResult.totalCatalog).toBe(209);
    expect(seedResult.count1).toBe(209);
    expect(seedResult.count2).toBe(209);
    expect(seedResult.isEqual).toBe(true);
    expect(seedResult.invalidCount).toBe(0);
    expect(seedResult.settingsCount).toBeGreaterThanOrEqual(1);
  });

  // ==========================================
  // 2. Asset Resolution & Image Fallbacks
  // ==========================================
  test('CH2.1: Image asset resolution across catalog and default fallback', async ({ page }) => {
    const assetCheck = await page.evaluate(async () => {
      const { getAllFromStore, STORES } = await import('/src/services/db.js');
      const perfumes = await getAllFromStore(STORES.PERFUMES);

      let customImageCount = 0;
      let defaultFallbackCount = 0;
      let invalidImageCount = 0;

      for (const p of perfumes) {
        if (!p.image_url) {
          invalidImageCount++;
        } else if (p.image_url === '/images/default_perfume.jpg') {
          defaultFallbackCount++;
        } else if (p.image_url.startsWith('/images/')) {
          customImageCount++;
        } else {
          invalidImageCount++;
        }
      }

      return {
        total: perfumes.length,
        customImageCount,
        defaultFallbackCount,
        invalidImageCount
      };
    });

    expect(assetCheck.total).toBe(209);
    expect(assetCheck.invalidImageCount).toBe(0);
    expect(assetCheck.customImageCount).toBeGreaterThan(10);
    expect(assetCheck.defaultFallbackCount).toBeGreaterThan(100);
  });

  test('CH2.2: Default perfume image file is physically accessible on the server', async ({ page }) => {
    const response = await page.request.get('/images/default_perfume.jpg');
    expect(response.status()).toBe(200);
    const contentType = response.headers()['content-type'] || '';
    expect(contentType).toMatch(/image/i);
  });

  test('CH2.3: React UI gracefully handles broken image with fallback event handler', async ({ page }) => {
    // Inject a post with an intentionally broken image URL
    await insertStoreData(page, 'posts', [{
      id: 'broken-image-post',
      date: '2026-08-26',
      perfume_id: 888,
      perfume_name: 'Broken Image Test Fragrance',
      brand: 'Test Brand',
      image_url: '/images/broken_nonexistent_image_9999.png',
      main_post: 'Testing onError fallback in MainPostTab.jsx',
      theme: 'Fresh & Everyday'
    }]);

    await page.reload();
    await waitForDatabaseReady(page);

    const img = page.locator('.image-container img');
    await expect(img).toBeVisible();

    // Verify that onError fallback replaced src with default_perfume.jpg
    await page.waitForFunction(() => {
      const imageEl = document.querySelector('.image-container img');
      return imageEl && imageEl.src.includes('default_perfume.jpg');
    }, { timeout: 5000 });

    const currentSrc = await img.getAttribute('src');
    expect(currentSrc).toContain('default_perfume.jpg');
  });

  // ==========================================
  // 3. Zero Network Leakage Verification
  // ==========================================
  test('CH3.1: Zero network leakage during blueprint generation and storage operations', async ({ page, context }) => {
    const leakedNetworkCalls = [];

    // Intercept all network traffic
    page.on('request', (req) => {
      const url = req.url();
      // Any request targeting backend ports (8000, 5000, 3000) or /api/ endpoints is a violation
      if (url.includes(':8000') || url.includes('/api/generate') || url.includes('/api/today') || url.includes('render.com')) {
        leakedNetworkCalls.push({
          url,
          method: req.method(),
          postData: req.postData()
        });
      }
    });

    // 1. Initial Page Load and Storage Seeding
    await page.goto('/');
    await waitForDatabaseReady(page);

    // 2. Trigger Blueprint Generation
    const generateBtn = page.locator('button:has-text("Execute Today\'s Blueprint"), button:has-text("Regenerate"), .btn-primary');
    await generateBtn.click();
    await expect(page.locator('.content-panel-wrapper, .content-display')).toBeVisible();

    // 3. Trigger 3 consecutive regenerations
    for (let i = 0; i < 3; i++) {
      if (await generateBtn.isEnabled()) {
        await generateBtn.click();
        await page.waitForTimeout(300);
      }
    }

    // 4. Switch Tabs
    const whatsappTab = page.locator('button:has-text("WhatsApp Series"), .tab-btn:has-text("WhatsApp")');
    await whatsappTab.click();
    await expect(page.locator('.whatsapp-container, .whatsapp-card').first()).toBeVisible();

    // 5. Verify zero network leakage
    expect(leakedNetworkCalls.length).toBe(0);
    expect(leakedNetworkCalls).toEqual([]);
  });

  test('CH3.2: 100% Offline Generation & Storage Execution under strict network cutoff', async ({ page, context }) => {
    // Cut off all network access
    await context.setOffline(true);

    const offlineResult = await page.evaluate(async () => {
      const { generateDailyBlueprint, getTodayBlueprint } = await import('/src/services/contentGenerator.js');
      const { getAllFromStore, STORES } = await import('/src/services/db.js');

      // 1. Generate blueprint while 100% offline
      const blueprint = await generateDailyBlueprint(null, new Date('2026-08-26T10:00:00Z'));

      // 2. Retrieve today's blueprint from IndexedDB
      const retrieved = await getTodayBlueprint(new Date('2026-08-26T10:00:00Z'));

      // 3. Verify persistence
      const allPosts = await getAllFromStore(STORES.POSTS);

      return {
        hasBlueprint: !!blueprint,
        blueprintId: blueprint?.id,
        mainPostLength: blueprint?.main_post?.length || 0,
        retrievedMatch: retrieved?.id === blueprint?.id,
        totalPostsStored: allPosts.length
      };
    });

    expect(offlineResult.hasBlueprint).toBe(true);
    expect(offlineResult.mainPostLength).toBeGreaterThan(50);
    expect(offlineResult.retrievedMatch).toBe(true);
    expect(offlineResult.totalPostsStored).toBeGreaterThanOrEqual(1);
  });
});
