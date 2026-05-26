from .base import GatewayError

class ProviderUnavailableError(GatewayError):
    def __init__(self, detail: str = "All providers unavailable"):
        super().__init__(status_code=503, error_type="provider_error", detail=detail)