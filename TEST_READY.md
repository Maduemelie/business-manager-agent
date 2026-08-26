# TEST_READY — E2E Test Suite Specification & Readiness Report

## Overview
The end-to-end (E2E) automated testing suite for the **Offline-First PWA Conversion with IndexedDB & JSON Backup System** has been fully specified, structured, and configured.

- **Framework**: Playwright (`@playwright/test`)
- **Configuration**: `frontend/playwright.config.js`
- **Execution Command**: `npm run test:e2e` (or `npx playwright test` inside `frontend/`)
- **Target URL**: `http://localhost:4173` (Vite preview server with `serviceWorkers: 'allow'`)
- **Test Mode**: Opaque-box requirement-driven testing simulating mobile seller interactions and complete offline network disconnection (`context.setOffline(true)`).

---

## Test Inventory & Coverage Breakdown

### 1. `frontend/tests/e2e/offline-persistence.spec.js`
*Focus: Zero-backend startup, IndexedDB database initialization & seeding, offline blueprint generation, and offline reload persistence.*
- **T1.1**: App loads with 0 backend running, initializes IndexedDB (`sirvinistyles_db`), and auto-seeds 209 perfumes.
- **T1.2**: Generates daily blueprint offline; verifies strategy banner, main caption text, and IndexedDB post store insertion.
- **T1.3**: Offline reload persistence (`context.setOffline(true)` + `page.reload()`); verifies exact post caption and local images persist from IndexedDB without network.
- **T3.3**: PWA Service Worker caching and IndexedDB query combination under continuous offline operation.

### 2. `frontend/tests/e2e/backup-export-import.spec.js`
*Focus: Full roundtrip data preservation, JSON schema export, database wiping, and file import state restoration.*
- **T1.4**: Manual JSON Export; triggers file download, validates version 1 schema metadata (`app: 'sirvinistyles'`, `exported_at`, store arrays), and checks complete perfume and post counts.
- **T1.5**: Manual JSON Import; uploads valid backup payload via file input, verifies UI rehydration and IndexedDB population.
- **T3.1**: Pairwise Full Roundtrip (Generate -> Export -> Clear DB -> Import -> Set Offline -> Reload -> Verify state match).
- **T3.2**: Multi-session state replacement; verifies importing Session A backup cleanly overwrites Session B state.
- **Tier 4 Scenario 2**: Device Migration & Disaster Recovery workflow (migrating multi-week post and selection history from Device 1 to fresh Device 2).

### 3. `frontend/tests/e2e/ui-navigation-offline.spec.js`
*Focus: Offline UX, responsive tab transitions, clipboard copy feedback, and realistic mobile seller daily routine.*
- **UI Offline Status Banner**: Detects and reflects online/offline network transitions dynamically (`window.dispatchEvent(new Event('offline'))`).
- **Offline Tab Switching**: Seamless navigation across Main Feed, WhatsApp Series, and Reel Script tabs without network connectivity.
- **Offline Clipboard Copy**: Verifies copy-to-clipboard functionality on main caption and WhatsApp status cards with visual confirmation.
- **Tier 4 Scenario 1**: Mobile Seller Daily Routine (Monday morning offline startup on mobile viewport, blueprint execution, tab navigation, WhatsApp status copy, browser closure and afternoon offline reload).

### 4. `frontend/tests/e2e/boundary-robustness.spec.js`
*Focus: Boundary values, corrupt file resistance, rapid generation stress, and graceful image fallback.*
- **T2.1**: Rejection of malformed / corrupted non-JSON files without causing database corruption.
- **T2.2**: Schema validation rejection for payloads with missing version or missing stores.
- **T2.3**: Rapid consecutive generation stress testing verifying rotation history integrity and absence of duplicate post keys.
- **T2.4**: Multi-record historical export verifying all past posts are packaged in the backup.
- **T2.5**: Image loading fallback gracefully displaying without uncaught exceptions on missing image assets.
- **Empty State**: Verifies clean placeholder rendering on fresh/cleared database.

---

## Requirement Traceability Matrix

| Requirement | Description | E2E Test Coverage | Status |
|---|---|---|---|
| **R1** | Offline-First PWA Architecture (IndexedDB on-device persistence, 0 backend dependency) | `offline-persistence.spec.js` (T1.1, T1.2, T1.3, T3.3), `ui-navigation-offline.spec.js` | **READY** |
| **R2** | Manual Data Backup System (JSON export and import restoration) | `backup-export-import.spec.js` (T1.4, T1.5, T3.1, T3.2, Tier 4 Scenario 2), `boundary-robustness.spec.js` | **READY** |

---

## How to Execute the E2E Test Suite

1. **Build the frontend application:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Run all Playwright E2E tests:**
   ```bash
   cd frontend
   npm run test:e2e
   ```

3. **Run a specific test suite in UI or headed mode (optional):**
   ```bash
   cd frontend
   npx playwright test tests/e2e/offline-persistence.spec.js --headed
   ```
