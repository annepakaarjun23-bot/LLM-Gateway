import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
import logging

logger = logging.getLogger(__name__)

class RequestIDMiddleware(BaseHTTPMiddleware):

    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        request.state.request_id = request_id
        
        if request.url.path not in ("/health", "/ready", "/"):
            logger.info(
                f"Request started: {request.method} {request.url.path}",
                extra={"request_id": request_id}
            )
        
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        
        if request.url.path not in ("/health", "/ready", "/"):
            logger.info(
                f"Request finished: {response.status_code}",
                extra={"request_id": request_id}
            )
        
        return response