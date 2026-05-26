from upstash_redis.asyncio import Redis
from config.settings import settings

redis = Redis(
    url=settings.UPSTASH_REDIS_REST_URL, 
    token=settings.UPSTASH_REDIS_REST_TOKEN
)