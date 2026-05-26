from sqlalchemy.ext.asyncio import AsyncSession
from app.middleware.context import PipelineContext
from app.db.repositories import ModelRouteRepo
from app.exceptions.routing import ModelNotSupportedError

async def resolve_route(db: AsyncSession, model: str, ctx: PipelineContext):

    routes = await ModelRouteRepo.get_routes(db, model)
    
    if not routes:
        raise ModelNotSupportedError(detail=f"Model '{model}' is not supported or has no active routes.")
        
    ctx.routes = routes
    ctx.internal_model = model