from .base import BaseProvider

class OpenRouterProvider(BaseProvider):

    def __init__(self, api_key: str, timeout: float = 30.0, max_connections: int = 20, max_keepalive: int = 5):
        super().__init__(
            api_key=api_key, 
            provider_name="openrouter", 
            timeout=timeout, 
            max_connections=max_connections, 
            max_keepalive=max_keepalive
        )

    def get_auth_headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "HTTP-Referer": "https://llm-gateway.local",
            "X-Title": "LLM Gateway"                      
        }