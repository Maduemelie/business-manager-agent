import { openAppDB, getAllFromStore, STORES } from './db';

/**
 * @typedef {Object} BackupPayload
 * @property {string} app
 * @property {number} version
 * @property {string} exported_at
 * @property {Object} data
 * @property {Array<Object>} data.perfumes
 * @property {Array<Object>} data.posts
 * @property {Array<Object>} data.selection_history
 * @property {Array<Object>} data.app_settings
 */

/**
 * Reads all data from all IndexedDB object stores and wraps it in a versioned export envelope.
 * 
 * @returns {Promise<BackupPayload>}
 */
export async function exportAppData() {
  const [perfumes, posts, selection_history, app_settings] = await Promise.all([
    getAllFromStore(STORES.PERFUMES),
    getAllFromStore(STORES.POSTS),
    getAllFromStore(STORES.SELECTION_HISTORY),
    getAllFromStore(STORES.SETTINGS)
  ]);

  const payload = {
    app: 'sirvinistyles',
    version: 1,
    exported_at: new Date().toISOString(),
    data: {
      perfumes: perfumes || [],
      posts: posts || [],
      selection_history: selection_history || [],
      app_settings: app_settings || []
    }
  };

  return payload;
}

/**
 * Triggers a browser file download of the backup JSON payload.
 * 
 * @param {BackupPayload} payload 
 * @param {string} [filename] 
 */
export function downloadBackupFile(payload, filename) {
  const defaultDateStr = new Date().toISOString().slice(0, 10);
  const defaultFilename = `sirvinistyles-backup-${defaultDateStr}.json`;
  const targetFilename = filename || defaultFilename;

  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  if (typeof document !== 'undefined') {
    const link = document.createElement('a');
    link.href = url;
    link.download = targetFilename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up memory
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  }
}

/**
 * Validates a backup object or JSON string against the strict version 1 schema.
 * 
 * @param {any} jsonContent 
 * @returns {{ valid: boolean, error?: string, parsed?: BackupPayload }}
 */
export function validateBackupSchema(jsonContent) {
  let parsed = jsonContent;

  if (typeof jsonContent === 'string') {
    try {
      parsed = JSON.parse(jsonContent);
    } catch (e) {
      return {
        valid: false,
        error: `Invalid JSON format: Failed to parse backup file content (${e.message}).`
      };
    }
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      valid: false,
      error: 'Invalid backup schema: Root element must be a valid JSON object.'
    };
  }

  if (parsed.app !== 'sirvinistyles') {
    return {
      valid: false,
      error: `Invalid backup identifier: Expected app="sirvinistyles", received "${parsed.app}".`
    };
  }

  if (parsed.version !== 1) {
    return {
      valid: false,
      error: `Unsupported backup version: Expected version 1, received ${parsed.version}.`
    };
  }

  if (!parsed.data || typeof parsed.data !== 'object' || Array.isArray(parsed.data)) {
    return {
      valid: false,
      error: 'Invalid backup schema: Missing or invalid "data" container object.'
    };
  }

  const { perfumes, posts, selection_history, app_settings } = parsed.data;

  if (!Array.isArray(perfumes)) {
    return {
      valid: false,
      error: 'Invalid backup schema: "data.perfumes" must be an array.'
    };
  }

  if (!Array.isArray(posts)) {
    return {
      valid: false,
      error: 'Invalid backup schema: "data.posts" must be an array.'
    };
  }

  if (!Array.isArray(selection_history)) {
    return {
      valid: false,
      error: 'Invalid backup schema: "data.selection_history" must be an array.'
    };
  }

  if (!Array.isArray(app_settings)) {
    return {
      valid: false,
      error: 'Invalid backup schema: "data.app_settings" must be an array.'
    };
  }

  // Validate perfume objects structure if perfumes array is present
  for (let i = 0; i < perfumes.length; i++) {
    const item = perfumes[i];
    if (!item || typeof item !== 'object') {
      return {
        valid: false,
        error: `Invalid perfume item at index ${i}: Must be a valid object.`
      };
    }
    if (item.id === undefined || item.id === null) {
      return {
        valid: false,
        error: `Invalid perfume item at index ${i}: Missing required field "id".`
      };
    }
    if (!item.name && !item.perfume_name) {
      return {
        valid: false,
        error: `Invalid perfume item at index ${i} (${item.id}): Missing required field "name" or "perfume_name".`
      };
    }
    if (item.brand === undefined || item.brand === null) {
      return {
        valid: false,
        error: `Invalid perfume item at index ${i} (${item.id}): Missing required field "brand".`
      };
    }
  }

  return {
    valid: true,
    parsed
  };
}

/**
 * Validates, clears all stores, and restores full application data in a single transactional batch.
 * 
 * @param {any} jsonContent 
 * @returns {Promise<{ success: boolean, stats: { perfumes: number, posts: number, selection_history: number, app_settings: number } }>}
 */
export async function importAppData(jsonContent) {
  const validation = validateBackupSchema(jsonContent);
  if (!validation.valid) {
    throw new Error(validation.error || 'Failed to validate backup schema.');
  }

  const payload = validation.parsed;
  const db = await openAppDB();

  const storeNames = [
    STORES.PERFUMES,
    STORES.POSTS,
    STORES.SELECTION_HISTORY,
    STORES.SETTINGS
  ];

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeNames, 'readwrite');

      // Clear all stores first
      for (const storeName of storeNames) {
        tx.objectStore(storeName).clear();
      }

      // 1. Insert Perfumes with normalisation
      const perfumeStore = tx.objectStore(STORES.PERFUMES);
      for (const p of payload.data.perfumes) {
        const normalized = {
          ...p,
          name: p.name || p.perfume_name,
          perfume_name: p.perfume_name || p.name,
          image_url: p.image_url || (p.image_filename ? `/images/${p.image_filename}` : '/images/default_perfume.jpg')
        };
        perfumeStore.put(normalized);
      }

      // 2. Insert Posts
      const postStore = tx.objectStore(STORES.POSTS);
      for (const post of payload.data.posts) {
        postStore.put(post);
      }

      // 3. Insert Selection History with keyPath normalisation
      const historyStore = tx.objectStore(STORES.SELECTION_HISTORY);
      for (const historyItem of payload.data.selection_history) {
        let record = historyItem;
        if (typeof record === 'object' && record !== null) {
          if (record.perfume_id === undefined && record.id !== undefined) {
            record = { ...record, perfume_id: record.id };
          }
        }
        historyStore.put(record);
      }

      // 4. Insert Settings
      const settingsStore = tx.objectStore(STORES.SETTINGS);
      for (const setting of payload.data.app_settings) {
        settingsStore.put(setting);
      }

      tx.oncomplete = () => {
        resolve({
          success: true,
          stats: {
            perfumes: payload.data.perfumes.length,
            posts: payload.data.posts.length,
            selection_history: payload.data.selection_history.length,
            app_settings: payload.data.app_settings.length
          }
        });
      };

      tx.onerror = () => {
        reject(tx.error || new Error('Database transaction failed during backup import.'));
      };

      tx.onabort = () => {
        reject(new Error('Database transaction aborted during backup import.'));
      };
    } catch (err) {
      reject(err);
    }
  });
}
