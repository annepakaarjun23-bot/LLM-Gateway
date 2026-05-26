from .base import GatewayError

class GuardrailBlockedError(GatewayError):
    def __init__(self, detail: str = "Request blocked by input guardrails"):
        super().__init__(status_code=400, error_type="guardrail_error", detail=detail)

class ContextExceededError(GatewayError):
    def __init__(self, detail: str = "Estimated tokens exceed model context window"):
        super().__init__(status_code=400, error_type="context_exceeded_error", detail=detail)