from .base import GatewayError

class RateLimitExceededError(GatewayError):
    def __init__(self, retry_after: int, detail: str = "Rate limit exceeded"):
        self.retry_after = retry_after
        super().__init__(status_code=429, error_type="rate_limit_error", detail=detail)