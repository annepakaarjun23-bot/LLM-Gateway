from .base import BaseProvider

class NvidiaProvider(BaseProvider):

    def __init__(self, api_key: str, timeout: float = 45.0, max_connections: int = 10, max_keepalive: int = 3):
        super().__init__(
            api_key=api_key, 
            provider_name="nvidia", 
            timeout=timeout, 
            max_connections=max_connections, 
            max_keepalive=max_keepalive
        )

    def get_auth_headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Accept": "application/json"
        }