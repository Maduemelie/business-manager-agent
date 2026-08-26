# DISPATCH

## 2026-08-26T08:47:06Z
You are Milestone 2 & 3 Worker (PWA Service Worker, Offline UX & Manual JSON Backup System).
Working Directory: c:\dev\business manager agent\.agents\worker_m2_m3_1
Workspace Root: c:\dev\business manager agent
Original Request: c:\dev\business manager agent\.agents\ORIGINAL_REQUEST.md
Project Spec: c:\dev\business manager agent\PROJECT.md
Test Infra Spec: c:\dev\business manager agent\TEST_INFRA.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

File Write Ownership:
- `frontend/vite.config.js`
- `frontend/src/services/backupService.js`
- `frontend/src/hooks/useNetworkStatus.js`
- `frontend/src/components/OfflineStatusBanner.jsx`
- `frontend/src/components/BackupControls.jsx`
- `frontend/src/components/InstallPromptButton.jsx`
- `frontend/src/components/Header.jsx`
- `frontend/src/App.jsx`

Task Requirements:
1. **PWA Service Worker Caching (`frontend/vite.config.js`)**:
   - Configure `VitePWA` with Workbox runtime caching:
     - Precache app shell, HTML, JS, CSS, PWA icons, favicon.
     - Add `runtimeCaching` for Google Fonts (`https://fonts.googleapis.com` and `https://fonts.gstatic.com` using `CacheFirst` strategy).
     - Add `runtimeCaching` for static images `/images/*` (using `CacheFirst` / `StaleWhileRevalidate`).
     - Enable `devOptions: { enabled: true }` if desired or ensure clean production build.
2. **Network State & Offline UX (`frontend/src/hooks/useNetworkStatus.js`, `frontend/src/components/OfflineStatusBanner.jsx`)**:
   - Implement `useNetworkStatus()` listening to `window.addEventListener('online')` and `window.addEventListener('offline')`, returning `{ isOnline, wasOffline }`.
   - Implement `OfflineStatusBanner.jsx` showing luxury subtle glassmorphism banner when offline: "Offline Mode Active — Operating 100% On-Device from IndexedDB". Include `data-testid="offline-status-banner"`.
3. **Manual JSON Backup Export & Import System (`frontend/src/services/backupService.js`)**:
   - Implement `exportAppData()`: Reads all stores (`perfumes`, `posts`, `selection_history`, `app_settings`) from IndexedDB, creates versioned envelope:
     ```json
     {
       "app": "sirvinistyles",
       "version": 1,
       "exported_at": "<ISO Timestamp>",
       "data": {
         "perfumes": [...],
         "posts": [...],
         "selection_history": [...],
         "app_settings": [...]
       }
     }
     ```
   - Implement `downloadBackupFile(payload, filename)`: Triggers clean browser download of `.json` file (`sirvinistyles-backup-<date>.json`).
   - Implement `validateBackupSchema(jsonContent)`: Strict validator verifying `app`, `version === 1`, `typeof data === 'object'`, valid arrays for `perfumes` (checking item fields `id`, `perfume_name`, `brand`), `posts`, `selection_history`, `app_settings`.
   - Implement `importAppData(jsonContent)`: Validates schema, starts readwrite transaction, clears all stores, batch-inserts imported records, updates UI state, and returns `{ success: true, stats: { perfumes, posts, selection_history } }`.
4. **UI Integration (`frontend/src/components/BackupControls.jsx`, `Header.jsx`, `App.jsx`)**:
   - Create `BackupControls.jsx` featuring:
     - "Export Backup" button (`data-testid="export-backup-btn"`).
     - "Import Backup" file upload input (`data-testid="import-file-input"`) with hidden file input and user-friendly styled button.
     - "Clear Data" / reset option if appropriate or confirmation dialog.
     - Success / Error feedback banners / toasts (`data-testid="backup-message"` / `data-testid="backup-error"`).
   - Integrate `BackupControls.jsx` and `OfflineStatusBanner.jsx` seamlessly into `Header.jsx` or `App.jsx` with responsive glassmorphism luxury styling matching `index.css`.
5. **Verification**:
   - Run `npm run build` and `npx oxlint` in `frontend/` to verify clean compilation and zero errors.
6. Write your completion report to `c:\dev\business manager agent\.agents\worker_m2_m3_1\handoff.md` and send_message to orchestrator.
