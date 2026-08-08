import sys
import os

# Resolve paths so backend packages resolve correctly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.config import settings

# Force in-memory SQLite database for all unit and integration tests
settings.database_url = "sqlite://"

import pytest
from app.repositories.perfume_repository import PerfumeRepository

@pytest.fixture(scope="session")
def test_settings():
    """Fixture providing isolated configuration settings for testing."""
    return settings

@pytest.fixture(scope="function")
def db_repo(test_settings) -> PerfumeRepository:
    """Fixture initializing a clean database schema and populating test seeds."""
    repo = PerfumeRepository(db_url=test_settings.db_url)
    with repo._get_session() as session:
        from sqlalchemy import text
        # Clean up existing tables first (since it's a function scope fixture)
        session.execute(text("DROP TABLE IF EXISTS perfumes"))
        session.execute(text("DROP TABLE IF EXISTS selection_history"))
        session.execute(text("""
            CREATE TABLE perfumes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                image_filename TEXT,
                perfume_name TEXT,
                brand TEXT,
                description TEXT,
                scent_profile TEXT,
                longevity TEXT,
                best_for TEXT,
                category TEXT,
                image_generation_prompt TEXT
            )
        """))
        session.execute(text("""
            CREATE TABLE selection_history (
                perfume_id INTEGER PRIMARY KEY,
                selected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        session.execute(text("""
            INSERT INTO perfumes (id, perfume_name, brand, category, image_filename) VALUES
            (1, 'Perfume A', 'Brand A', 'Oud & Luxury', 'a.jpg'),
            (2, 'Perfume B', 'Brand B', 'Oud & Luxury', 'b.jpg'),
            (3, 'Perfume C', 'Brand C', 'Oud & Luxury', 'c.jpg')
        """))
        session.commit()
    return repo
