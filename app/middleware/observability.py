import time
from sqlalchemy.ext.asyncio import AsyncSession
from app.middleware.context import PipelineContext
from app.db.repositories import UsageLogRepo

async def log_usage(db: AsyncSession, ctx: PipelineContext):

    ctx.gateway_latency_ms = int((time.monotonic() - ctx.start_time) * 1000)
    
    try:
        await UsageLogRepo.insert_log(
            db,
            user_id=ctx.user_id,
            api_key_id=ctx.api_key_id,
            provider=ctx.provider or "unknown",
            model=ctx.provider_model_id or "unknown",
            internal_model=ctx.internal_model or "unknown",
            input_tokens=ctx.input_tokens,
            output_tokens=ctx.output_tokens,
            total_tokens=ctx.total_tokens,
            gateway_latency_ms=ctx.gateway_latency_ms,
            provider_latency_ms=ctx.provider_latency_ms,
            status_code=ctx.status_code,
            cache_hit=ctx.cache_hit,
            guardrail_blocked=ctx.guardrail_blocked,
            error_message=ctx.error_message
        )
    except Exception as e:
        print(f"CRITICAL: Failed to insert usage log: {e}")