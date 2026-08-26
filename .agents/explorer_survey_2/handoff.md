# Survey Explorer 2: Data Layer & Backend Explorer Report

## 1. Observation

Direct inspection of the codebase revealed the existing data models, backend storage, network requests, state management, and asset handling:

### 1.1 Existing Data Models & Schemas

1. **`PerfumeModel` (Product Catalog Entity)**
   - Defined in `backend/app/models/schemas.py:4-26` and SQLite table `perfumes` in `perfumes.db` (and `migrations/versions/ef95cb12ff1f_initial_schema.py:24-36`):
     - `id`: `INTEGER PRIMARY KEY AUTOINCREMENT`
     - `image_filename`: `TEXT` (e.g., `"Allure Homme.PNG"`, `"default_perfume.jpg"`)
     - `perfume_name`: `TEXT NOT NULL` (e.g., `"Allure Homme"`, `"Soleil Blanc"`)
     - `brand`: `TEXT NOT NULL` (e.g., `"Chanel"`, `"Tom Ford"`, `"SirviniStyles"`)
     - `description`: `TEXT`
     - `scent_profile`: `TEXT` (e.g., `"Fresh • Woody • Spicy • Elegant"`)
     - `longevity`: `TEXT` (e.g., `"24 Hours +"`)
     - `best_for`: `TEXT` (e.g., `"Men who love clean luxury scents"`)
     - `category`: `TEXT` (`"Fresh & Everyday"`, `"Bold & Masculine"`, `"Oud & Luxury"`, `"Unisex & Women's"`)
     - `image_generation_prompt`: `TEXT`
     - Extended schema fields in `schemas.py`: `inspired_by`, `gender`, `projection`, `season`, `occasion`, `mood`, `luxury_level`, `compliment_factor`, `bottle_size`, `available_sizes`, `price`.
   - Current database count: Exactly 209 perfumes in `perfumes.db`.

2. **`SelectionHistory` (Rotation History Entity)**
   - Defined in `migrations/versions/ef95cb12ff1f_initial_schema.py:38-42` and `backend/app/repositories/perfume_repository.py:155-159`:
     - `perfume_id`: `INTEGER PRIMARY KEY`
     - `selected_at`: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
   - Purpose: Tracks which perfumes have recently been selected by `PerfumeSelector` to prevent immediate repetition across daily blueprints.

3. **`WhatsAppStatus` & `LLMContentResponse` (Content Generation Schemas)**
   - Defined in `backend/app/models/schemas.py:27-42`:
     - `WhatsAppStatus`: `{ time: str, content: str, image_suggestion: Optional[str] }`
     - `LLMContentResponse`: `{ main_post: str, whatsapp_sequence: List[WhatsAppStatus], reel_script: Optional[str], hashtags: Optional[List[str]], keywords: Optional[List[str]], hook: Optional[str], cta: Optional[str], image_prompt: Optional[str], engagement_question: Optional[str] }`

4. **`GenerateResponse` (Daily Blueprint / Content Packet)**
   - Defined in `backend/app/models/schemas.py:43-62`:
     - `perfume_id`: `Optional[int]`
     - `perfume_name`: `str`
     - `brand`: `str`
     - `theme`: `str`
     - `week_of_month`: `int` (1 to 4)
     - `active_category`: `str`
     - `is_generic`: `bool`
     - `main_post`: `str`
     - `whatsapp_sequence`: `List[WhatsAppStatus]` (4 daily time slots: Morning, Midday, Evening, Night)
     - `reel_script`: `Optional[str]`
     - `image_url`: `Optional[str]` (e.g., `"/images/Allure Homme.PNG"`)
     - `generated_image_file`: `Optional[str]`
     - `hashtags`, `keywords`, `hook`, `cta`, `image_prompt`, `engagement_question`: `Optional`

5. **`ThemeInfo` & Theme Rotation Rules**
   - Defined in `backend/app/services/theme_engine.py:7-15`:
     - 7 Day-of-Week Themes (0=Fragrance Spotlight, 1=Fragrance Education, 2=Fragrance Finder, 3=Perfume Lifestyle, 4=Weekend Collection, 5=Reviews & Trust, 6=Perfume Academy).
     - 4 Weekly Categories (Week 1="Fresh & Everyday", Week 2="Bold & Masculine", Week 3="Oud & Luxury", Week 4="Unisex & Women's").

6. **Filesystem Output Packet Format (`Ready_To_Post/*.json`)**
   - Defined in `backend/app/repositories/output_repository.py:24-35`:
     - JSON files named with Lagos date prefix: `<YYYYMMDD_HHMMSS>_post.json`.
     - Read by `backend/app/routers/content.py:37-68` on `GET /api/generate/today`.

### 1.2 Current State Management, CRUD Operations, and API Calls

