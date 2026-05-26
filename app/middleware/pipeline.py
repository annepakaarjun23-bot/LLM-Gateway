import time
from dataclasses import dataclass, field
from sqlalchemy.ext.asyncio import AsyncSession
from app.auth.api_key_auth import APIKeyIdentity
from app.middleware.token_estimator import estimate_tokens
from app.middleware.rate_limiter import apply_rate_limit
from app.middleware.guardrails import run_all_guardrails
from app.middleware.cache_lookup import check_cache
from app.middleware.router import resolve_route
from app.middleware.provider_caller import execute_call
from app.middleware.cache_store import store_cache
from app.middleware.observability import log_usage
from app.exceptions.base import GatewayError
from app.exceptions.guardrail import GuardrailBlockedError
from app.middleware.context import PipelineContext


async def run_pipeline(
    payload: dict, 
    identity: APIKeyIdentity, 
    db: AsyncSession
) -> PipelineContext:
    """
    The main Pipeline. The user request passes through multiple steps and returns the response from the provider.
    """
    ctx = PipelineContext()
    ctx.start_time = time.monotonic()
    
    ctx.user_id = identity.user_id
    ctx.api_key_id = identity.api_key_id
    
    try:
        estimate_tokens(
            messages=payload.get("messages", []), 
            model=payload.get("model"), 
            max_tokens=payload.get("max_tokens"), 
            ctx=ctx
        )
        
        await apply_rate_limit(
            user_id=ctx.user_id, 
            model=payload.get("model"), 
            estimated_tokens=ctx.estimated_total_tokens, 
            ctx=ctx
        )
        
        run_all_guardrails(payload=payload, ctx=ctx)
        
        await check_cache(payload=payload, ctx=ctx)
        if ctx.cache_hit:
            ctx.provider = "cache"
            ctx.provider_latency_ms = 0
            return ctx  
            
        await resolve_route(db=db, model=payload.get("model"), ctx=ctx)
        
        await execute_call(payload=payload, ctx=ctx)
        
        if ctx.status_code == 200:
            await store_cache(ctx=ctx)
            
    except GatewayError as e:
        ctx.status_code = e.status_code
        ctx.error_message = e.detail
        ctx.guardrail_blocked = isinstance(e, GuardrailBlockedError) 
        raise
        
    except Exception as e:
        ctx.status_code = 500
        ctx.error_message = str(e)
        raise
        
    finally:
        await log_usage(db=db, ctx=ctx)
        
    return ctx