import os
import sys
import logging
from sqlalchemy import create_engine, text

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger(__name__)

# Paths
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
SQLITE_DB_PATH = os.path.join(BASE_DIR, "perfumes.db")

# Neon Postgres URL
NEON_DATABASE_URL = "postgresql://neondb_owner:npg_ryVIUln1d9sF@ep-round-fog-ay38uzj4.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require"

def migrate():
    logger.info(f"Source SQLite DB: {SQLITE_DB_PATH}")
    logger.info("Target: Neon PostgreSQL database")

    # Connect to SQLite
    sqlite_engine = create_engine(f"sqlite:///{SQLITE_DB_PATH.replace('\\', '/')}")
    
    # Connect to PostgreSQL
    postgres_engine = create_engine(NEON_DATABASE_URL)

    with postgres_engine.begin() as pg_conn:
        logger.info("Creating tables in PostgreSQL if not exist...")
        
        # 1. Create perfumes table
        pg_conn.execute(text("""
            CREATE TABLE IF NOT EXISTS perfumes (
                id SERIAL PRIMARY KEY,
                image_filename TEXT,
                perfume_name TEXT,
                brand TEXT,
                description TEXT,
                scent_profile TEXT,
                longevity TEXT,
                best_for TEXT,
                category TEXT,
                image_generation_prompt TEXT
            );
        """))

        # 2. Create selection_history table
        pg_conn.execute(text("""
            CREATE TABLE IF NOT EXISTS selection_history (
                perfume_id INTEGER PRIMARY KEY,
                selected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """))
        logger.info("Tables created / verified.")

    # Fetch rows from SQLite
    with sqlite_engine.connect() as sqlite_conn:
        result = sqlite_conn.execute(text("""
            SELECT id, image_filename, perfume_name, brand, description,
                   scent_profile, longevity, best_for, category, image_generation_prompt
            FROM perfumes
        """))
        rows = [row._asdict() for row in result.fetchall()]
        logger.info(f"Retrieved {len(rows)} perfumes from SQLite.")

    if not rows:
        logger.warning("No rows found in SQLite database to migrate.")
        return

    # Insert rows into PostgreSQL
    with postgres_engine.begin() as pg_conn:
        logger.info("Populating perfumes table in Neon PostgreSQL...")
        for row in rows:
            pg_conn.execute(text("""
                INSERT INTO perfumes (id, image_filename, perfume_name, brand, description,
                                      scent_profile, longevity, best_for, category, image_generation_prompt)
                VALUES (:id, :image_filename, :perfume_name, :brand, :description,
                        :scent_profile, :longevity, :best_for, :category, :image_generation_prompt)
                ON CONFLICT (id) DO UPDATE SET
                    image_filename = EXCLUDED.image_filename,
                    perfume_name = EXCLUDED.perfume_name,
                    brand = EXCLUDED.brand,
                    description = EXCLUDED.description,
                    scent_profile = EXCLUDED.scent_profile,
                    longevity = EXCLUDED.longevity,
                    best_for = EXCLUDED.best_for,
                    category = EXCLUDED.category,
                    image_generation_prompt = EXCLUDED.image_generation_prompt;
            """), row)
            
        # Update sequence so new inserts don't conflict with existing IDs
        pg_conn.execute(text("""
            SELECT setval(pg_get_serial_sequence('perfumes', 'id'), coalesce(max(id), 1)) FROM perfumes;
        """))
        logger.info(f"Successfully migrated {len(rows)} perfumes to Neon PostgreSQL.")

    # Verify count
    with postgres_engine.connect() as pg_conn:
        count = pg_conn.execute(text("SELECT COUNT(*) FROM perfumes")).scalar()
        logger.info(f"Verification: Neon PostgreSQL 'perfumes' table currently contains {count} records.")

if __name__ == "__main__":
    migrate()
