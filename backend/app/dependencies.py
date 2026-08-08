import logging
from functools import lru_cache
from fastapi import Depends

from .config import settings, Settings
from .repositories.base import AbstractPerfumeRepository, AbstractOutputRepository
from .repositories.perfume_repository import PerfumeRepository
from .repositories.output_repository import OutputRepository
from .infrastructure.weather_service import WeatherService
from .infrastructure.llm.base import LLMProvider
from .infrastructure.llm.factory import create_provider
from .services.theme_engine import ThemeEngine
from .services.perfume_selector import PerfumeSelector
from .prompts.content_prompts import ContentPromptBuilder
from .services.content_orchestrator import ContentOrchestrator

logger = logging.getLogger(__name__)

@lru_cache()
def get_settings() -> Settings:
    logger.info("Providing settings singleton.")
    return settings

_perfume_repo_instance = None
_output_repo_instance = None
_weather_service_instance = None
_llm_provider_instance = None
_perfume_selector_instance = None

def get_perfume_repository(settings: Settings = Depends(get_settings)) -> AbstractPerfumeRepository:
    global _perfume_repo_instance
    if _perfume_repo_instance is None:
        logger.info(f"Creating PerfumeRepository singleton using db_url: {settings.db_url}")
        _perfume_repo_instance = PerfumeRepository(db_url=settings.db_url)
    return _perfume_repo_instance

def get_output_repository(settings: Settings = Depends(get_settings)) -> AbstractOutputRepository:
    global _output_repo_instance
    if _output_repo_instance is None:
        logger.info(f"Creating OutputRepository singleton using output_dir: {settings.output_dir}")
        _output_repo_instance = OutputRepository(
            output_dir=settings.output_dir,
            images_dir=settings.images_dir
        )
    return _output_repo_instance

def get_weather_service(settings: Settings = Depends(get_settings)) -> WeatherService:
    global _weather_service_instance
    if _weather_service_instance is None:
        logger.info("Creating WeatherService singleton.")
        _weather_service_instance = WeatherService(
            db_url=settings.db_url,
            timeout=5,
            cache_ttl=settings.weather_cache_ttl
        )
    return _weather_service_instance

def get_llm_provider(settings: Settings = Depends(get_settings)) -> LLMProvider:
    global _llm_provider_instance
    if _llm_provider_instance is None:
        logger.info("Creating LLMProvider singleton using factory.")
        _llm_provider_instance = create_provider(settings)
    return _llm_provider_instance

@lru_cache()
def get_theme_engine() -> ThemeEngine:
    logger.info("Creating ThemeEngine singleton.")
    return ThemeEngine()

@lru_cache()
def get_prompt_builder() -> ContentPromptBuilder:
    logger.info("Creating ContentPromptBuilder singleton.")
    return ContentPromptBuilder()

def get_perfume_selector(repo: AbstractPerfumeRepository = Depends(get_perfume_repository)) -> PerfumeSelector:
    global _perfume_selector_instance
    if _perfume_selector_instance is None:
        logger.info("Creating PerfumeSelector singleton.")
        _perfume_selector_instance = PerfumeSelector(perfume_repository=repo)
    return _perfume_selector_instance

def get_orchestrator(
    theme_engine: ThemeEngine = Depends(get_theme_engine),
    weather_service: WeatherService = Depends(get_weather_service),
    perfume_selector: PerfumeSelector = Depends(get_perfume_selector),
    prompt_builder: ContentPromptBuilder = Depends(get_prompt_builder),
    llm_provider: LLMProvider = Depends(get_llm_provider),
    output_repository: AbstractOutputRepository = Depends(get_output_repository)
) -> ContentOrchestrator:
    logger.info("Assembling and wiring a fresh ContentOrchestrator instance.")
    return ContentOrchestrator(
        theme_engine=theme_engine,
        weather_service=weather_service,
        perfume_selector=perfume_selector,
        prompt_builder=prompt_builder,
        llm_provider=llm_provider,
        output_repository=output_repository
    )
