
MODEL_WEIGHTS: dict[str, float] = {
    "gpt-4o-mini": 1.0,    
    "mixtral-8x7b": 2.0,         
    "claude-3.5-sonnet": 3.0,
    "llama-3.3-70b": 4.0,       
    "gpt-4o": 4.0,           
    "kimi-k2-6": 4.0,             
    "mistral-large-3": 8.0,       
}


CONTEXT_WINDOWS: dict[str, int] = {
    "gpt-4o-mini": 128_000,
    "mixtral-8x7b": 32_000,
    "claude-3.5-sonnet": 200_000,
    "llama-3.3-70b": 128_000,
    "gpt-4o": 128_000,
    "kimi-k2-6": 256_000,
    "mistral-large-3": 256_000,
}

PROVIDER_CONFIGS: dict[str, dict] = {
    "groq": {
        "timeout": 15.0,
        "max_connections": 20,
        "max_keepalive": 5,
    },
    "openrouter": {
        "timeout": 30.0,
        "max_connections": 20,
        "max_keepalive": 5,
    },
    "nvidia": {
        "timeout": 45.0,
        "max_connections": 10,
        "max_keepalive": 3,
    },
}