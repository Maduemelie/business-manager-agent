# E2E Test Infra: Offline-First PWA & JSON Backup System

## Test Philosophy
- **Opaque-box, requirement-driven**: Test the running application purely through browser interactions, simulating real mobile user behavior and network state toggles.
- **Methodology**: Category-Partition + Boundary Value Analysis + Pairwise Interaction + Real-World Workload Testing.

## Feature Inventory
| # | Feature | Source (requirement) | Tier 1 | Tier 2 | Tier 3 |
|---|---------|---------------------|:------:|:------:|:------:|
| 1 | Offline Page Reload Persistence | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 2 | IndexedDB Local Storage Operations | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 3 | PWA Service Worker & Asset Caching | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 4 | Manual JSON Backup Export | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 5 | Storage Clear & Empty State | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 6 | Manual JSON Backup Import & Restore | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |

## Test Architecture
- **Framework**: Playwright (`@playwright/test`)
- **Invocation**: `npx playwright test`
- **Target Server**: Vite preview / dev server (`http://localhost:4173` or `http://localhost:5173`)
- **Service Worker Mode**: `serviceWorkers: 'allow'` enabled in browser context
- **Directory Layout**:
  - `frontend/playwright.config.js`
  - `frontend/tests/e2e/offline-persistence.spec.js`
  - `frontend/tests/e2e/backup-export-import.spec.js`
  - `frontend/tests/e2e/pwa-navigation.spec.js`
  - `frontend/tests/e2e/edge-cases.spec.js`

## Test Tiers Breakdown

### Tier 1: Feature Coverage (Representative Happy Path)
1. **T1.1**: App loads with 0 backend running, initializes IndexedDB, and seeds 209 perfumes.
2. **T1.2**: Generate daily blueprint offline; post details, tabs, and images display correctly.
3. **T1.3**: Switch to offline mode (`context.setOffline(true)`), reload page; verify post and state persist from IndexedDB.
4. **T1.4**: Trigger manual JSON Export; verify downloaded file contains valid schema, version 1, and populated stores.
5. **T1.5**: Trigger manual JSON Import; verify file upload parses correctly and renders restored state.

### Tier 2: Boundary & Corner Cases
1. **T2.1**: Import invalid JSON / non-JSON file (error banner, graceful rejection, zero database corruption).
2. **T2.2**: Import JSON with missing or corrupted fields (schema validator rejects with user-facing message).
3. **T2.3**: Rapid multiple generations and page reloads without network; verify selection history integrity and no duplicate post IDs.
4. **T2.4**: Export when database has multiple historical posts; verify all posts are exported.
5. **T2.5**: Offline reload when image asset is missing; graceful fallback to default image without crashing.

### Tier 3: Cross-Feature Combinations (Pairwise)
1. **T3.1**: Generate offline post -> Export backup -> Clear storage -> Import backup -> Toggle offline/online -> Reload -> Verify full state match.
2. **T3.2**: Export backup from Session A -> Modify posts in Session B -> Import Session A backup -> Verify Session A data accurately replaces Session B data.
3. **T3.3**: PWA service worker asset caching + IndexedDB query combination under continuous offline mode.

### Tier 4: Real-World Application Scenarios
1. **Scenario 1 - Mobile Seller Daily Routine**: User opens PWA on mobile phone without internet access on Monday morning, generates daily marketing packet, switches tabs (Main Feed, WhatsApp Series, Reel Script), copies WhatsApp text to clipboard, closes app, reopens app later in the day while still offline, and sees exact content preserved.
2. **Scenario 2 - Device Migration & Disaster Recovery**: User has been using app for 2 weeks accumulating generation history, exports `sirvinistyles-backup.json`, transfers to new device / clears browser data, opens fresh app on new device, imports backup file, and immediately resumes with complete perfume catalog, selection history, and past posts.

## Coverage Thresholds
- Tier 1: ≥ 5 test cases per core feature
- Tier 2: ≥ 5 boundary test cases
- Tier 3: Pairwise combinations across export, import, offline reload, and generation
- Tier 4: ≥ 2 realistic end-to-end user workflows
