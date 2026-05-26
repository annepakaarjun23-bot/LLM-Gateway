from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.utils.logging import setup_logging
from app.middleware.request_id import RequestIDMiddleware
from app.routes.chat import router as chat_router
from app.routes.models_route import router as models_router
from app.routes.admin import router as admin_router
from app.routes.health import router as health_router
from app.providers.factory import initialize_providers, ProviderFactory
from app.redis_client.connection import redis
from app.exceptions.handlers import gateway_error_handler
from app.exceptions.base import GatewayError

setup_logging()

@asynccontextmanager
async def lifespan(app: FastAPI):
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info("Starting LLM Gateway...")
    initialize_providers()
    logger.info("Providers initialized.")
    
    yield
    
    logger.info("Shutting down LLM Gateway...")
    await ProviderFactory.close_all()
    logger.info("Provider connection pools closed.")
    await redis.aclose()
    logger.info("Redis connection closed.")

app = FastAPI(
    title="LLM Gateway",
    description="Production-grade LLM Gateway with OpenAI-compatible API",
    version="1.0.0",
    lifespan=lifespan
)
app.add_middleware(RequestIDMiddleware)

from config.settings import settings

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.DASHBOARD_URL],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(GatewayError, gateway_error_handler)

app.include_router(health_router, tags=["Health"])
app.include_router(chat_router, tags=["LLM"])
app.include_router(models_router, tags=["LLM"])
app.include_router(admin_router, tags=["Admin"])