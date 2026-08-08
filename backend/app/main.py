import logging
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .dependencies import get_settings, get_perfume_repository
from .repositories.base import AbstractPerfumeRepository
from .middleware.error_handler import register_error_handlers
from .routers.content import router as content_router
from .services.startup_checks import validate_image_assets

logger = logging.getLogger(__name__)

def create_app() -> FastAPI:
    """FastAPI Application Factory."""
    logger.info("Initializing app factory build.")
    
    # Run startup asset verification checks
    validate_image_assets()
    
    settings = get_settings()
    
    app = FastAPI(
        title="Sirvinistyles API",
        description="Business content manager API for luxury perfume social distribution."
    )
    
    # 1. CORS Middleware setup using clean allowed_origins setting list
    logger.info(f"Configuring CORSMiddleware with origins: {settings.allowed_origins}")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # 2. Register global application custom error handlings
    register_error_handlers(app)
    
    # 3. Mount static file directories
    logger.info(f"Mounting static directories for serving images from: {settings.images_dir}")
    app.mount("/images", StaticFiles(directory=settings.images_dir), name="images")
    
    # 4. Bind content api router
    app.include_router(content_router, prefix="/api")
    
    # 5. Public root endpoint for simple health-check queries
    @app.get("/")
    def read_root(
        perfume_repo: AbstractPerfumeRepository = Depends(get_perfume_repository)
    ):
        db_status = "healthy"
        detail = None
        try:
            perfume_repo.get_recently_used_ids()
        except Exception as e:
            db_status = "unhealthy"
            detail = str(e)
            logger.error(f"Database health diagnostics failed: {e}", exc_info=True)
            
        if db_status == "healthy":
            return {
                "status": "Sirvinistyles Content API is running.",
                "database": db_status
            }
        else:
            from fastapi.responses import JSONResponse
            return JSONResponse(
                status_code=500,
                content={
                    "status": "Sirvinistyles Content API is degraded.",
                    "database": db_status,
                    "detail": detail
                }
            )
        
    logger.info("FastAPI application instance constructed successfully.")
    return app
