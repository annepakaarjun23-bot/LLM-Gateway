# app/middleware/context.py

from uuid import UUID
from dataclasses import dataclass, field
from app.models.model_route import ModelRoute


@dataclass
class PipelineContext:

    user_id: UUID | None = None
    api_key_id: UUID | None = None

    input_tokens: int = 0
    estimated_output_tokens: int = 0
    estimated_total_tokens: int = 0

    model_weight_multiplier: float = 1.0
    weighted_cost: int = 0

    guardrail_blocked: bool = False
    guardrail_reason: str | None = None

    cache_hit: bool = False
    cache_key: str | None = None

    routes: list[ModelRoute] = field(default_factory=list)
    internal_model: str | None = None

    provider: str | None = None
    provider_model_id: str | None = None
    provider_latency_ms: int = 0

    response: dict | None = None
    status_code: int = 200
    output_tokens: int = 0
    total_tokens: int = 0
    error_message: str | None = None

    start_time: float = 0.0
    gateway_latency_ms: int = 0