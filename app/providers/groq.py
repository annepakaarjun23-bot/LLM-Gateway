from .base import BaseProvider

class GroqProvider(BaseProvider):

    def __init__(self, api_key: str, timeout: float = 15.0, max_connections: int = 20, max_keepalive: int = 5):
        super().__init__(
            api_key=api_key, 
            provider_name="groq", 
            timeout=timeout, 
            max_connections=max_connections, 
            max_keepalive=max_keepalive
        )

    def get_auth_headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}"
        }