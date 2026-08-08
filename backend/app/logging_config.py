import logging
from .config import settings

# Map log level string from settings to logging constants
log_level_map = {
    "DEBUG": logging.DEBUG,
    "INFO": logging.INFO,
    "WARNING": logging.WARNING,
    "ERROR": logging.ERROR,
    "CRITICAL": logging.CRITICAL
}

level = log_level_map.get(settings.log_level.upper(), logging.INFO)

logging.basicConfig(
    level=level,
    format='%(asctime)s | %(name)s | %(levelname)s | %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

logger = logging.getLogger("sirvinistyles")
logger.info(f"Logging initialized with level: {settings.log_level.upper()}")
