# Orchestration Plan: Offline-First PWA Conversion with Local Storage & JSON Backup

## Objective
Convert existing web application into an offline-first PWA storing all data locally (IndexedDB/LocalStorage) without requiring cloud APIs (like Render), complete with a manual JSON export/import backup/restore system and verified by automated Playwright E2E test suites.

## Orchestration Strategy: Project Pattern (Dual-Track)
- **Track 1: Implementation Track**
  - Milestone 1: Client Data Layer Architecture & Offline Storage (IndexedDB/Dexie or LocalStorage wrapper + data migration/schema).
  - Milestone 2: Service Worker & PWA Manifest Integration (caching assets, offline navigation, manifest.json).
  - Milestone 3: Manual JSON Export & Import UI/System (export database state to file, import validation, overwrite/merge, UI controls).
  - Milestone 4: Final Integration & E2E Verification Pass (Full Tier 1-4 pass + Tier 5 adversarial hardening).
- **Track 2: E2E Testing Track**
  - Opaque-box requirement-driven test suite (Tiers 1-4) with Playwright testing offline persistence, reload resilience, export/import fidelity.
  - Publish `TEST_READY.md`.

## Execution Steps
1. **Phase 0: Survey Phase**
   - Dispatch 3 parallel Explorers to investigate current codebase structure, framework, current data layer/backend endpoints, state management, build/test setups.
   - Aggregate findings into `PROJECT.md` (Architecture, Feature Inventory, Milestones, Code Layout).
2. **Phase 1: Dual Track Dispatch**
   - Dispatch E2E Testing Track orchestrator to develop Playwright test harness and test suites.
   - Dispatch Implementation Track milestones (Explorer -> Worker -> Reviewers -> Challengers -> Auditor -> Gate).
3. **Phase 2: Final Verification & Hardening**
   - Verify 100% pass of E2E test suite under offline conditions.
   - Challenger adversarial hardening.
   - Forensic Auditor integrity review.
4. **Phase 3: Final Synthesis & Completion Report**
