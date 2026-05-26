class GatewayError(Exception):
    def __init__(self, status_code: int, error_type: str, detail: str):
        self.status_code = status_code
        self.error_type = error_type
        self.detail = detail
        super().__init__(detail)