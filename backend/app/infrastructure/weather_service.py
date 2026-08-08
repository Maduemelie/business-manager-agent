import time
import logging
import httpx
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from ..exceptions import WeatherServiceError

logger = logging.getLogger(__name__)

class WeatherService:
    def __init__(self, db_url: str, timeout: int = 5, cache_ttl: int = 300):
        self.db_url = db_url
        self.timeout = timeout
        self.cache_ttl = cache_ttl

        connect_args = {}
        if self.db_url.startswith("sqlite"):
            connect_args = {"check_same_thread": False}

        try:
            if self.db_url == "sqlite://" or self.db_url == "sqlite:///:memory:":
                from sqlalchemy.pool import StaticPool
                self.engine = create_engine(self.db_url, connect_args=connect_args, poolclass=StaticPool)
            else:
                self.engine = create_engine(self.db_url, connect_args=connect_args)
            self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        except Exception as e:
            logger.error(f"Failed to initialize weather cache engine: {e}", exc_info=True)
            raise WeatherServiceError("Could not establish a database connection for weather cache.", detail=str(e))

        logger.info(f"WeatherService initialized with db_url={self.db_url}, timeout={self.timeout}, cache_ttl={self.cache_ttl}")
        self._create_cache_table_if_not_exists()

    def _get_session(self):
        try:
            return self.SessionLocal()
        except Exception as e:
            logger.error(f"Failed to obtain weather cache session: {e}", exc_info=True)
            raise WeatherServiceError("Could not establish a database session.", detail=str(e))

    def _create_cache_table_if_not_exists(self) -> None:
        try:
            with self._get_session() as session:
                session.execute(text("""
                    CREATE TABLE IF NOT EXISTS weather_cache (
                        key VARCHAR(50) PRIMARY KEY,
                        value TEXT,
                        cached_at REAL
                    )
                """))
                session.commit()
        except Exception as e:
            logger.error(f"Failed to initialize weather_cache table: {e}", exc_info=True)

    async def get_current_weather(self) -> str:
        """Fetches current weather for Lagos, Nigeria using Open-Meteo API with database-backed caching."""
        now = time.time()

        cached_value = None
        cached_time = 0.0
        try:
            with self._get_session() as session:
                row = session.execute(
                    text("SELECT value, cached_at FROM weather_cache WHERE key = :key"),
                    {"key": "current_weather"}
                ).fetchone()
                if row:
                    cached_value = row[0]
                    cached_time = row[1]
        except Exception as e:
            logger.warning(f"Failed to query weather cache from database: {e}", exc_info=True)

        if cached_value and (now - cached_time < self.cache_ttl):
            logger.info(f"Returning cached weather from DB: '{cached_value}' (Age: {int(now - cached_time)}s)")
            return cached_value

        logger.info("Cache miss or expired in database. Fetching fresh weather from Open-Meteo.")
        try:
            lat, lon = 6.4541, 3.3947
            url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true"
            async with httpx.AsyncClient() as client:
                response = await client.get(url, timeout=self.timeout)
                response.raise_for_status()
                data = response.json()

            weather = data.get("current_weather", {})
            temp = weather.get("temperature", "unknown")
            code = weather.get("weathercode", -1)

            # Simple WMO Weather interpretation
            weather_desc = "Clear/Sunny"
            if code in [1, 2, 3]: weather_desc = "Partly Cloudy"
            elif code in [45, 48]: weather_desc = "Foggy"
            elif code in [51, 53, 55, 56, 57]: weather_desc = "Drizzle"
            elif code in [61, 63, 65, 66, 67]: weather_desc = "Rainy"
            elif code in [71, 73, 75, 77]: weather_desc = "Snowing (Rare!)"
            elif code in [80, 81, 82]: weather_desc = "Rain Showers"
            elif code in [95, 96, 99]: weather_desc = "Thunderstorm"

            val = f"{weather_desc}, {temp}°C"

            try:
                with self._get_session() as session:
                    session.execute(text("DELETE FROM weather_cache WHERE key = :key"), {"key": "current_weather"})
                    session.execute(
                        text("INSERT INTO weather_cache (key, value, cached_at) VALUES (:key, :val, :cat)"),
                        {"key": "current_weather", "val": val, "cat": now}
                    )
                    session.commit()
            except Exception as e:
                logger.warning(f"Failed to save weather cache to database: {e}", exc_info=True)

            logger.info(f"Successfully fetched and cached weather in DB: {val}")
            return val
        except Exception as e:
            logger.warning(f"Weather service API request failed: {e}", exc_info=True)
            if cached_value:
                logger.info(f"API failed. Falling back to expired cached weather from DB: '{cached_value}'")
                return cached_value
            raise WeatherServiceError(
                message="Failed to fetch current weather conditions.",
                detail=str(e)
            )
