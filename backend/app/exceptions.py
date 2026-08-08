from typing import Optional

class AppError(Exception):
    """Base application exception carrying a user-safe message and internal details."""
    def __init__(self, message: str, detail: Optional[str] = None):
        super().__init__(message)
        self.message = message
        self.detail = detail

class ExternalServiceError(AppError):
    """Exception raised when an external service API call fails."""
    pass

class WeatherServiceError(ExternalServiceError):
    """Exception raised when fetching weather information fails."""
    pass

class LLMServiceError(ExternalServiceError):
    """Exception raised when the LLM service fails to generate content."""
    pass

class LLMValidationError(ExternalServiceError):
    """Exception raised when the LLM service outputs invalid formatting or JSON."""
    pass

class DataError(AppError):
    """Exception raised when database or data retrieval errors occur."""
    pass

class PerfumeNotFoundError(DataError):
    """Exception raised when a requested perfume is not found in the database."""
    pass

class DatabaseConnectionError(DataError):
    """Exception raised when connecting to the database fails."""
    pass

class ConfigurationError(AppError):
    """Exception raised when app configurations are invalid or missing."""
    pass

class MissingAPIKeyError(ConfigurationError):
    """Exception raised when a required API key is missing."""
    pass
