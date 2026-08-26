# Project: Offline-First PWA Conversion with IndexedDB & JSON Backup System

## Architecture
The application is converted from a cloud-dependent FastAPI+React setup into an offline-first Progressive Web App (PWA) with 100% local on-device persistence, client-side business & generation logic, PWA service worker caching, and a robust JSON export/import backup system.

```
+-------------------------------------------------------------------------+
|                              React 19 SPA                               |
|                                                                         |
|  +---------------------+  +--------------------+  +------------------+  |
|  |   Content Panel     |  | OfflineStatusBanner|  |  BackupControls  |  |
|  |  (Tabs, Posts, Reel)|  | (Online/Offline UI)|  | (Export / Import)|  |
|  +----------+----------+  +---------+----------+  +--------+---------+  |
|             |                       |                      |            |
|  +----------v-----------------------v----------------------v---------+  |
|  |                      Hooks & State Layer                          |  |
|  |      useContentGenerator.js  /  useAppStorage.js  /  useNetwork.js|  |
|  +----------------------------------+--------------------------------+  |
|                                     |                                   |
|  +----------------------------------v--------------------------------+  |
|  |                     Services & Domain Layer                       |  |
|  |  themeEngine.js | perfumeSelector.js | contentGenerator.js        |  |
|  |  backupService.js | db.js (IndexedDB wrapper)                     |  |
|  +----------------------------------+--------------------------------+  |
+-------------------------------------|-----------------------------------+
                                      |
         +----------------------------+----------------------------+
         |                                                         |
         v                                                         v
+----------------------------------+             +----------------------------------+
|      IndexedDB (On-Device)       |             |   Service Worker / CacheStorage  |
|   Database: "sirvinistyles_db"   |             | (Workbox in vite-plugin-pwa)     |
|   - perfumes (209 catalog items) |             | - App Shell (HTML, JS, CSS)      |
|   - posts (daily blueprints)     |             | - Local Product Images (/images/)|
|   - selection_history (rotation) |             | - Google Fonts                   |
|   - app_settings (key/value)     |             | - Manifest & PWA Icons           |
+----------------------------------+             +----------------------------------+
```

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | IndexedDB Storage Layer | Client-side IndexedDB database (`sirvinistyles_db`) with object stores (`perfumes`, `posts`, `selection_history`, `app_settings`) and auto-seeding of 209 catalog perfumes. | M1 | Survey |
| 2 | Client Domain & Generation Engines | Port deterministic rotation rules (`themeEngine.js`, `perfumeSelector.js`, `contentGenerator.js`) to JavaScript with template-based offline generation. | M1 | Survey |
| 3 | Offline React State Integration | Connect UI state hooks (`useAppStorage`, `useContentGenerator`) to IndexedDB, supporting offline generation, retrieval, and product image resolution. | M1 | Survey |
| 4 | PWA Service Worker Caching & Offline UX | Workbox runtime caching for app shell, fonts, and images; `OfflineStatusBanner` and network state detection. | M2 | Survey |
| 5 | Manual JSON Data Export | Serialize all IndexedDB stores into versioned JSON file with metadata (`version: 1`, `exported_at`) and trigger browser download. | M3 | Survey |
| 6 | Manual JSON Data Import & Restoration | File picker, strict JSON schema validation, transactional database clear & restore, and immediate UI state re-hydration. | M3 | Survey |
| 7 | Playwright E2E Test Suite | Comprehensive opaque-box test suite (Tiers 1-4) testing offline reload persistence and export/clear/import cycle. | E2E-Track | Survey |
| 8 | Final Verification & Hardening | 100% E2E test pass + Tier 5 adversarial stress testing. | M4 | Survey |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Client Storage & Offline Domain Logic | F1, F2, F3 | none | DONE |
| M2 | PWA Service Worker & Offline UX | F4 | M1 | DONE |
| M3 | Manual JSON Export & Import Backup System | F5, F6 | M1 | DONE |
| M4 | Final E2E Pass & Adversarial Hardening | F8 | M1, M2, M3, E2E-Track | DONE |
| E2E | E2E Testing Track (Playwright Suite) | F7 | none | DONE |

## Interface Contracts

### 1. `db.js` (IndexedDB Wrapper)
```javascript
export const DB_NAME = 'sirvinistyles_db';
export const DB_VERSION = 1;
export const STORES = {
  PERFUMES: 'perfumes',
  POSTS: 'posts',
  SELECTION_HISTORY: 'selection_history',
  SETTINGS: 'app_settings'
};

export async function openAppDB(): Promise<IDBDatabase>;
export async function getAllFromStore(storeName: string): Promise<Array<any>>;
export async function getFromStore(storeName: string, key: any): Promise<any>;
export async function putToStore(storeName: string, value: any, key?: any): Promise<any>;
export async function deleteFromStore(storeName: string, key: any): Promise<void>;
export async function clearStore(storeName: string): Promise<void>;
export async function clearAllStores(): Promise<void>;
export async function seedDatabaseIfEmpty(): Promise<void>;
```

### 2. `backupService.js` (Export & Import)
```javascript
export interface BackupPayload {
  version: number;
  app: string;
  exported_at: string;
  data: {
    perfumes: Array<any>;
    posts: Array<any>;
    selection_history: Array<any>;
    app_settings: Array<any>;
  };
}

export async function exportAppData(): Promise<BackupPayload>;
export function downloadBackupFile(payload: BackupPayload, filename?: string): void;
export function validateBackupSchema(jsonContent: any): { valid: boolean; error?: string };
export async function importAppData(jsonContent: any): Promise<{ success: boolean; stats: { perfumes: number; posts: number; selection_history: number } }>;
```

### 3. `contentGenerator.js` (Offline Content & Theme Engine)
```javascript
export function getActiveThemeAndCategory(date?: Date): { theme: string; weekOfMonth: number; activeCategory: string; isGeneric: boolean };
export async function selectDailyPerfume(date?: Date): Promise<Perfume>;
export async function generateDailyBlueprint(perfumeId?: number, date?: Date): Promise<GenerateResponse>;
export async function getTodayBlueprint(date?: Date): Promise<GenerateResponse | null>;
```

## Code Layout
- `frontend/public/images/`: Perfume product images and default fallback image.
- `frontend/src/data/seedPerfumes.json`: Extracted 209 catalog perfumes.
- `frontend/src/services/db.js`: Low-level IndexedDB promise-based client.
- `frontend/src/services/themeEngine.js`: JavaScript day/week theme and category rotation rules.
- `frontend/src/services/perfumeSelector.js`: Selection history manager and perfume rotation selector.
- `frontend/src/services/contentGenerator.js`: Offline content packet generator.
- `frontend/src/services/backupService.js`: JSON backup export, validation, and restoration service.
- `frontend/src/hooks/useAppStorage.js`: React hook for database initialization and status.
- `frontend/src/hooks/useContentGenerator.js`: React hook connecting UI with offline generation and persistence.
- `frontend/src/hooks/useNetworkStatus.js`: React hook for `navigator.onLine` and offline event listening.
- `frontend/src/components/OfflineStatusBanner.jsx`: UI banner indicating online/offline mode.
- `frontend/src/components/BackupControls.jsx`: UI buttons/modal for Export and Import operations.
- `frontend/playwright.config.js`: Playwright configuration with Vite preview server.
- `frontend/tests/e2e/`: Playwright E2E test suites (offline persistence, export/import, UI workflows).
