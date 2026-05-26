from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field

class CreateKeyRequest(BaseModel):
    name: str | None = Field(None, max_length=100)

class CreateKeyResponse(BaseModel):
    id: UUID
    name: str | None
    key: str   
    created_at: datetime
    notice: str = "Store this key securely. It will not be shown again."

class KeyInfo(BaseModel):
    id: UUID
    name: str | None
    is_active: bool
    created_at: datetime

class ListKeysResponse(BaseModel):
    keys: list[KeyInfo]

class DeactivateKeyResponse(BaseModel):
    id: UUID
    is_active: bool = False
    message: str = "API key deactivated"

class UsageLogEntry(BaseModel):
    id: UUID
    provider: str
    model: str
    internal_model: str
    input_tokens: int | None
    output_tokens: int | None
    total_tokens: int | None
    gateway_latency_ms: int | None
    provider_latency_ms: int | None
    status_code: int
    cache_hit: bool
    guardrail_blocked: bool
    error_message: str | None
    created_at: datetime

class UsageSummary(BaseModel):
    total_requests: int
    total_input_tokens: int  
    total_output_tokens: int
    cache_hits: int
    blocked_requests: int
    avg_latency_ms: float
    avg_provider_latency_ms: float

class PaginationInfo(BaseModel):
    page: int
    per_page: int
    total_items: int
    total_pages: int

class UsageResponse(BaseModel):
    summary: UsageSummary
    logs: list[UsageLogEntry]
    pagination: PaginationInfo

class QuotaResponse(BaseModel):
    user_id: UUID
    tokens_remaining: int
    tokens_total: int
    tokens_used: int
    window_reset_at: datetime | None
    seconds_until_reset: int
    usage_percentage: float

class RouteInfo(BaseModel):
    provider: str
    provider_model_id: str
    priority: int
    is_active: bool

class ModelInfo(BaseModel):
    internal_name: str
    context_window: int
    weight_multiplier: float
    routes: list[RouteInfo]

class ModelsResponse(BaseModel):
    models: list[ModelInfo]