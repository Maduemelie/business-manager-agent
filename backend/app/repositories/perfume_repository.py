import logging
from typing import List, Optional, Set
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from ..models.schemas import PerfumeModel
from ..exceptions import DatabaseConnectionError
from .base import AbstractPerfumeRepository

logger = logging.getLogger(__name__)

class PerfumeRepository(AbstractPerfumeRepository):
    def __init__(self, db_url: str):
        self.db_url = db_url
        logger.info(f"PerfumeRepository initializing with db_url: {self.db_url}")

        connect_args = {}
        if self.db_url.startswith("sqlite"):
            # check_same_thread is required for sqlite multithreaded routing context
            connect_args = {"check_same_thread": False}

        try:
            # SQLite does not support pool_size or max_overflow configurations
            if self.db_url == "sqlite://" or self.db_url == "sqlite:///:memory:":
                from sqlalchemy.pool import StaticPool
                self.engine = create_engine(
                    self.db_url,
                    connect_args=connect_args,
                    poolclass=StaticPool
                )
            elif self.db_url.startswith("sqlite"):
                self.engine = create_engine(
                    self.db_url,
                    connect_args=connect_args
                )
            else:
                logger.info("Initializing connection pool parameters for PostgreSQL engine.")
                self.engine = create_engine(
                    self.db_url,
                    connect_args=connect_args,
                    pool_size=5,
                    max_overflow=10,
                    pool_timeout=30,
                    pool_pre_ping=True  # Automatically checks dead connections before using them
                )
            self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        except Exception as e:
            logger.error(f"Failed to build SQLAlchemy engine connection pool: {e}", exc_info=True)
            raise DatabaseConnectionError("Could not establish a database connection pool.", detail=str(e))

        self._create_history_table_if_not_exists()

    def _get_session(self):
        try:
            return self.SessionLocal()
        except Exception as e:
            logger.error(f"Failed to obtain session from pool: {e}", exc_info=True)
            raise DatabaseConnectionError("Could not establish a database session.", detail=str(e))

    def get_all(self) -> List[PerfumeModel]:
        logger.info("Retrieving all perfumes from database.")
        try:
            with self._get_session() as session:
                result = session.execute(text("""
                    SELECT id, image_filename, perfume_name, brand, description, 
                           scent_profile, longevity, best_for, category, image_generation_prompt 
                    FROM perfumes
                """))
                rows = result.fetchall()
                logger.info(f"Retrieved {len(rows)} perfumes.")
                return [PerfumeModel(**row._asdict()) for row in rows]
        except Exception as e:
            logger.error(f"Database error during get_all: {e}", exc_info=True)
            raise DatabaseConnectionError("Database query failed.", detail=str(e))

    def get_by_category(self, category: str) -> List[PerfumeModel]:
        logger.info(f"Retrieving perfumes for category: {category}")
        try:
            with self._get_session() as session:
                result = session.execute(text("""
                    SELECT id, image_filename, perfume_name, brand, description, 
                           scent_profile, longevity, best_for, category, image_generation_prompt 
                    FROM perfumes 
                    WHERE category = :category
                """), {"category": category})
                rows = result.fetchall()
                logger.info(f"Retrieved {len(rows)} perfumes in category '{category}'.")
                return [PerfumeModel(**row._asdict()) for row in rows]
        except Exception as e:
            logger.error(f"Database error during get_by_category for '{category}': {e}", exc_info=True)
            raise DatabaseConnectionError("Database query failed.", detail=str(e))

    def get_by_id(self, perfume_id: int) -> Optional[PerfumeModel]:
        logger.info(f"Retrieving perfume by ID: {perfume_id}")
        try:
            with self._get_session() as session:
                result = session.execute(text("""
                    SELECT id, image_filename, perfume_name, brand, description, 
                           scent_profile, longevity, best_for, category, image_generation_prompt 
                    FROM perfumes 
                    WHERE id = :id
                """), {"id": perfume_id})
                row = result.fetchone()
                if row:
                    return PerfumeModel(**row._asdict())
                return None
        except Exception as e:
            logger.error(f"Database error during get_by_id for ID {perfume_id}: {e}", exc_info=True)
            raise DatabaseConnectionError("Database query failed.", detail=str(e))

    def get_recently_used_ids(self) -> Set[int]:
        try:
            with self._get_session() as session:
                result = session.execute(text("SELECT perfume_id FROM selection_history"))
                rows = result.fetchall()
                return {row[0] for row in rows}
        except Exception as e:
            logger.error(f"Failed to fetch selection history from database: {e}", exc_info=True)
            raise DatabaseConnectionError("Database query failed to retrieve selection history.", detail=str(e))

    def add_to_recently_used(self, perfume_id: int) -> None:
        try:
            with self._get_session() as session:
                # Standard SQL to support both SQLite and PostgreSQL dialect engines
                check_result = session.execute(
                    text("SELECT 1 FROM selection_history WHERE perfume_id = :pid"),
                    {"pid": perfume_id}
                ).fetchone()
                if not check_result:
                    session.execute(
                        text("INSERT INTO selection_history (perfume_id) VALUES (:pid)"),
                        {"pid": perfume_id}
                    )
                    session.commit()
        except Exception as e:
            logger.error(f"Failed to add perfume ID {perfume_id} to selection history: {e}", exc_info=True)
            raise DatabaseConnectionError("Database operation failed to record selection history.", detail=str(e))

    def remove_from_recently_used(self, perfume_ids: List[int]) -> None:
        if not perfume_ids:
            return
        try:
            with self._get_session() as session:
                ids_str = ",".join(str(i) for i in perfume_ids)
                session.execute(text(f"DELETE FROM selection_history WHERE perfume_id IN ({ids_str})"))
                session.commit()
        except Exception as e:
            logger.error(f"Failed to remove perfume IDs from selection history: {e}", exc_info=True)
            raise DatabaseConnectionError("Database operation failed to reset selection history.", detail=str(e))

    def _create_history_table_if_not_exists(self) -> None:
        try:
            with self._get_session() as session:
                session.execute(text("""
                    CREATE TABLE IF NOT EXISTS selection_history (
                        perfume_id INTEGER PRIMARY KEY,
                        selected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """))
                session.commit()
        except Exception as e:
            logger.error(f"Failed to initialize selection_history table: {e}", exc_info=True)
            raise DatabaseConnectionError("Could not initialize database selection schema.", detail=str(e))
