import logging
from ...config import Settings
from .base import LLMProvider
from .gemini_provider import GeminiProvider
from ...exceptions import ConfigurationError

logger = logging.getLogger(__name__)

def create_provider(settings: Settings) -> LLMProvider:
    provider_name = settings.llm_provider.lower().strip()
    logger.info(f"LLMProvider Factory creating provider for: '{provider_name}'")
    
    if provider_name == "gemini":
        return GeminiProvider(
            api_key=settings.gemini_api_key,
            model_name=settings.gemini_model
        )
    elif provider_name in ["groq", "ollama", "huggingface"]:
        # Recognized but not yet implemented in Phase C
        logger.error(f"LLM provider '{provider_name}' is not implemented yet in this version.")
        raise ConfigurationError(
            message=f"LLM provider '{provider_name}' is recognized but not implemented yet in this application.",
            detail=f"Please update LLM_PROVIDER in .env to 'gemini'."
        )
    else:
        logger.error(f"Unknown LLM provider configuration: '{provider_name}'")
        raise ConfigurationError(
            message=f"Unknown LLM provider configuration: '{provider_name}'.",
            detail="Valid choices are: 'gemini', 'groq', 'ollama'."
        )
