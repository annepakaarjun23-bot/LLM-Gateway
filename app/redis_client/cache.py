import json
from app.redis_client.connection import redis
from config.settings import settings

async def get_cached(key: str) -> dict | None:
    data = await redis.get(key)
    if data:
        return json.loads(data)
    return None

async def set_cached(key: str, value: dict):
    await redis.set(key, json.dumps(value), ex=settings.CACHE_TTL_SECONDS)