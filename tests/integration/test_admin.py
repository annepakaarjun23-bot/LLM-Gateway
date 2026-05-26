import pytest
from unittest.mock import AsyncMock, patch

@pytest.mark.asyncio
async def test_get_models(client):
    with patch("app.routes.admin.ModelRouteRepo.get_all_grouped", new_callable=AsyncMock) as mock_repo:
        mock_repo.return_value = {
            "llama-3.3-70b": []
        }
        response = await client.get("/admin/models")
        
    assert response.status_code == 200
    assert "models" in response.json()

@pytest.mark.asyncio
async def test_get_quota(client, mock_jwt_identity):
    with patch("app.routes.admin.redis.get", new_callable=AsyncMock, return_value="50000"), \
         patch("app.routes.admin.redis.ttl", new_callable=AsyncMock, return_value=14000):
        
        response = await client.get("/admin/quota")
        
    assert response.status_code == 200
    data = response.json()
    assert data["tokens_remaining"] == 50000
    assert data["tokens_total"] == 100000