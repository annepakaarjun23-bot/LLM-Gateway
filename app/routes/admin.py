import secrets
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta, timezone

from app.schemas.admin import (
    CreateKeyRequest, CreateKeyResponse, KeyInfo, ListKeysResponse,
    DeactivateKeyResponse, UsageResponse, UsageLogEntry, UsageSummary, 
    PaginationInfo, QuotaResponse, ModelsResponse, ModelInfo, RouteInfo
)
from app.auth.supabase_jwt import get_current_user_by_jwt, JWTIdentity
from app.db.session import get_db_session
from app.db.repositories import ApiKeyRepo, UsageLogRepo, ModelRouteRepo
from app.utils.hashing import hash_api_key
from app.redis_client.connection import redis
from config.settings import settings
from config.providers import CONTEXT_WINDOWS, MODEL_WEIGHTS

router = APIRouter(prefix="/admin")

@router.post("/keys", response_model=CreateKeyResponse, status_code=201)
async def create_key(
    body: CreateKeyRequest,
    identity: JWTIdentity = Depends(get_current_user_by_jwt),
    db: AsyncSession = Depends(get_db_session)
):
    """this route Generates a new API key for the authenticated user."""
    active_count = await ApiKeyRepo.count_active_by_user(db, identity.user_id)
    if active_count >= 5:
        raise HTTPException(status_code=429, detail="Maximum number of active API keys (5) reached.")
        
    raw_key = f"gwy_{secrets.token_urlsafe(32)}"
    key_hash = hash_api_key(raw_key)
    
    api_key = await ApiKeyRepo.create(db, user_id=identity.user_id, key_hash=key_hash, name=body.name)
    
    return CreateKeyResponse(
        id=api_key.id,
        name=api_key.name,
        key=raw_key,  
        created_at=api_key.created_at
    )

@router.get("/keys", response_model=ListKeysResponse)
async def list_keys(
    identity: JWTIdentity = Depends(get_current_user_by_jwt),
    db: AsyncSession = Depends(get_db_session)
):
    """this route returns List all API keys for the authenticated user."""
    keys = await ApiKeyRepo.list_by_user(db, identity.user_id)
    return ListKeysResponse(keys=[
        KeyInfo(
            id=k.id,
            name=k.name,
            is_active=k.is_active,
            created_at=k.created_at
        ) for k in keys
    ])

@router.delete("/keys/{key_id}", response_model=DeactivateKeyResponse)
async def deactivate_key(
    key_id: str, 
    identity: JWTIdentity = Depends(get_current_user_by_jwt),
    db: AsyncSession = Depends(get_db_session)
):
    try:
        from uuid import UUID
        key_uuid = UUID(key_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid key ID format")
        
    success = await ApiKeyRepo.deactivate(db, key_id=key_uuid, user_id=identity.user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Key not found or does not belong to user")
        
    return DeactivateKeyResponse(id=key_uuid)

@router.get("/usage", response_model=UsageResponse)
async def get_usage(
    from_date: datetime | None = None,
    to_date: datetime | None = None,
    model: str | None = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    identity: JWTIdentity = Depends(get_current_user_by_jwt),
    db: AsyncSession = Depends(get_db_session)
):
    logs, total_count = await UsageLogRepo.get_by_user(
        db, identity.user_id, from_date, to_date, model, page, per_page
    )
    aggregates = await UsageLogRepo.get_aggregates(
        db, identity.user_id, from_date, to_date, model
    )
    
    total_pages = (total_count + per_page - 1) // per_page
    
    return UsageResponse(
        summary=UsageSummary(**aggregates),
        logs=[UsageLogEntry(
            id=log.id,
            provider=log.provider,
            model=log.model,
            internal_model=log.internal_model,
            input_tokens=log.input_tokens,
            output_tokens=log.output_tokens,
            total_tokens=log.total_tokens,
            gateway_latency_ms=log.gateway_latency_ms,
            provider_latency_ms=log.provider_latency_ms,
            status_code=log.status_code,
            cache_hit=log.cache_hit,
            guardrail_blocked=log.guardrail_blocked,
            error_message=log.error_message,
            created_at=log.created_at
        ) for log in logs],
        pagination=PaginationInfo(
            page=page, 
            per_page=per_page, 
            total_items=total_count, 
            total_pages=total_pages
        )
    )

@router.get("/quota", response_model=QuotaResponse)
async def get_quota(
    identity: JWTIdentity = Depends(get_current_user_by_jwt)
):
    user_id_str = str(identity.user_id)
    remaining = await redis.get(f"ratelimit:{user_id_str}")
    ttl = await redis.ttl(f"ratelimit:{user_id_str}")
    
    total = settings.RATE_LIMIT_BUCKET_MAX
    
    if remaining is None:
        remaining = total
        seconds_until_reset = settings.RATE_LIMIT_WINDOW_SECONDS
        reset_at = datetime.now(timezone.utc) + timedelta(seconds=seconds_until_reset)

    else:
        remaining = int(remaining)
        seconds_until_reset = ttl if ttl > 0 else 0
        reset_at = datetime.now(timezone.utc) + timedelta(seconds=seconds_until_reset)

        
    used = max(0, total - remaining)
    
    return QuotaResponse(
        user_id=identity.user_id,
        tokens_remaining=remaining,
        tokens_total=total,
        tokens_used=used,
        window_reset_at=reset_at,
        seconds_until_reset=seconds_until_reset,
        usage_percentage=round((used / total) * 100, 2) if total > 0 else 0
    )

@router.get("/models", response_model=ModelsResponse)
async def get_models(
    identity: JWTIdentity = Depends(get_current_user_by_jwt),
    db: AsyncSession = Depends(get_db_session)
):
    grouped_routes = await ModelRouteRepo.get_all_grouped(db)
    
    models = []
    for internal_name, routes in grouped_routes.items():
        models.append(ModelInfo(
            internal_name=internal_name,
            context_window=CONTEXT_WINDOWS.get(internal_name, 4096),
            weight_multiplier=MODEL_WEIGHTS.get(internal_name, 1.0),
            routes=[
                RouteInfo(
                    provider=r.provider, 
                    provider_model_id=r.provider_model_id, 
                    priority=r.priority, 
                    is_active=r.is_active
                ) for r in routes
            ]
        ))
        
    return ModelsResponse(models=models)