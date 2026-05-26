import redis.asyncio as aioredis
from config.settings import settings

redis = aioredis.from_url(
    settings.REDIS_URL,
    max_connections=settings.REDIS_POOL_SIZE,
    decode_responses=True
)