import pytest
import time
from unittest.mock import AsyncMock, MagicMock, patch
from app.infrastructure.weather_service import WeatherService
from app.exceptions import WeatherServiceError

@pytest.mark.asyncio
async def test_weather_service_caching():
    # Cache TTL = 2 seconds
    service = WeatherService(db_url="sqlite://", timeout=5, cache_ttl=2)
    
    # Mock httpx AsyncClient
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "current_weather": {
            "temperature": 28.5,
            "weathercode": 0
        }
    }
    mock_response.raise_for_status = MagicMock()
    
    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_response
        
        # 1. First fetch (cache miss)
        w1 = await service.get_current_weather()
        assert w1 == "Clear/Sunny, 28.5°C"
        assert mock_get.call_count == 1
        
        # 2. Second fetch (cache hit)
        w2 = await service.get_current_weather()
        assert w2 == "Clear/Sunny, 28.5°C"
        assert mock_get.call_count == 1  # Should not fetch again
        
        # 3. Sleep 2.5 seconds to expire cache
        time.sleep(2.5)
        
        # 4. Third fetch (cache miss after expiration)
        w3 = await service.get_current_weather()
        assert w3 == "Clear/Sunny, 28.5°C"
        assert mock_get.call_count == 2
