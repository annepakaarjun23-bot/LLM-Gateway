import asyncio
from .base import BaseProvider
from .groq import GroqProvider
from .openrouter import OpenRouterProvider
from .nvidia import NvidiaProvider
from config.settings import settings
from config.providers import PROVIDER_CONFIGS

class ProviderFactory:

    _registry: dict[str, type[BaseProvider]] = {}
    _instances: dict[str, BaseProvider] = {}
    _lock: asyncio.Lock | None = None

    @classmethod
    def _get_lock(cls) -> asyncio.Lock:
        if cls._lock is None:
            cls._lock = asyncio.Lock()
        return cls._lock

    @classmethod
    def register(cls, name: str, provider_class: type[BaseProvider]):
        cls._registry[name] = provider_class

    @classmethod
    async def get_provider(cls, name: str) -> BaseProvider:

        if name not in cls._registry:
            raise ValueError(f"Provider '{name}' is not registered.")

        async with cls._get_lock():
            if name in cls._instances:
                return cls._instances[name]

            provider_class = cls._registry[name]
            config = PROVIDER_CONFIGS.get(name, {})

            api_key = cls._get_api_key(name)
            if not api_key:
                raise ValueError(f"API key for provider '{name}' is missing in settings.")

            instance = provider_class(
                api_key=api_key,
                timeout=config.get("timeout", settings.PROVIDER_TIMEOUT_DEFAULT),
                max_connections=config.get("max_connections", 20),
                max_keepalive=config.get("max_keepalive", 5)
            )

            cls._instances[name] = instance
            return instance

    @classmethod
    def _get_api_key(cls, name: str) -> str | None:
        mapping = {
            "groq": settings.GROQ_API_KEY,
            "openrouter": settings.OPENROUTER_API_KEY,
            "nvidia": settings.NVIDIA_API_KEY
        }
        return mapping.get(name)

    @classmethod
    async def close_all(cls):
        for name, instance in cls._instances.items():
            await instance.close()
        cls._instances.clear()


def initialize_providers():

    provider_map = {
        "groq": GroqProvider,
        "openrouter": OpenRouterProvider,
        "nvidia": NvidiaProvider
    }
    
    for name in settings.ENABLED_PROVIDERS:
        if name in provider_map:
            ProviderFactory.register(name, provider_map[name])