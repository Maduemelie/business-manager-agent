import os
import logging
from ..dependencies import get_perfume_repository, get_settings

logger = logging.getLogger(__name__)

def validate_image_assets() -> None:
    """Startup validation checks to detect mismatch between database image filenames and filesystem resources."""
    logger.info("Executing startup check: validating image assets match filesystem.")
    try:
        settings = get_settings()
        repo = get_perfume_repository(settings)
        perfumes = repo.get_all()
        
        images_dir = settings.images_dir
        if not os.path.exists(images_dir):
            logger.error(f"Image assets directory does not exist: {images_dir}")
            return
            
        mismatch_count = 0
        for perfume in perfumes:
            if not perfume.image_filename:
                continue
            image_path = os.path.join(images_dir, perfume.image_filename)
            if not os.path.exists(image_path):
                logger.warning(
                    f"Asset mismatch: Perfume #{perfume.id} '{perfume.perfume_name}' "
                    f"specifies filename '{perfume.image_filename}' which does not exist on disk."
                )
                mismatch_count += 1
                
        if mismatch_count == 0:
            logger.info("Startup check: all database image file mappings found in assets folder.")
        else:
            logger.warning(f"Startup check complete. Found {mismatch_count} mapping mismatches.")
    except Exception as e:
        logger.error(f"Failed to execute startup assets verification: {e}", exc_info=True)
