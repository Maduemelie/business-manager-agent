import os
import json
import shutil
import logging
from typing import Optional
from .base import AbstractOutputRepository

logger = logging.getLogger(__name__)

class OutputRepository(AbstractOutputRepository):
    def __init__(self, output_dir: str, images_dir: str):
        self.output_dir = output_dir
        self.images_dir = images_dir
        
        # Ensure output directory exists
        try:
            if not os.path.exists(self.output_dir):
                os.makedirs(self.output_dir, exist_ok=True)
                logger.info(f"Created output directory at {self.output_dir}")
        except OSError as e:
            logger.error(f"Failed to create output directory {self.output_dir}: {e}", exc_info=True)
            raise

    def save_post(self, timestamp: str, data: dict) -> str:
        output_text_path = os.path.join(self.output_dir, f"{timestamp}_post.json")
        logger.info(f"Saving content packet JSON file to: {output_text_path}")
        try:
            with open(output_text_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=4)
            logger.info("Content packet JSON successfully saved.")
            return output_text_path
        except IOError as e:
            logger.error(f"Failed to save content packet JSON to {output_text_path}: {e}", exc_info=True)
            raise

    def copy_image(self, source_filename: str, timestamp: str) -> Optional[str]:
        target_filename = source_filename
        source_image_path = os.path.join(self.images_dir, source_filename) if source_filename else ""
        
        # Check if the requested file exists, otherwise fallback to default_perfume.jpg
        if not source_filename or not os.path.exists(source_image_path):
            fallback_path = os.path.join(self.images_dir, "default_perfume.jpg")
            if os.path.exists(fallback_path):
                logger.info(f"Requested product image '{source_filename}' not found. Falling back to default_perfume.jpg.")
                source_image_path = fallback_path
                target_filename = "default_perfume.jpg"
            else:
                logger.warning(f"Product image file '{source_filename}' and default_perfume.jpg not found.")
                return None

        output_image_name = f"{timestamp}_{target_filename}"
        output_image_path = os.path.join(self.output_dir, output_image_name)
        logger.info(f"Copying perfume image from {source_image_path} to {output_image_path}")
        try:
            shutil.copy2(source_image_path, output_image_path)
            logger.info(f"Successfully copied image to: {output_image_path}")
            return output_image_name
        except IOError as e:
            logger.error(f"Failed to copy image from {source_image_path} to {output_image_path}: {e}", exc_info=True)
            raise

    def get_image_url(self, filename: str) -> Optional[str]:
        target_filename = filename
        if not filename or not os.path.exists(os.path.join(self.images_dir, filename)):
            if os.path.exists(os.path.join(self.images_dir, "default_perfume.jpg")):
                target_filename = "default_perfume.jpg"
            else:
                return None
        url_path = f"/images/{target_filename}"
        logger.info(f"Resolved image URL path: {url_path}")
        return url_path