1. **Frontend State Management**:
   - Pure React local state (`useState` in `frontend/src/hooks/useContentGenerator.js:9-11` and `frontend/src/App.jsx:13`).
   - State variables: `loading`, `postData`, `error`, `activeTab`. No global state management library (Redux/Zustand) is currently installed.

2. **Network Calls & Backend Endpoints**:
   - `frontend/src/services/api.js:12-22`: `POST ${API_BASE_URL}/api/generate` with headers `X-API-Key: <key>` and body `{ perfume_id }`.
   - `frontend/src/services/api.js:28-37`: `GET ${API_BASE_URL}/api/generate/today` with headers `X-API-Key: <key>`.
   - `frontend/src/components/MainPostTab.jsx:10`: `GET ${apiBaseUrl}${postData.image_url}` (serves images from `/images/...`).
   - Outbound from backend: `Open-Meteo` weather API (`https://api.open-meteo.com/v1/forecast`), `Google Gemini API` (`gemini-2.5-flash`), `Groq API`, or `Ollama API`.

3. **Current Asset Storage**:
   - 17 perfume images + `default_perfume.jpg` located in `Sirvinistyles perfume images/`.
   - In backend, static directory is mounted at `/images` (`backend/app/main.py:47`).

---

## 2. Logic Chain

1. **Eliminating External Cloud Dependency (Render / Remote Backend)**:
   - Observation: Currently, all CRUD operations (`GET /api/generate/today`, `POST /api/generate`, `/images/*`) depend on a running FastAPI backend connected to SQLite/PostgreSQL.
   - Deduction: To operate completely offline on mobile and desktop browsers, the entire data store (perfumes catalog, selection history, daily post packets, settings) must reside locally on-device in the browser's **IndexedDB**.

2. **IndexedDB Architecture vs LocalStorage**:
   - Observation: Catalog contains 209 perfumes with rich text descriptions, prompt builders, multiple daily post packets, and potential image blobs. LocalStorage has a strict ~5MB limit and synchronous blocking I/O.
   - Deduction: **IndexedDB** is the required primary storage mechanism for structured business entities (`perfumes`, `posts`, `selection_history`, `app_settings`), while LocalStorage can serve as a secondary fallback for lightweight key-value flags.

3. **Asset Portability for Offline PWA**:
   - Observation: Images are currently served from the backend's static directory.
   - Deduction: Moving image assets (`Sirvinistyles perfume images/*`) into `frontend/public/images/` allows Vite and `vite-plugin-pwa` (Workbox) to precache all images during Service Worker install. Image URLs like `/images/Allure Homme.PNG` will load seamlessly without internet access.

4. **Data Seeding & Migration**:
   - Observation: Existing SQLite database has 209 perfumes.
   - Deduction: Extracting the 209 perfumes into a static JSON seed file (`frontend/src/data/seedPerfumes.json`) allows the IndexedDB storage layer to automatically seed the database on first run if the store is empty.

5. **Client-Side Generation & Domain Logic Migration**:
   - Observation: `ThemeEngine`, `PerfumeSelector`, and prompt orchestration logic are pure deterministic business rules currently written in Python.
   - Deduction: Porting `ThemeEngine` and `PerfumeSelector` to JavaScript modules (`frontend/src/services/themeEngine.js`, `frontend/src/services/perfumeSelector.js`, `frontend/src/services/contentGenerator.js`) enables 100% offline generation of daily blueprints. If offline, the client generates high-quality posts using structured luxury templates; if an API key is configured and online, it can optionally query LLMs directly from the client.

6. **Manual JSON Export & Import (Backup / Restore)**:
   - Observation: User requires manual JSON backup to prevent data loss.
   - Deduction: The export function serializes all IndexedDB object stores into a single versioned JSON payload (`sirvinistyles_backup_<timestamp>.json`) and triggers a browser file download. The import function validates JSON schema, clears existing stores (or merges), repopulates IndexedDB, and updates React state.

---

## 3. Caveats

1. **Browser Storage Eviction Policies**:
   - On iOS Safari / Chrome mobile under extreme storage pressure, non-persistent IndexedDB could be evicted if unused for weeks.
   - Mitigation: Use `navigator.storage.persist()` on app initialization to request persistent storage permissions.
2. **Timezone Uniformity**:
   - Daily posts are indexed by Lagos date (`Africa/Lagos`, UTC+1).
   - Mitigation: Client-side date helpers must format dates using `Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos' })` to ensure consistent date keys across user locales.
3. **Image Bundling Size**:
   - The 17 image assets total ~15-20MB. Pre-caching them via Workbox is well within modern PWA limits.

---

## 4. Conclusion & Proposed Offline-First Design

### 4.1 IndexedDB Schema Design (`sirvinistyles_db`, Version 1)

