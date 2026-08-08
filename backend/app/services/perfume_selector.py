import logging
import random
from typing import Optional, Set
from ..models.schemas import PerfumeModel
from ..repositories.base import AbstractPerfumeRepository

logger = logging.getLogger(__name__)

class PerfumeSelector:
    def __init__(self, perfume_repository: AbstractPerfumeRepository):
        self.repo = perfume_repository
        logger.info("PerfumeSelector initialized with persistent database history.")

    def select_perfume(self, category: str) -> Optional[PerfumeModel]:
        logger.info(f"Selecting perfume for category '{category}' with persistent history tracking.")
        
        # 1. Fetch all perfumes in category
        perfumes = self.repo.get_by_category(category)
        if not perfumes:
            logger.warning(f"No perfumes found for category '{category}'. Falling back to entire catalog.")
            perfumes = self.repo.get_all()
            
        if not perfumes:
            logger.error("No perfumes found in database catalog at all.")
            return None

        # 2. Get recently used IDs from the persistent repository
        recently_used = self.repo.get_recently_used_ids()

        # Filter out recently used
        available = [p for p in perfumes if p.id not in recently_used]
        
        if not available:
            logger.info(f"All available perfumes in category '{category}' (or catalog) have been recently used. Resetting history for these IDs.")
            # Reset history only for the subset of perfume IDs found in this search list
            perfume_ids = [p.id for p in perfumes]
            self.repo.remove_from_recently_used(perfume_ids)
            available = perfumes

        # 3. Choose randomly from available
        selected = random.choice(available)
        self.repo.add_to_recently_used(selected.id)
        
        # Retrieve updated selection history size for logging
        updated_history_size = len(self.repo.get_recently_used_ids())
        logger.info(f"Successfully selected perfume '{selected.perfume_name}' (ID: {selected.id}). Persistent history size: {updated_history_size}")
        return selected
