from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.api_key_auth import get_current_user_by_api_key, APIKeyIdentity
from app.db.session import get_db_session
from app.db.repositories import ModelRouteRepo
from config.providers import CONTEXT_WINDOWS, MODEL_WEIGHTS

router = APIRouter()

@router.get("/v1/models")
async def list_models(
    identity: APIKeyIdentity = Depends(get_current_user_by_api_key),
    db: AsyncSession = Depends(get_db_session)
):

    grouped_routes = await ModelRouteRepo.get_all_grouped(db)
    
    data = []
    for internal_name, routes in grouped_routes.items():
        active_routes = [r for r in routes if r.is_active]
        if not active_routes:
            continue
            
        data.append({
            "id": internal_name,
            "object": "model",
            "created": 1700000000,  # Static timestamp
            "owned_by": "gateway",
            "context_window": CONTEXT_WINDOWS.get(internal_name, 4096),
            "weight_multiplier": MODEL_WEIGHTS.get(internal_name, 1.0)
        })
        
    return {"object": "list", "data": data}