import hashlib
from app.middleware.context import PipelineContext
from app.utils.normalization import normalize_payload
from app.redis_client.cache import get_cached
from config.settings import settings

async def check_cache(payload: dict, ctx: PipelineContext):
    """
    if the user request exactly matches the stored cache like it should be exactly without one word missing,
    the we hit the cache insted of sending the response to the llm.
    """
    temperature = payload.get("temperature", 0.7)
    tools = payload.get("tools") or payload.get("functions")
    
    if temperature > settings.CACHE_MAX_TEMPERATURE or tools:
        ctx.cache_key = None
        return
        
    canonical = normalize_payload(payload)
    cache_hash = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
    cache_key = f"llm_cache:{cache_hash}"
    
    ctx.cache_key = cache_key
    
    cached_response = await get_cached(cache_key)
    if cached_response:
        ctx.cache_hit = True
        ctx.response = cached_response
        ctx.status_code = 200
        usage = cached_response.get("usage", {})
        ctx.output_tokens = usage.get("completion_tokens", 0)
        ctx.total_tokens = ctx.input_tokens + ctx.output_tokens