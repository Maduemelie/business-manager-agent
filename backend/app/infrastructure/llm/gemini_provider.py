import json
import logging
from google import genai
from google.genai import types
from .base import LLMProvider
from ...exceptions import LLMServiceError

logger = logging.getLogger(__name__)

class GeminiProvider(LLMProvider):
    def __init__(self, api_key: str, model_name: str = 'gemini-2.5-flash'):
        self.api_key = api_key
        self.model_name = model_name
        self._client = None
        self._initialize_client()

    def _initialize_client(self):
        if not self.api_key or self.api_key == "your_gemini_api_key_here":
            logger.warning("Gemini API key is not configured or is set to placeholder.")
            return

        try:
            self._client = genai.Client(api_key=self.api_key)
            logger.info(f"Gemini client successfully configured with model '{self.model_name}'")
        except Exception as e:
            logger.error(f"Failed to configure Gemini client: {e}", exc_info=True)
            raise LLMServiceError("Failed to initialize Gemini API client.", detail=str(e))

    def generate_json(self, prompt: str) -> dict:
        logger.info(f"Generating content using Gemini model '{self.model_name}'")
        if not self._client:
            logger.error("Gemini client is not initialized (missing API key).")
            raise LLMServiceError("Gemini API is not configured. Please supply a valid GEMINI_API_KEY.")

        try:
            logger.info("Sending generation request to Gemini.")
            response = self._client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                )
            )
            logger.info("Response received from Gemini.")
            text = response.text.strip()
            return json.loads(text)
        except json.JSONDecodeError as jde:
            logger.error(f"Failed to parse Gemini response as JSON: {jde}. Raw response text: {response.text if 'response' in locals() else 'N/A'}", exc_info=True)
            raise LLMServiceError("LLM response was not valid JSON.", detail=str(jde))
        except Exception as e:
            logger.error(f"Gemini API request failed: {e}", exc_info=True)
            raise LLMServiceError("Gemini content generation failed.", detail=str(e))
