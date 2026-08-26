# Original User Request

## Initial Request — 2026-08-26T08:05:40Z

Convert the existing web application into an offline-first Progressive Web App (PWA). All data must be stored locally on the user's phone using IndexedDB/Local Storage to eliminate reliance on free-tier cloud backends (like Render). Include manual data export/import functionality to prevent data loss.

Working directory: ~/teamwork_projects/pwa_migration
Integrity mode: benchmark

## Requirements

### R1. Offline-First PWA Architecture
The application must function entirely offline. Data persistence must rely on local, on-device storage mechanisms (like IndexedDB) rather than external cloud APIs.

### R2. Manual Data Backup System
The application must provide a mechanism for users to manually export their local data to a file (e.g., JSON) and import it back, safeguarding against browser cache clearing or device changes.

## Acceptance Criteria

### PWA and Offline Storage
- [ ] A programmatic test suite (e.g., Playwright) is provided and passes, verifying that data written to the application persists in IndexedDB/Local Storage after a page reload without network connectivity.

### Data Export/Import
- [ ] A programmatic test suite (e.g., Playwright) is provided and passes, verifying that application state can be exported to a local JSON file, the local storage cleared, and the exact state successfully restored by importing the file.
