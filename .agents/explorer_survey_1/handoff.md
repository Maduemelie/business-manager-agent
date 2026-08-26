# Codebase Architecture Survey Handoff Report

## 1. Observation

### 1.1 Project Structure & Root Layout
- **Root Directory (`c:\dev\business manager agent`)**:
  - `frontend/`: React 19 + Vite 8 Single Page Application / PWA (`package.json:1-28`).
  - `backend/`: FastAPI Python application with SQLite/Postgres ORM, LLM prompt engineering, weather service, and endpoints (`backend/app/main.py`, `backend/requirements.txt:1-14`).
  - `perfumes.db`: SQLite database (188 KB) containing perfume catalog and profiles.
  - `Sirvinistyles perfume images/`: Perfume product image assets.
  - `Ready_To_Post/`: Target directory for saved social media output posts.
  - `.agents/`: Agent workspaces and rule files (`.agents/AGENTS.md`, `.agents/ORIGINAL_REQUEST.md`).
  - `.env` & `.env.example`: Environment configuration for API keys, backend URL (`VITE_API_URL`, `VITE_API_SECRET_KEY`).

### 1.2 Frontend Framework, Dependencies & Scripts
- **Dependencies (`frontend/package.json:12-26`)**:
  - `react`: `^19.2.7`
  - `react-dom`: `^19.2.7`
  - `axios`: `^1.18.1`
  - `lucide-react`: `^1.23.0`
  - `vite`: `^8.1.1`
  - `@vitejs/plugin-react`: `^6.0.3`
  - `vite-plugin-pwa`: `^1.3.0`
  - `@vite-pwa/assets-generator`: `^1.0.2`
  - `oxlint`: `^1.71.0`
- **Scripts (`frontend/package.json:6-11`)**:
  - `"dev": "vite"`
  - `"build": "vite build"`
  - `"lint": "oxlint"`
  - `"preview": "vite preview"`
- **Vite & PWA Config (`frontend/vite.config.js:1-47`)**:
  - Configures `@vitejs/plugin-react` and `VitePWA`.
  - PWA manifest defines `name: "Sirvinistyles Manager"`, `short_name: "Sirvinistyles"`, `theme_color: "#121212"`, `background_color: "#121212"`, `display: "standalone"`, and icons (`pwa-64x64.png`, `pwa-192x192.png`, `pwa-512x512.png`, `maskable-icon-512x512.png`).
  - `envDir: '../'` points Vite to load environment variables from workspace root `.env`.

### 1.3 UI Components, Pages, Navigation & Styling
- **Entry & Root**:
  - `frontend/src/main.jsx:1-14`: Mounts `<App />` within `<StrictMode>` and `<ErrorBoundary>`.
  - `frontend/src/App.jsx:1-48`: Single root view containing header, generate button, conditional error display, content panel, and placeholder state.
- **Component Breakdown (`frontend/src/components/`)**:
  - `Header.jsx:1-9`: Renders title "SirviniStyles" and subtitle "Sales-First Daily Content Packet".
  - `GenerateButton.jsx:1-29`: Triggers content generation or regeneration for current perfume with spinner/icon states (`Sparkles`, `Loader2`, `RotateCcw`).
  - `ErrorMessage.jsx:1-8`: Standardized error message banner.
  - `PlaceholderState.jsx:1-14`: Empty state when no content packet has been generated.
  - `ContentPanel.jsx:1-36`: Composite container rendering `StrategyBanner`, `ContentTabs`, and tab views.
  - `StrategyBanner.jsx:1-16`: Displays weekly strategy number, active category, and theme pill.
  - `ContentTabs.jsx:1-27`: Navigation tab switcher between `main` ("📸 Main Feed"), `whatsapp` ("💬 WhatsApp Series"), and `reel` ("🎬 Reel Script").
  - `MainPostTab.jsx:1-49`: Product image container or educational placeholder, perfume name, brand tag, generic notice banner, post text, and copy button.
  - `WhatsAppTab.jsx:1-26`: Iterates over `whatsapp_sequence` items (time, content, visual suggestion) with copy actions.
  - `ReelTab.jsx:1-16`: Renders video concept header and script content.
  - `CopyButton.jsx:1-20`: Reusable clipboard copy utility with visual checkmark transition.
  - `ErrorBoundary.jsx:1-42`: Class component catching runtime React rendering errors and offering "Reload Application".
- **State & API Layer**:
  - `frontend/src/hooks/useContentGenerator.js:1-53`: Manages `loading`, `postData`, `error`, initializes on mount with `fetchTodayContent()`, and handles `generateContent(perfumeId)`.
  - `frontend/src/services/api.js:1-38`: Makes axios requests to `${API_BASE_URL}/api/generate` (POST) and `${API_BASE_URL}/api/generate/today` (GET) with `X-API-Key` headers.
