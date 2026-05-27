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
    errors = {"database": None, "redis": None}
    
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        checks["database"] = True
    except Exception as e:
        error_msg = str(e)
        errors["database"] = error_msg
        print(f"DB health check failed: {error_msg}")
        import logging
        logging.error(f"Database connection error: {e}", exc_info=True)
        
    try:
        await redis.ping()
        checks["redis"] = True
    except Exception as e:
        error_msg = str(e)
        errors["redis"] = error_msg
        print(f"Redis health check failed: {error_msg}")
        import logging
        logging.error(f"Redis connection error: {e}", exc_info=True)
        
    all_ready = all(checks.values())
    status_code = 200 if all_ready else 503
    
    response = {
        "status": "ready" if all_ready else "not ready", 
        "checks": checks
    }
    if not all_ready:
        response["errors"] = errors
    
    return response