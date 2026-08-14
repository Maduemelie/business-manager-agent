from abc import ABC, abstractmethod
from typing import List, Optional, Set
from ..models.schemas import PerfumeModel

class AbstractPerfumeRepository(ABC):
    @abstractmethod
    def get_all(self) -> List[PerfumeModel]:
        """Retrieve all perfumes from the catalog."""
        pass

    @abstractmethod
    def get_by_category(self, category: str) -> List[PerfumeModel]:
        """Retrieve all perfumes within a specific category."""
        pass

    @abstractmethod
    def get_recently_used_ids(self) -> Set[int]:
        """Retrieve the set of recently used perfume IDs."""
        pass

    @abstractmethod
    def add_to_recently_used(self, perfume_id: int) -> None:
        """Add a perfume ID to the selection history."""
        pass

    @abstractmethod
    def remove_from_recently_used(self, perfume_ids: List[int]) -> None:
        """Remove perfume IDs from the selection history."""
        pass

    @abstractmethod
    def get_by_id(self, perfume_id: int) -> Optional[PerfumeModel]:
        """Retrieve a specific perfume by its ID."""
        pass

class AbstractOutputRepository(ABC):
    @abstractmethod
    def save_post(self, timestamp: str, data: dict) -> str:
        """Persists generated daily social post data blueprint JSON packet."""
        pass

    @abstractmethod
    def copy_image(self, source_filename: str, timestamp: str) -> Optional[str]:
        """Copies target perfume display image resource to dynamic output generation target."""
        pass

    @abstractmethod
    def get_image_url(self, filename: str) -> Optional[str]:
        """Resolves serving URL endpoint reference for target image resource."""
        pass
