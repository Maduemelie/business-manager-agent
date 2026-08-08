# Sirvinistyles Project Guide (Agent)

## Project Overview
This repository contains the codebase for the Sirvinistyles Business Manager Agent. The goal of this system is to act as an AI-powered content and operations manager for a luxury perfume brand.

## Codebase Structure
The project is split into a modern web app architecture:
- **`backend/`**: Contains the FastAPI backend.
  - `main.py`: The entry point for the API server.
  - `services/`: Contains business logic, notably `generator_service.py` which interfaces with Gemini to generate luxury perfume content.
- **`frontend/`**: Contains the React + Vite frontend application.
- **`perfumes.db`**: The SQLite database containing perfume inventory and descriptions.
- **`Sirvinistyles perfume images/`**: Directory containing images of perfumes.
- **`Ready_To_Post/`**: Directory where generated social media posts (images + text) are saved.

## Legacy & Unused Files
The root directory contains several utility scripts that were used during the initial setup and data migration phase. These files are no longer in active use by the application:
1. `content_engine.py`: Deprecated script. It previously relied on a CSV file that has since been migrated to the SQLite database.
2. `migrate_db.py`: One-off script used to transition from `perfume_profiles.csv` to `perfumes.db`.
3. `import_inventory.py`: One-off script used to ingest bulk perfume data via Gemini.
4. `clean_inventory.py`: One-off cleanup script to identify and remove generic perfumes.
5. `db_check.py`: Quick utility to check DB schema.
6. `test_generation.py`: A simple test for the generator service.

## Architectural Rules
- Follow a modular structure for all new features.
- Ensure the React frontend strictly calls the FastAPI backend.
- Do not run legacy scripts (`content_engine.py`) to generate content. Use the FastAPI server which utilizes the new `generator_service.py`.
