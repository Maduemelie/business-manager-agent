import logging
import datetime
import zoneinfo
import os
import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from ..models.schemas import GenerateResponse, GenerateRequest
from ..services.content_orchestrator import ContentOrchestrator
from ..dependencies import get_orchestrator, get_output_repository
from ..repositories.base import AbstractOutputRepository
from ..middleware.auth import verify_api_key

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/generate/today", response_model=Optional[GenerateResponse], dependencies=[Depends(verify_api_key)])
async def get_today_post(
    output_repo: AbstractOutputRepository = Depends(get_output_repository)
):
    logger.info("Handling GET /api/generate/today API request.")
    LAGOS_TZ = zoneinfo.ZoneInfo("Africa/Lagos")
    today_prefix = datetime.datetime.now(tz=LAGOS_TZ).strftime("%Y%m%d")
    
    output_dir = getattr(output_repo, "output_dir", None)
    if not output_dir or not os.path.exists(output_dir):
        logger.info("Output directory does not exist or repository is not local.")
        return None
        
    try:
        files = os.listdir(output_dir)
    except OSError as e:
        logger.error(f"Failed to read output directory {output_dir}: {e}", exc_info=True)
        return None
        
    post_files = [f for f in files if f.startswith(today_prefix) and f.endswith("_post.json")]
    if not post_files:
        logger.info(f"No generated posts found for date {today_prefix}.")
        return None
        
    post_files.sort(reverse=True)
    latest_file = post_files[0]
    latest_file_path = os.path.join(output_dir, latest_file)
    
    logger.info(f"Retrieving latest generated post file: {latest_file_path}")
    try:
        with open(latest_file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            
            # Backward compatibility support
            if "perfume_name" not in data:
                data["perfume_name"] = "SirviniStyles Collection"
            if "brand" not in data:
                data["brand"] = "SirviniStyles"
            if "theme" not in data:
                data["theme"] = "General Luxury"
            if "week_of_month" not in data:
                data["week_of_month"] = 1
            if "active_category" not in data:
                data["active_category"] = "Oud & Luxury"
            if "is_generic" not in data:
                data["is_generic"] = True
                
            return GenerateResponse.model_validate(data)
    except Exception as e:
        logger.error(f"Failed to read or parse post JSON from {latest_file_path}: {e}", exc_info=True)
        return None

@router.post("/generate", response_model=GenerateResponse, dependencies=[Depends(verify_api_key)])
async def generate_post(
    request_data: Optional[GenerateRequest] = None,
    orchestrator: ContentOrchestrator = Depends(get_orchestrator)
):
    logger.info("Handling POST /api/generate API request.")
    perfume_id = request_data.perfume_id if request_data else None
    result = await orchestrator.generate_daily_content(perfume_id=perfume_id)
    return result
