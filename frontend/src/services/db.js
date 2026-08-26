import seedPerfumes from '../data/seedPerfumes.json';

export const DB_NAME = 'sirvinistyles_db';
export const DB_VERSION = 1;

export const STORES = {
  PERFUMES: 'perfumes',
  POSTS: 'posts',
  SELECTION_HISTORY: 'selection_history',
  SETTINGS: 'app_settings'
};

let dbInstance = null;
let dbPromise = null;

/**
 * Opens or returns the cached IndexedDB database connection.
 * Creates required object stores and indexes on upgrade.
 * @returns {Promise<IDBDatabase>}
 */
export function openAppDB() {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB is not supported in this environment.'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // 1. Perfumes Store
      if (!db.objectStoreNames.contains(STORES.PERFUMES)) {
        const perfumeStore = db.createObjectStore(STORES.PERFUMES, { keyPath: 'id' });
        perfumeStore.createIndex('category', 'category', { unique: false });
        perfumeStore.createIndex('brand', 'brand', { unique: false });
        perfumeStore.createIndex('perfume_name', 'perfume_name', { unique: false });
        perfumeStore.createIndex('name', 'name', { unique: false });
      }

      // 2. Posts Store
      if (!db.objectStoreNames.contains(STORES.POSTS)) {
        const postStore = db.createObjectStore(STORES.POSTS, { keyPath: 'id' });
        postStore.createIndex('date', 'date', { unique: false });
        postStore.createIndex('created_at', 'created_at', { unique: false });
        postStore.createIndex('perfume_id', 'perfume_id', { unique: false });
      }

      // 3. Selection History Store
      if (!db.objectStoreNames.contains(STORES.SELECTION_HISTORY)) {
        const historyStore = db.createObjectStore(STORES.SELECTION_HISTORY, { keyPath: 'perfume_id' });
        historyStore.createIndex('selected_at', 'selected_at', { unique: false });
      }

      // 4. App Settings Store
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      dbInstance.onversionchange = () => {
        dbInstance.close();
        dbInstance = null;
        dbPromise = null;
      };
      dbInstance.onclose = () => {
        dbInstance = null;
        dbPromise = null;
      };
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      dbPromise = null;
      dbInstance = null;
      reject(event.target.error || new Error('Failed to open IndexedDB database.'));
    };
  });

  return dbPromise;
}

/**
 * Retrieves all records from a specified store.
 * @param {string} storeName 
 * @returns {Promise<Array<any>>}
 */
export async function getAllFromStore(storeName) {
  const db = await openAppDB();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Retrieves a single record by key from a store.
 * @param {string} storeName 
 * @param {any} key 
 * @returns {Promise<any>}
 */
export async function getFromStore(storeName, key) {
  const db = await openAppDB();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Saves or updates a record in a store.
 * @param {string} storeName 
 * @param {any} value 
 * @param {any} [key] 
 * @returns {Promise<any>}
 */
export async function putToStore(storeName, value, key) {
  const db = await openAppDB();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      
      // Ensure selection_history items have a valid perfume_id keyPath
      let record = value;
      if (storeName === STORES.SELECTION_HISTORY && typeof record === 'object' && record !== null) {
        if (record.perfume_id === undefined && record.id !== undefined) {
          record = { ...record, perfume_id: record.id };
        }
      }

      const request = key !== undefined ? store.put(record, key) : store.put(record);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Inserts or updates multiple records in a store in a single transaction.
 * @param {string} storeName 
 * @param {Array<any>} items 
 * @returns {Promise<void>}
 */
export async function putManyToStore(storeName, items) {
  if (!Array.isArray(items) || items.length === 0) return;
  const db = await openAppDB();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      for (const item of items) {
        let record = item;
        if (storeName === STORES.SELECTION_HISTORY && typeof record === 'object' && record !== null) {
          if (record.perfume_id === undefined && record.id !== undefined) {
            record = { ...record, perfume_id: record.id };
          }
        }
        store.put(record);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Deletes a record by key from a store.
 * @param {string} storeName 
 * @param {any} key 
 * @returns {Promise<void>}
 */
export async function deleteFromStore(storeName, key) {
  const db = await openAppDB();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Deletes multiple records by their keys from a store.
 * @param {string} storeName 
 * @param {Array<any>} keys 
 * @returns {Promise<void>}
 */
export async function deleteManyFromStore(storeName, keys) {
  if (!Array.isArray(keys) || keys.length === 0) return;
  const db = await openAppDB();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      for (const key of keys) {
        store.delete(key);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Clears all records from a specific store.
 * @param {string} storeName 
 * @returns {Promise<void>}
 */
export async function clearStore(storeName) {
  const db = await openAppDB();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Clears all records from all object stores in the database.
 * @returns {Promise<void>}
 */
export async function clearAllStores() {
  const db = await openAppDB();
  return new Promise((resolve, reject) => {
    try {
      const storeNames = Object.values(STORES);
      const tx = db.transaction(storeNames, 'readwrite');
      for (const storeName of storeNames) {
        tx.objectStore(storeName).clear();
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Returns the count of items in a store.
 * @param {string} storeName 
 * @returns {Promise<number>}
 */
export async function countStore(storeName) {
  const db = await openAppDB();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Automatically populates the 'perfumes' store with seed catalog data if currently empty.
 * @returns {Promise<void>}
 */
export async function seedDatabaseIfEmpty() {
  await openAppDB();
  const count = await countStore(STORES.PERFUMES);
  if (count === 0 && Array.isArray(seedPerfumes) && seedPerfumes.length > 0) {
    // Normalise perfumes ensuring both name and perfume_name exist
    const normalizedPerfumes = seedPerfumes.map(p => ({
      ...p,
      name: p.name || p.perfume_name,
      perfume_name: p.perfume_name || p.name,
      image_url: p.image_url || (p.image_filename ? `/images/${p.image_filename}` : '/images/default_perfume.jpg')
    }));

    await putManyToStore(STORES.PERFUMES, normalizedPerfumes);
    await putToStore(STORES.SETTINGS, {
      key: 'seed_info',
      seeded_at: new Date().toISOString(),
      count: normalizedPerfumes.length,
      version: 1
    });
  }
}
