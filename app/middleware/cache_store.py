from app.middleware.context import PipelineContext
from app.redis_client.cache import set_cached

async def store_cache(ctx: PipelineContext):

    if ctx.cache_key and ctx.response and ctx.status_code == 200:
        await set_cached(ctx.cache_key, ctx.response)