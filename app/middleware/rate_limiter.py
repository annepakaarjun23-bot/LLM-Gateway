from app.middleware.context import PipelineContext
from app.redis_client.rate_limiter import check_and_decrement
from app.exceptions.rate_limit import RateLimitExceededError
from config.providers import MODEL_WEIGHTS

async def apply_rate_limit(user_id: str, model: str, estimated_tokens: int, ctx: PipelineContext):

    weight = MODEL_WEIGHTS.get(model, 1.0)  
    weighted_cost = int(estimated_tokens * weight)
    
    is_allowed, retry_after = await check_and_decrement(str(user_id), weighted_cost)
    
    if not is_allowed:
        raise RateLimitExceededError(retry_after=retry_after)
        
    ctx.model_weight_multiplier = weight
    ctx.weighted_cost = weighted_cost