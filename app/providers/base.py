from abc import ABC, abstractmethod
import httpx

class BaseProvider(ABC):
    """
    The main abstractionmethod class which will be inhereted by the provider class,
    so we no need to change any code we can add multiple providers with this one abstraction class without changing any code.
    """
    
    def __init__(
        self, 
        api_key: str, 
        provider_name: str, 
        timeout: float = 30.0, 
        max_connections: int = 20, 
        max_keepalive: int = 5
    ):
        self.api_key = api_key
        self.provider_name = provider_name
        
        self.client = httpx.AsyncClient(
            timeout=httpx.Timeout(timeout, connect=5.0),
            limits=httpx.Limits(
                max_connections=max_connections,
                max_keepalive_connections=max_keepalive
            )
        )

    @abstractmethod
    def get_auth_headers(self) -> dict[str, str]:
        ...

    def transform_request(self, payload: dict, provider_model_id: str) -> dict:

        payload["model"] = provider_model_id
        payload["stream"] = False 
        return payload

    def transform_response(self, response: dict) -> dict:

        return response

    async def call(self, endpoint_url: str, payload: dict, provider_model_id: str) -> httpx.Response:

        transformed_payload = self.transform_request(payload, provider_model_id)
        headers = self.get_auth_headers()
        headers["Content-Type"] = "application/json"
        
        return await self.client.post(
            endpoint_url,
            json=transformed_payload,
            headers=headers
        )

    async def close(self):
        await self.client.aclose()