```
Database: "sirvinistyles_db" (Version: 1)

Stores:
├── perfumes (KeyPath: "id", autoIncrement: true)
│   ├── Index: "category" (non-unique)
│   ├── Index: "brand" (non-unique)
│   └── Index: "perfume_name" (non-unique)
│
├── posts (KeyPath: "id", autoIncrement: false, e.g. "20260826_090000")
│   ├── Index: "date" (format "YYYYMMDD" or "YYYY-MM-DD", non-unique)
│   ├── Index: "created_at" (non-unique)
│   └── Index: "perfume_id" (non-unique)
│
├── selection_history (KeyPath: "perfume_id", autoIncrement: false)
│   └── Index: "selected_at" (non-unique)
│
└── app_settings (KeyPath: "key", autoIncrement: false)
    └── Fields: { key: string, value: any, updated_at: string }
```

### 4.2 Backup & Restore JSON Schema Specification

```json
{
  "$schema": "https://sirvinistyles.app/schemas/backup-v1.json",
  "app": "Sirvinistyles Business Manager",
  "version": 1,
  "exported_at": "2026-08-26T09:00:00.000Z",
  "data": {
    "perfumes": [
      {
        "id": 1,
        "image_filename": "Allure Homme.PNG",
        "perfume_name": "Allure Homme",
        "brand": "Chanel",
        "description": "A refined masculine fragrance...",
        "scent_profile": "Fresh • Woody • Spicy • Elegant",
        "longevity": "24 Hours +",
        "best_for": "Men who love clean luxury scents",
        "category": "Fresh & Everyday",
        "image_generation_prompt": null
      }
    ],
    "posts": [
      {
        "id": "20260826_090000",
        "date": "20260826",
        "created_at": "2026-08-26T09:00:00.000Z",
        "perfume_id": 1,
        "perfume_name": "Allure Homme",
        "brand": "Chanel",
        "theme": "Fragrance Spotlight",
        "week_of_month": 4,
        "active_category": "Unisex & Women's",
        "is_generic": false,
        "main_post": "...",
        "whatsapp_sequence": [ ... ],
        "reel_script": "...",
        "image_url": "/images/Allure Homme.PNG"
      }
    ],
    "selection_history": [
      {
        "perfume_id": 1,
        "selected_at": "2026-08-26T09:00:00.000Z"
      }
    ],
    "app_settings": [
      {
        "key": "theme_mode",
        "value": "dark",
        "updated_at": "2026-08-26T09:00:00.000Z"
      }
    ]
  }
}
```

### 4.3 Proposed File & Module Layout for Implementation

```
frontend/
├── public/
│   ├── images/                     # 17 perfume PNGs + default_perfume.jpg
│   └── favicon.ico / pwa icons
├── src/
│   ├── data/
│   │   └── seedPerfumes.json       # 209 perfumes extracted from perfumes.db
│   ├── services/
│   │   ├── db.js                   # IndexedDB CRUD abstraction (openDB, get, set, delete, clear, getAll, transaction)
│   │   ├── perfumeRepository.js    # Client-side perfume queries & rotation tracking
│   │   ├── themeEngine.js          # Client-side theme, category, week calculations
│   │   ├── contentGenerator.js     # Client-side daily blueprint generation (offline templates + optional direct LLM API)
│   │   └── backupService.js        # JSON file export & import validation/restoration
│   ├── hooks/
│   │   ├── useAppStorage.js        # React hook providing db access & initialization
│   │   └── useContentGenerator.js  # React hook integrated with offline IndexedDB
│   ├── components/
│   │   ├── BackupControls.jsx      # Export and Import buttons & status modal
│   │   ├── ... (existing UI components)
```

---

## 5. Verification Method

1. **Unit & Module Verification**:
   - Seed data integrity: Verify `seedPerfumes.json` contains exactly 209 valid perfume objects matching `PerfumeModel`.
   - IndexedDB CRUD test: Verify writing a post, reading by ID/date, updating, and deleting in browser IndexedDB.
   - Selection rotation test: Verify `perfumeRepository` selects unselected perfumes and resets history when all have been used.

2. **Playwright E2E Verification Suites**:
   - **Offline Persistence Test**:
     - Load PWA, generate blueprint.
     - Set network mode to offline (`page.context().setOffline(true)`).
     - Reload page (`page.reload()`).
     - Assert that today's blueprint and perfume image are rendered identically from IndexedDB.
   - **JSON Export / Clear / Import Restore Test**:
     - Create specific posts/records in IndexedDB.
     - Trigger Export button and download JSON payload.
     - Execute `indexedDB.deleteDatabase("sirvinistyles_db")` or call clear store.
     - Reload to verify empty state.
     - Upload exported JSON file via Import button.
     - Assert 100% equality of restored records in IndexedDB and UI state.
