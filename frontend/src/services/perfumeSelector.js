import {
  STORES,
  getAllFromStore,
  getFromStore,
  putToStore,
  deleteManyFromStore,
  seedDatabaseIfEmpty
} from './db';

/**
 * Retrieves all catalog perfumes from IndexedDB (auto-seeding if empty).
 * @returns {Promise<Array<Object>>}
 */
export async function getAllPerfumes() {
  await seedDatabaseIfEmpty();
  return await getAllFromStore(STORES.PERFUMES);
}

/**
 * Retrieves all perfumes belonging to a specific category.
 * @param {string} category 
 * @returns {Promise<Array<Object>>}
 */
export async function getPerfumesByCategory(category) {
  const all = await getAllPerfumes();
  return all.filter((p) => p.category === category);
}

/**
 * Retrieves a single perfume by its numeric ID.
 * @param {number|string} id 
 * @returns {Promise<Object|null>}
 */
export async function getPerfumeById(id) {
  const numId = Number(id);
  const perfume = await getFromStore(STORES.PERFUMES, numId);
  if (perfume) return perfume;

  // Fallback scan if key retrieval returned null
  const all = await getAllPerfumes();
  return all.find((p) => Number(p.id) === numId) || null;
}

/**
 * Retrieves the set of perfume IDs present in selection history.
 * @returns {Promise<Set<number>>}
 */
export async function getRecentlyUsedIds() {
  const history = await getAllFromStore(STORES.SELECTION_HISTORY);
  const ids = new Set();
  for (const item of history) {
    const pid = item.perfume_id !== undefined ? Number(item.perfume_id) : (item.id !== undefined ? Number(item.id) : null);
    if (pid !== null && !isNaN(pid)) {
      ids.add(pid);
    }
  }
  return ids;
}

/**
 * Records a perfume ID in selection history.
 * @param {number} perfumeId 
 * @returns {Promise<void>}
 */
export async function recordSelection(perfumeId) {
  const numId = Number(perfumeId);
  await putToStore(STORES.SELECTION_HISTORY, {
    perfume_id: numId,
    id: numId,
    selected_at: new Date().toISOString(),
    date: new Date().toISOString().split('T')[0]
  });
}

/**
 * Removes a list of perfume IDs from the selection history.
 * @param {Array<number>} perfumeIds 
 * @returns {Promise<void>}
 */
export async function resetSelectionHistoryFor(perfumeIds) {
  if (!Array.isArray(perfumeIds) || perfumeIds.length === 0) return;
  const numIds = perfumeIds.map(Number);
  await deleteManyFromStore(STORES.SELECTION_HISTORY, numIds);
}

/**
 * Selects a perfume for the day based on category and rotation history.
 * @param {string} category 
 * @param {number|string} [explicitId] 
 * @returns {Promise<Object|null>}
 */
export async function selectPerfume(category, explicitId = null) {
  if (explicitId !== null && explicitId !== undefined) {
    const explicit = await getPerfumeById(explicitId);
    if (explicit) {
      await recordSelection(explicit.id);
      return explicit;
    }
  }

  // 1. Fetch perfumes in category
  let perfumes = await getPerfumesByCategory(category);
  if (!perfumes || perfumes.length === 0) {
    perfumes = await getAllPerfumes();
  }

  if (!perfumes || perfumes.length === 0) {
    return null;
  }

  // 2. Filter out recently used IDs
  const recentlyUsed = await getRecentlyUsedIds();
  let available = perfumes.filter((p) => !recentlyUsed.has(Number(p.id)));

  // 3. Reset history for category subset if all exhausted
  if (available.length === 0) {
    const categoryIds = perfumes.map((p) => Number(p.id));
    await resetSelectionHistoryFor(categoryIds);
    available = perfumes;
  }

  // 4. Random choice from available
  const selectedIndex = Math.floor(Math.random() * available.length);
  const selected = available[selectedIndex];

  // 5. Record selection
  await recordSelection(selected.id);
  return selected;
}
