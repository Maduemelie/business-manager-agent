/**
 * IndexedDB helper utilities for Playwright E2E tests.
 * Operates directly on the browser's IndexedDB instance for opaque verification.
 */

const DB_NAME = 'sirvinistyles_db';

/**
 * Reads all records from a given store in sirvinistyles_db.
 * @param {import('@playwright/test').Page} page 
 * @param {string} storeName 
 * @returns {Promise<Array<any>>}
 */
export async function getStoreData(page, storeName) {
  return await page.evaluate(
    ({ dbName, store }) => {
      return new Promise((resolve, reject) => {
        const req = indexedDB.open(dbName);
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(store)) {
            db.close();
            return resolve([]);
          }
          const tx = db.transaction(store, 'readonly');
          const objectStore = tx.objectStore(store);
          const getReq = objectStore.getAll();
          getReq.onsuccess = () => {
            db.close();
            resolve(getReq.result);
          };
          getReq.onerror = () => {
            db.close();
            reject(getReq.error);
          };
        };
      });
    },
    { dbName: DB_NAME, store: storeName }
  );
}

/**
 * Returns record count in a store.
 * @param {import('@playwright/test').Page} page 
 * @param {string} storeName 
 * @returns {Promise<number>}
 */
export async function getStoreCount(page, storeName) {
  const records = await getStoreData(page, storeName);
  return records.length;
}

/**
 * Clears all object stores in the IndexedDB database.
 * @param {import('@playwright/test').Page} page 
 */
export async function clearIndexedDB(page) {
  return await page.evaluate(({ dbName }) => {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(dbName);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => {
        const db = req.result;
        const storeNames = Array.from(db.objectStoreNames);
        if (storeNames.length === 0) {
          db.close();
          return resolve();
        }
        const tx = db.transaction(storeNames, 'readwrite');
        storeNames.forEach((s) => tx.objectStore(s).clear());
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      };
    });
  }, { dbName: DB_NAME });
}

/**
 * Inserts records directly into an object store.
 * @param {import('@playwright/test').Page} page 
 * @param {string} storeName 
 * @param {Array<any>} items 
 */
export async function insertStoreData(page, storeName, items) {
  return await page.evaluate(
    ({ dbName, store, records }) => {
      return new Promise((resolve, reject) => {
        const req = indexedDB.open(dbName);
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction(store, 'readwrite');
          const objectStore = tx.objectStore(store);
          records.forEach((item) => objectStore.put(item));
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => {
            db.close();
            reject(tx.error);
          };
        };
      });
    },
    { dbName: DB_NAME, store: storeName, records: items }
  );
}

/**
 * Waits until IndexedDB is opened and perfumes store contains items.
 * @param {import('@playwright/test').Page} page 
 * @param {number} timeoutMs 
 */
export async function waitForDatabaseReady(page, timeoutMs = 10000) {
  await page.waitForFunction(
    ({ dbName }) => {
      return new Promise((resolve) => {
        const req = indexedDB.open(dbName);
        req.onerror = () => resolve(false);
        req.onsuccess = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains('perfumes')) {
            db.close();
            return resolve(false);
          }
          const tx = db.transaction('perfumes', 'readonly');
          const countReq = tx.objectStore('perfumes').count();
          countReq.onsuccess = () => {
            const count = countReq.result;
            db.close();
            resolve(count > 0);
          };
          countReq.onerror = () => {
            db.close();
            resolve(false);
          };
        };
      });
    },
    { dbName: DB_NAME },
    { timeout: timeoutMs }
  );
}
