from app.redis_client.connection import redis
from config.settings import settings

async def is_open(provider: str) -> bool:
    key = f"provider_health:{provider}"
    failures = await redis.get(key)
    if failures is not None and int(failures) >= settings.CIRCUIT_FAILURE_THRESHOLD:
        return True
    return False  

async def record_failure(provider: str):
    key = f"provider_health:{provider}"
    pipe = redis.pipeline(transaction=True)
    pipe.incr(key)
    pipe.expire(key, settings.CIRCUIT_RESET_TTL_SECONDS, nx=True)
    await pipe.execute()

async def record_success(provider: str):
    key = f"provider_health:{provider}"
    await redis.delete(key)