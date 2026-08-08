import logging
from fastapi import APIRouter, Depends
from ..models.schemas import GenerateResponse
from ..services.content_orchestrator import ContentOrchestrator
from ..dependencies import get_orchestrator
from ..middleware.auth import verify_api_key

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/generate", response_model=GenerateResponse, dependencies=[Depends(verify_api_key)])
async def generate_post(orchestrator: ContentOrchestrator = Depends(get_orchestrator)):
    logger.info("Handling POST /api/generate API request.")
    # Delegates execution entirely to the async content orchestrator service
    result = await orchestrator.generate_daily_content()
    return result
