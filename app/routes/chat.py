from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.chat import ChatCompletionRequest
from app.auth.api_key_auth import get_current_user_by_api_key, APIKeyIdentity
from app.db.session import get_db_session
from app.middleware.pipeline import run_pipeline

router = APIRouter()

@router.post("/v1/chat/completions")
async def chat_completions(
    body: ChatCompletionRequest,
    identity: APIKeyIdentity = Depends(get_current_user_by_api_key),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Main LLM endpoint. Passes through the 9-stage pipeline.
    Returns raw JSON response from the provider (OpenAI-compatible).
    """
    payload = body.model_dump(exclude_none=True)
    
    payload["messages"] = [m.model_dump(exclude_none=True) for m in body.messages]
    
    ctx = await run_pipeline(payload=payload, identity=identity, db=db)
    
    if ctx.response is None:
        return JSONResponse(
            content={"error": {"type": "pipeline_error", "message": ctx.error_message}},
            status_code=ctx.status_code
        )
    
    return JSONResponse(content=ctx.response, status_code=ctx.status_code)