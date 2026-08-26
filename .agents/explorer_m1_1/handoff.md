# Milestone 1 Exploration & Implementation Blueprint Report

## 1. Observation

Direct inspection of the repository files, SQLite database schema, backend services, frontend hooks, and asset directories established the following baseline facts:

### 1.1 Database & Seed Data Sources
- **SQLite Database**: `perfumes.db` located at workspace root (`c:\dev\business manager agent\perfumes.db`).
- **Database Schema**:
  - `migrations/versions/ef95cb12ff1f_initial_schema.py:24-42` defines:
    - Table `perfumes`: `id` (INTEGER PK AUTOINCREMENT), `image_filename` (TEXT), `perfume_name` (TEXT), `brand` (TEXT), `description` (TEXT), `scent_profile` (TEXT), `longevity` (TEXT), `best_for` (TEXT), `category` (TEXT), `image_generation_prompt` (TEXT).
    - Table `selection_history`: `perfume_id` (INTEGER PK), `selected_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP).
  - Total perfume records in catalog: 209 perfumes (`backend/app/scratch/migrate_sqlite_to_postgres.py:98`).
  - Target seed destination per `PROJECT.md:114`: `frontend/src/data/seedPerfumes.json`.

### 1.2 Image Assets
- Source directory: `Sirvinistyles perfume images/` containing 17 image assets:
  - `212 Men.PNG`, `5th Avenue.PNG`, `A Thousand Wishes.PNG`, `A12EB938-DEC5-4941-B97C-33A122E711FA.PNG`, `Allure Homme.PNG`, `Aqua man.PNG`, `Asad.PNG`, `Blooming Bouquet.PNG`, `Oud For Glory.PNG`, `Sexy Man.PNG`, `Soleil Blanc.PNG`, `Vip Man.PNG`, `Yara Moi (2).PNG`, `Yara Moi.PNG`, `addictive ambergris.PNG`, `default_perfume.jpg`, `supremacy Noir.PNG`.
- Target destination: `frontend/public/images/` to be served statically as `/images/<filename>`.

### 1.3 Backend Domain Logic & Generation Rules
- **Theme Engine (`backend/app/services/theme_engine.py:7-80`)**:
  - `THEMES`: 7 day-of-week pillars (0: Fragrance Spotlight, 1: Fragrance Education, 2: Fragrance Finder, 3: Perfume Lifestyle, 4: Weekend Collection, 5: Reviews & Trust, 6: Perfume Academy).
  - `CATEGORY_ROTATION`: 4 weekly categories based on day of month (Week 1: "Fresh & Everyday", Week 2: "Bold & Masculine", Week 3: "Oud & Luxury", Week 4: "Unisex & Women's").
  - `should_be_generic(day_of_week)`: Day 1 (Tuesday) & Day 3 (Thursday) have a 50% random chance of being generic; Day 6 (Sunday) is always 100% generic.
  - `requires_reel(day_of_week)`: Days 0 (Mon), 2 (Wed), 4 (Fri), 5 (Sat) require Reel scripts.
  - `get_time_of_day(hour)`: <12 Morning, <18 Afternoon, >=18 Evening.
  - `get_day_context(day_name)`: 20% chance to explicitly reveal weekday name.
- **Perfume Repository & Selector (`backend/app/repositories/perfume_repository.py:60-150` & `backend/app/services/perfume_selector.py:9-48`)**:
  - Filters by category, reads `selection_history` to exclude recently used perfume IDs.
  - If all category perfumes are exhausted in history, resets selection history for those perfume IDs and selects from full category list.
  - Updates selection history with newly chosen perfume ID.
- **Content Formatting & Schema Contract (`backend/app/models/schemas.py:43-62` & `backend/app/prompts/content_prompts.py:8-347`)**:
  - `GenerateResponse` schema contains: `id`, `date`, `perfume_id`, `perfume_name`, `brand`, `theme`, `week_of_month`, `active_category`, `is_generic`, `main_post`, `whatsapp_sequence` (4 daily slots: Morning, Midday, Evening, Night), `reel_script`, `image_url`, `generated_image_file`, `hashtags`, `keywords`, `hook`, `cta`, `image_prompt`, `engagement_question`.

### 1.4 Frontend State & API Coupling
- `frontend/src/services/api.js:1-38`: Makes axios requests to external backend (`/api/generate` and `/api/generate/today`).
- `frontend/src/hooks/useContentGenerator.js:1-53`: Queries remote backend on mount; throws error if backend is offline.
- `frontend/src/components/MainPostTab.jsx:10`: Prefixes image URL with `${apiBaseUrl}${postData.image_url}`.

---

## 2. Logic Chain

1. **Local Catalog Availability**:
   - *Observation*: The app currently queries a remote PostgreSQL/SQLite database via FastAPI.
   - *Reasoning*: To function 100% offline without a backend server, the 209 catalog perfumes from `perfumes.db` must be extracted into `frontend/src/data/seedPerfumes.json` and automatically seeded into the browser's IndexedDB on initial application launch.
2. **IndexedDB Wrapper Architecture**:
   - *Observation*: Structured data includes perfumes (209 items), daily post packets, rotation history, and settings. LocalStorage is synchronous with a ~5MB limit and lacks indexed querying.
   - *Reasoning*: A lightweight, zero-dependency Promise wrapper around native `window.indexedDB` (`frontend/src/services/db.js`) managing `sirvinistyles_db` (Version 1) with four stores (`perfumes`, `posts`, `selection_history`, `app_settings`) provides high performance, async I/O, indexed querying, and transaction safety.
3. **Client-Side Domain Logic Porting**:
   - *Observation*: `ThemeEngine` and `PerfumeSelector` are deterministic rule engines in Python.
   - *Reasoning*: Porting them directly to `frontend/src/services/themeEngine.js` and `frontend/src/services/perfumeSelector.js` allows the frontend to compute Lagos timezone calendar offsets, rotate categories, manage selection history in IndexedDB, and select perfumes deterministically.
4. **Offline Template-Based Content Generation**:
   - *Observation*: The backend uses prompt templates to generate Nigerian luxury sales copy for main posts, 4-part WhatsApp status sequences, and Reel scripts.
   - *Reasoning*: Building `frontend/src/services/contentGenerator.js` with structured, rich copywriting templates (embodying Nigerian buying psychology, status, projection, longevity, scarcity, and CTAs) ensures immediate offline generation. An extensible hook allows optional direct LLM querying if online.
5. **Asset Portability**:
   - *Observation*: Product images are in `Sirvinistyles perfume images/` and rendered via backend static mounts.
   - *Reasoning*: Copying the 17 PNG images + `default_perfume.jpg` into `frontend/public/images/` ensures Vite and the service worker serve them directly under `/images/<filename>`, working offline across all platforms.
6. **Hook & Component State Decoupling**:
   - *Observation*: `useContentGenerator.js` and `MainPostTab.jsx` depend on `api.js` and `apiBaseUrl`.
   - *Reasoning*: Replacing `api.js` calls in `useContentGenerator.js` with `contentGenerator.js` + `db.js`, adding `useAppStorage.js` for seeding lifecycle, and updating `MainPostTab.jsx` to render `/images/...` directly decouples the UI from any backend.

---

## 3. Caveats

1. **Lagos Timezone Alignment**:
   - Users opening the application in different timezones must see the identical strategy week, category, and daily post index as Lagos time (`Africa/Lagos`, UTC+1).
   - *Mitigation*: The theme engine uses `Intl.DateTimeFormat` with `timeZone: 'Africa/Lagos'` to compute day, week, month, and date keys consistently.
2. **Product Image Matching**:
   - Out of 209 perfumes, 17 have dedicated PNG product images.
   - *Mitigation*: The image resolver in `contentGenerator.js` checks for `perfume.image_filename`; if missing or null, it falls back to `/images/default_perfume.jpg` for product posts, or `null` for educational/generic posts.

---

## 4. Conclusion & Implementation Blueprint

The implementer agent must execute the following step-by-step implementation:

```
+-----------------------------------------------------------------------------------+
|                           Milestone 1 Implementation Flow                         |
|                                                                                   |
|  1. Extract Catalog     2. Copy Assets       3. IndexedDB Layer   4. Domain Engines  |
|  [extract_perfumes.py]  [Sirvinistyles       [frontend/src/       [themeEngine.js,  |
|  -> seedPerfumes.json    perfume images/] ->  services/db.js]      perfumeSelector.js|
|                         [public/images/]                               |          |
|                                                                        v          |
|  7. Verification        6. UI Decoupling     5. Content Gen     [contentGenerator]|
|  - Oxlint Check         - useAppStorage.js   - Offline luxury   - WhatsApp series |
|  - Unit & Hook test     - useContentGen.js     templates        - Reel scripts    |
|  - Local storage test   - MainPostTab.jsx    - DB persistence   - Dynamic prompts |
+-----------------------------------------------------------------------------------+
```

### 4.1 Step 1: Database Extraction (`extract_perfumes.py` & `seedPerfumes.json`)
- **Script**: `scripts/extract_perfumes.py`
```python
import sqlite3
import json
import os

DB_PATH = "perfumes.db"
OUTPUT_PATH = "frontend/src/data/seedPerfumes.json"

def extract():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, image_filename, perfume_name, brand, description, 
               scent_profile, longevity, best_for, category, image_generation_prompt
        FROM perfumes
        ORDER BY id ASC
    """)
    rows = cursor.fetchall()
    perfumes = [dict(row) for row in rows]
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(perfumes, f, indent=2, ensure_ascii=False)
    print(f"Successfully extracted {len(perfumes)} perfumes to {OUTPUT_PATH}")
    conn.close()

if __name__ == "__main__":
    extract()
```

### 4.2 Step 2: Image Asset Copying
- Copy all 17 PNG images + `default_perfume.jpg` from `Sirvinistyles perfume images/` into `frontend/public/images/`.

### 4.3 Step 3: IndexedDB Database Layer (`frontend/src/services/db.js`)
- **File**: `frontend/src/services/db.js`
- **Specification**:
```javascript
import seedPerfumes from '../data/seedPerfumes.json';

export const DB_NAME = 'sirvinistyles_db';
export const DB_VERSION = 1;

export const STORES = {
  PERFUMES: 'perfumes',
  POSTS: 'posts',
  SELECTION_HISTORY: 'selection_history',
  SETTINGS: 'app_settings'
};

let dbPromise = null;

export function openAppDB() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // 1. Perfumes Store
      if (!db.objectStoreNames.contains(STORES.PERFUMES)) {
        const perfumeStore = db.createObjectStore(STORES.PERFUMES, { keyPath: 'id' });
        perfumeStore.createIndex('category', 'category', { unique: false });
        perfumeStore.createIndex('brand', 'brand', { unique: false });
        perfumeStore.createIndex('perfume_name', 'perfume_name', { unique: false });
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

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => {
      dbPromise = null;
      reject(event.target.error);
    };
  });

  return dbPromise;
}

export async function getAllFromStore(storeName) {
  const db = await openAppDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function getFromStore(storeName, key) {
  const db = await openAppDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function putToStore(storeName, value) {
  const db = await openAppDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.put(value);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function putManyToStore(storeName, items) {
  const db = await openAppDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    for (const item of items) {
      store.put(item);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteFromStore(storeName, key) {
  const db = await openAppDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteManyFromStore(storeName, keys) {
  const db = await openAppDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    for (const key of keys) {
      store.delete(key);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearStore(storeName) {
  const db = await openAppDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearAllStores() {
  const db = await openAppDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(Object.values(STORES), 'readwrite');
    for (const storeName of Object.values(STORES)) {
      tx.objectStore(storeName).clear();
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function countStore(storeName) {
  const db = await openAppDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.count();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function seedDatabaseIfEmpty() {
  const count = await countStore(STORES.PERFUMES);
  if (count === 0 && Array.isArray(seedPerfumes) && seedPerfumes.length > 0) {
    await putManyToStore(STORES.PERFUMES, seedPerfumes);
    await putToStore(STORES.SETTINGS, {
      key: 'seed_info',
      seeded_at: new Date().toISOString(),
      count: seedPerfumes.length,
      version: 1
    });
  }
}
```

### 4.4 Step 4: Theme Engine (`frontend/src/services/themeEngine.js`)
- **File**: `frontend/src/services/themeEngine.js`
- **Key Functions**:
  - `getLagosDate(dateObj)`: Normalizes date to `Africa/Lagos` timezone.
  - `getPythonWeekday(lagosDate)`: Converts JS `getUTCDay()` (0=Sun..6=Sat) to Python `weekday()` (0=Mon..6=Sun): `(jsDay + 6) % 7`.
  - `getWeekOfMonth(dateObj)`: `Math.min(Math.floor((lagosDay - 1) / 7) + 1, 4)`.
  - `getActiveCategory(week)`: Rotates 1 -> "Fresh & Everyday", 2 -> "Bold & Masculine", 3 -> "Oud & Luxury", 4 -> "Unisex & Women's".
  - `getThemeForDate(dateObj)`: Resolves day theme (0: Fragrance Spotlight ... 6: Perfume Academy).
  - `shouldBeGeneric(dayOfWeek)`: 50% for Tuesday(1) and Thursday(3), 100% for Sunday(6), 0% for others.
  - `requiresReel(dayOfWeek)`: `[0, 2, 4, 5].includes(dayOfWeek)`.
  - `getTimeOfDay(hour)`: `< 12 ? 'Morning' : (< 18 ? 'Afternoon' : 'Evening')`.
  - `getDayContext(dayName)`: 20% chance to reveal actual day name.

### 4.5 Step 5: Perfume Selector & History (`frontend/src/services/perfumeSelector.js`)
- **File**: `frontend/src/services/perfumeSelector.js`
- **Key Functions**:
  - `getAllPerfumes()`: Reads `STORES.PERFUMES` from IndexedDB.
  - `getPerfumesByCategory(category)`: Filters catalog by category.
  - `getPerfumeById(id)`: Queries by numeric ID.
  - `getRecentlyUsedIds()`: Returns `Set<number>` of recently used IDs from `STORES.SELECTION_HISTORY`.
  - `selectPerfume(category, explicitId = null)`: Implements full rotation selection:
    1. If `explicitId`, return matching perfume.
    2. Retrieve category perfumes (fallback to all perfumes if empty).
    3. Filter out items present in `selection_history`.
    4. If `available.length === 0`, reset selection history for category perfume IDs and restore full category list.
    5. Pick random item from `available`.
    6. Record selected item in `selection_history`.
    7. Return selected perfume.

### 4.6 Step 6: Content Generator (`frontend/src/services/contentGenerator.js`)
- **File**: `frontend/src/services/contentGenerator.js`
- **Key Functions**:
  - `generateOfflinePostContent({ perfume, theme, category, isGeneric, dayOfWeek, weekOfMonth, hour, dateObj })`: High-converting Nigerian luxury copywriting engine:
    - Generates punchy, storytelling `main_post` adapted to gender and theme.
    - Generates 4 WhatsApp status slots (Morning: The Intention, Midday: The Endurance Test, Evening: The Transition & Dispatch, Night: The Seduction).
    - Generates structured 15-30s Reel script if `requiresReel` is true.
    - Generates hashtags, keywords, hook, CTA, Midjourney/DALL-E image prompt, engagement question.
  - `generateDailyBlueprint(perfumeId = null, dateObj = new Date())`: Orchestrates selection, content generation, resolves `/images/...` path, persists to `STORES.POSTS` in IndexedDB, and returns `GenerateResponse`.
  - `getTodayBlueprint(dateObj = new Date())`: Queries `STORES.POSTS` for today's Lagos date (`YYYYMMDD`), returning the latest record or `null`.

### 4.7 Step 7: React Hooks Integration
- **`frontend/src/hooks/useAppStorage.js`**:
  - Calls `openAppDB()` and `seedDatabaseIfEmpty()` on mount.
  - Exposes `{ isReady, isSeeding, error, perfumesCount }`.
- **`frontend/src/hooks/useContentGenerator.js`**:
  - Replaces all Axios `api.js` calls with direct `getTodayBlueprint()` and `generateDailyBlueprint()`.
  - Manages `{ loading, postData, error, generateContent, isReady }`.
- **`frontend/src/components/MainPostTab.jsx` & `App.jsx`**:
  - Render `src={postData.image_url}` directly (points to `/images/<filename>`), removing the backend server URL prefix.

---

## 5. Verification Method

To independently verify Milestone 1 implementation:

1. **Seed Data Verification**:
   - Verify `frontend/src/data/seedPerfumes.json` exists, is valid JSON, and contains exactly 209 objects with keys (`id`, `perfume_name`, `brand`, `category`, etc.).
2. **Static Asset Verification**:
   - Verify `frontend/public/images/` contains 17 PNG images + `default_perfume.jpg`.
3. **Database & Storage Verification**:
   - Launch Vite preview/dev server (`npm run dev` or `npm run build`).
   - Open browser developer tools -> Application -> IndexedDB -> `sirvinistyles_db`.
   - Verify all 4 object stores (`perfumes`, `posts`, `selection_history`, `app_settings`) are created and `perfumes` contains 209 records.
4. **Offline Generation Verification**:
   - Disconnect network or enable offline mode in DevTools Network tab.
   - Click "Generate Today's Content" (or "Regenerate Content").
   - Confirm generation succeeds in <100ms with complete Main Post, 4 WhatsApp Status updates, Strategy Banner, and Product Image.
   - Refresh the page while offline; confirm today's generated blueprint rehydrates immediately from IndexedDB.
5. **Code Quality & Lint**:
   - Run `npx oxlint` to ensure 0 syntax or lint errors.
