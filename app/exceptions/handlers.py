from fastapi import Request
from fastapi.responses import JSONResponse
from .base import GatewayError

async def gateway_error_handler(request: Request, exc: GatewayError) -> JSONResponse:
    content = {
        "error": {
            "type": exc.error_type,
            "message": exc.detail,
        }
    }
    if hasattr(exc, "retry_after"):
        content["error"]["retry_after_seconds"] = exc.retry_after
        
    return JSONResponse(status_code=exc.status_code, content=content)