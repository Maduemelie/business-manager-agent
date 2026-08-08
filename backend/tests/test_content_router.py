import pytest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient
from backend.main import app
from app.dependencies import get_orchestrator, get_llm_provider
from app.exceptions import ExternalServiceError

@pytest.fixture(autouse=True)
def run_around_tests():
    # Setup test DI overrides to avoid real LLM provider instantiations
    app.dependency_overrides[get_llm_provider] = lambda: MagicMock()
    yield
    app.dependency_overrides.clear()

def test_root_endpoint():
    client = TestClient(app)
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "Sirvinistyles Content API is running."
    assert response.json()["database"] == "healthy"

def test_root_endpoint_degraded():
    client = TestClient(app, raise_server_exceptions=False)
    
    class MockBrokenRepo:
        def get_recently_used_ids(self):
            raise Exception("Database connection timeout")
            
    from app.dependencies import get_perfume_repository
    app.dependency_overrides[get_perfume_repository] = lambda: MockBrokenRepo()
    
    response = client.get("/")
    assert response.status_code == 500
    assert response.json()["status"] == "Sirvinistyles Content API is degraded."
    assert response.json()["database"] == "unhealthy"
    assert "Database connection timeout" in response.json()["detail"]

def test_generate_requires_auth():
    client = TestClient(app)
    # 1. No key
    response = client.post("/api/generate")
    assert response.status_code == 401

    # 2. Correct key
    class DummyOrchestrator:
        async def generate_daily_content(self):
            from app.models.schemas import GenerateResponse
            return GenerateResponse(
                perfume_name="Perfume A",
                brand="Brand A",
                theme="Fragrance Spotlight",
                week_of_month=1,
                active_category="Oud & Luxury",
                is_generic=False,
                main_post="Caption content",
                whatsapp_sequence=[]
            )
            
    app.dependency_overrides[get_orchestrator] = lambda: DummyOrchestrator()
    response = client.post("/api/generate", headers={"X-API-Key": "super-secret-key"})
    assert response.status_code == 200
    assert response.json()["perfume_name"] == "Perfume A"

def test_router_exception_mapping():
    client = TestClient(app, raise_server_exceptions=False)
    
    class ErrorOrchestrator:
        async def generate_daily_content(self):
            raise ExternalServiceError("Weather fetch failed", "Open-Meteo timeout")
            
    app.dependency_overrides[get_orchestrator] = lambda: ErrorOrchestrator()
    response = client.post("/api/generate", headers={"X-API-Key": "super-secret-key"})
    assert response.status_code == 502
    assert response.json()["detail"] == "External service temporarily unavailable"