- **Styling (`frontend/src/index.css:1-467`)**:
  - Deep dark luxury gradient background (`#0f172a` to `#1e1b4b`).
  - Glassmorphism styling (`.glass-panel` with backdrop-filter blur and subtle borders).
  - Responsive flex layouts, customized scrollbars and buttons, zero external CSS framework dependencies (pure CSS).

### 1.4 Modularity Conventions (`.agents/AGENTS.md`)
- `.agents/AGENTS.md:1-4` specifies:
  > "- **Modular Structure:** We must follow a modular structure always. Code should be broken down into reusable, single-purpose modules, components, and files rather than monolithic scripts."
- Existing frontend structure strictly aligns: single-purpose components in `src/components/`, isolated hook in `src/hooks/`, and isolated API service in `src/services/`.

### 1.5 Existing Test Setup & Gaps
- **Backend Tests**:
  - `backend/tests/` contains `pytest` unit/integration tests for content router, prompt generator, perfume selector, theme engine, and weather service.
- **Frontend Tests**:
  - **No test framework or test scripts** exist in `frontend/package.json`.
  - No Playwright, Vitest, Jest, or Cypress configuration files exist.

---

## 2. Logic Chain

1. **State Persistence vs. Network Coupling**:
   - Observation: `frontend/src/services/api.js` directly calls remote REST endpoints (`/api/generate` and `/api/generate/today`).
   - Observation: `frontend/src/hooks/useContentGenerator.js:13-28` fetches today's content from the remote backend upon initial mount.
   - Inference: Currently, if the backend (or network) is unavailable, the frontend displays an error banner (`"Failed to connect to the AI Engine. Is the backend running?"`).
   - Requirement Alignment (`ORIGINAL_REQUEST.md` R1): An IndexedDB persistence layer (e.g., Dexie.js, idb, or custom IndexedDB client service) must be introduced into `src/services/` or `src/db/` so that content packets, perfume catalogs, and generation state persist locally across reloads and offline sessions.

2. **Data Backup & Restore Mechanism**:
   - Observation: There are currently no UI controls or service methods for exporting or importing state in JSON format.
   - Inference: A dedicated backup/restore module (e.g., `src/services/backupService.js` or `src/services/storageService.js`) and UI component (e.g., Settings/Backup modal or Header backup controls) must be created to satisfy R2.

3. **PWA Offline Readiness**:
   - Observation: `vite-plugin-pwa` is already present in `devDependencies` and `vite.config.js` with basic manifest and asset inclusions (`pwa-*.png`).
   - Inference: Service worker caching strategy (e.g. Workbox runtime caching for app shell, icons, and static assets) must be verified and configured to ensure the entire app shell and offline assets load with 0 network connectivity.

4. **Testing Infrastructure Needs**:
   - Observation: No frontend test harness exists (`package.json` only has `dev`, `build`, `lint`, `preview`).
   - Inference: To satisfy the Acceptance Criteria in `ORIGINAL_REQUEST.md` (programmatic verification of IndexedDB offline reload persistence and JSON export/import restore), an automated testing framework (e.g., Playwright E2E suite with headless browser offline mode emulation) needs to be installed and scripted.

---

## 3. Caveats

- **No Caveats**: All frontend and backend architecture files, package configurations, components, styles, and test directories were directly inspected.

---

## 4. Conclusion

The application is a modern, modular React 19 + Vite 8 SPA styled with custom CSS glassmorphism and configured with `vite-plugin-pwa`. It currently relies on an external FastAPI backend for generation and persistence. To achieve the user's goal of an offline-first PWA with local on-device persistence:
1. An on-device storage layer (IndexedDB / LocalStorage) must be implemented following the project's modular conventions in `frontend/src/services/` or `frontend/src/db/`.
2. A JSON export/import service and corresponding UI controls must be added.
3. The PWA service worker configuration in `vite.config.js` should ensure complete offline app shell caching.
4. A Playwright test harness should be configured in `frontend/` (or root) to programmatically validate offline persistence across page reloads and backup export/import cycles.

---

## 5. Verification Method

To independently verify the observations:
1. **Frontend Dependencies & Scripts**: Inspect `frontend/package.json` lines 6-26 (`view_file` on `frontend/package.json`).
2. **PWA Configuration**: Inspect `frontend/vite.config.js` lines 8-45 (`view_file` on `frontend/vite.config.js`).
3. **UI Hierarchy**: Inspect `frontend/src/App.jsx` lines 1-48, `frontend/src/main.jsx` lines 1-14, and all components under `frontend/src/components/`.
4. **Data Fetching & Hooks**: Inspect `frontend/src/services/api.js` lines 1-38 and `frontend/src/hooks/useContentGenerator.js` lines 1-53.
5. **Testing Presence**: Inspect `backend/tests/` and confirm lack of testing tools in `frontend/package.json`.
