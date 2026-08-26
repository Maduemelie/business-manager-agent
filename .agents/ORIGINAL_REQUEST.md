# Original User Request

## Initial Request — 2026-08-26T08:06:13Z

User Goal:
Convert the existing web application into an offline-first Progressive Web App (PWA). All data must be stored locally on the user's phone using IndexedDB/Local Storage to eliminate reliance on free-tier cloud backends (like Render). Include manual data export/import functionality to prevent data loss.

Requirements:
- R1. Offline-First PWA Architecture: Function entirely offline, local on-device persistence (IndexedDB) rather than external cloud APIs.
- R2. Manual Data Backup System: Provide manual export to a JSON file and import back.

Acceptance Criteria:
- PWA and Offline Storage: A programmatic test suite (e.g., Playwright) is provided and passes, verifying data persistence in IndexedDB/Local Storage after a page reload without network connectivity.
- Data Export/Import: A programmatic test suite (e.g., Playwright) is provided and passes, verifying that application state can be exported to a local JSON file, local storage cleared, and exact state successfully restored by importing the file.

Constraints:
- Follow modular structure per .agents/AGENTS.md.
- Maintain your BRIEFING.md, plan.md, and progress.md in your working directory.
- Dispatch specialists, oversee implementation and testing, verify all requirements, and report back with your full completion handoff when done.
