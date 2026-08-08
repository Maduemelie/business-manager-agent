import logging
from fastapi import Header, HTTPException, Depends
from ..config import Settings
from ..dependencies import get_settings

logger = logging.getLogger(__name__)

def verify_api_key(
    x_api_key: str = Header(None, alias="X-API-Key"),
    settings: Settings = Depends(get_settings)
):
    """Verifies that the incoming request headers carry the valid X-API-Key."""
    expected_key = settings.api_secret_key
    if not expected_key:
        logger.error("API_SECRET_KEY is not set in the configuration.")
        raise HTTPException(
            status_code=500,
            detail="Server configuration error. Contact the administrator."
        )
        
    if not x_api_key or x_api_key != expected_key:
        logger.warning(f"Unauthorized access attempt. Valid key provided: {x_api_key is not None}")
        raise HTTPException(
            status_code=401,
            detail="Invalid or missing API Key"
        )
        
    logger.info("API Key verified successfully.")
    return x_api_key
