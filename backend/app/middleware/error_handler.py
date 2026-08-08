import logging
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from ..exceptions import (
    ExternalServiceError, LLMValidationError, DataError, ConfigurationError
)

logger = logging.getLogger(__name__)

def register_error_handlers(app: FastAPI):
    """Registers global exception handlers for mapping application errors to client responses."""
    
    @app.exception_handler(ExternalServiceError)
    async def external_service_error_handler(request: Request, exc: ExternalServiceError):
        logger.error(f"ExternalServiceError handled: {exc.message}. Detail: {exc.detail}", exc_info=True)
        return JSONResponse(
            status_code=502,
            content={"detail": "External service temporarily unavailable"}
        )

    @app.exception_handler(LLMValidationError)
    async def llm_validation_error_handler(request: Request, exc: LLMValidationError):
        logger.error(f"LLMValidationError handled: {exc.message}. Detail: {exc.detail}", exc_info=True)
        return JSONResponse(
            status_code=502,
            content={"detail": "Content generation failed, please retry"}
        )

    @app.exception_handler(DataError)
    async def data_error_handler(request: Request, exc: DataError):
        logger.error(f"DataError handled: {exc.message}. Detail: {exc.detail}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal data error"}
        )

    @app.exception_handler(ConfigurationError)
    async def configuration_error_handler(request: Request, exc: ConfigurationError):
        logger.error(f"ConfigurationError handled: {exc.message}. Detail: {exc.detail}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"detail": "Server configuration error"}
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled general exception caught: {exc}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"detail": "An unexpected error occurred"}
        )
