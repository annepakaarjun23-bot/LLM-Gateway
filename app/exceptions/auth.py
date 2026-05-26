from .base import GatewayError

class AuthenticationError(GatewayError):
    def __init__(self, detail: str = "Invalid or missing API key"):
        super().__init__(status_code=401, error_type="authentication_error", detail=detail)