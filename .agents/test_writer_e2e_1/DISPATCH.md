## 2026-08-26T08:13:59Z
You are the E2E Test Writer for the Offline-First PWA Conversion project.
Working Directory: c:\dev\business manager agent\.agents\test_writer_e2e_1
Workspace Root: c:\dev\business manager agent
Original Request: c:\dev\business manager agent\.agents\ORIGINAL_REQUEST.md
Project Spec: c:\dev\business manager agent\PROJECT.md
Test Infra Spec: c:\dev\business manager agent\TEST_INFRA.md

Task:
1. Read ORIGINAL_REQUEST.md, PROJECT.md, and TEST_INFRA.md.
2. Install/configure Playwright test runner in `frontend/` (e.g. create `playwright.config.js` configured to test against Vite preview server with `serviceWorkers: 'allow'`).
3. Write modular, comprehensive E2E test files under `frontend/tests/e2e/` covering Tiers 1-4:
   - `frontend/tests/e2e/offline-persistence.spec.js`: Test app loading without backend, IndexedDB database creation & seed verification, offline blueprint generation, offline mode toggle (`context.setOffline(true)`), page reload (`page.reload()`), and assertion that post data & images persist locally.
   - `frontend/tests/e2e/backup-export-import.spec.js`: Test manual JSON backup download (`waitForEvent('download')`), file format & schema validation, database clearing, and restoring exact state via file upload input.
   - `frontend/tests/e2e/ui-navigation-offline.spec.js`: Test offline tab switching (Main Feed, WhatsApp Series, Reel Script), copying text to clipboard, and offline banner display.
   - `frontend/tests/e2e/boundary-robustness.spec.js`: Test importing corrupt/invalid JSON files, empty states, and rapid generations.
4. Verify package.json scripts include `"test:e2e": "playwright test"`.
5. Once test suite files are written and verified, create `TEST_READY.md` at project root `c:\dev\business manager agent\TEST_READY.md` following the template in PROJECT.md / TEST_INFRA.md.
6. Write your completion report to `c:\dev\business manager agent\.agents\test_writer_e2e_1\handoff.md` and send_message to the orchestrator.
