from .base import GatewayError

class ModelNotSupportedError(GatewayError):
    def __init__(self, detail: str = "Model not supported"):
        super().__init__(status_code=400, error_type="routing_error", detail=detail)