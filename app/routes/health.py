from fastapi import APIRouter
from app.redis_client.connection import redis
from app.db.engine import engine
from sqlalchemy import text

router = APIRouter()
@router.get("/")
async def root():
    return {
        "service": "LLM Gateway",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }
@router.get("/health")
async def health():
    """Basic liveness probe."""
    return {"status": "ok"}

@router.get("/ready")
async def readiness():
    checks = {"database": False, "redis": False}
    
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        checks["database"] = True
    except Exception as e:
        print(f"DB health check failed: {e}")
        
    try:
        await redis.ping()
        checks["redis"] = True
    except Exception as e:
        print(f"Redis health check failed: {e}")
        
    all_ready = all(checks.values())
    status_code = 200 if all_ready else 503
    
    return {"status": "ready" if all_ready else "not ready", "checks": checks}