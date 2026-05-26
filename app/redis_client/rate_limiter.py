from datetime import datetime
from app.redis_client.connection import redis
from config.settings import settings

async def check_and_decrement(user_id: str, weighted_cost: int) -> tuple[bool, int | None]:

    window_key = f"ratelimit_window:{user_id}"
    bucket_key = f"ratelimit:{user_id}"
    
    window_exists = await redis.exists(window_key)
    
    if not window_exists:
        async with redis.pipeline(transaction=True) as pipe:
            now_iso = datetime.utcnow().isoformat()
            pipe.set(window_key, now_iso, ex=settings.RATE_LIMIT_WINDOW_SECONDS)
            pipe.set(bucket_key, settings.RATE_LIMIT_BUCKET_MAX, ex=settings.RATE_LIMIT_WINDOW_SECONDS)
            await pipe.execute()
            
    remaining = await redis.decrby(bucket_key, weighted_cost)
    
    if remaining < 0:
        ttl = await redis.ttl(bucket_key)
        return False, ttl if ttl > 0 else settings.RATE_LIMIT_WINDOW_SECONDS
        
    return True, None