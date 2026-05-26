import time
import httpx

from app.middleware.context import PipelineContext
from app.providers.factory import ProviderFactory
from app.redis_client.circuit_breaker import (
    is_open,
    record_failure,
    record_success
)
from app.exceptions.provider import ProviderUnavailableError


async def execute_call(payload: dict, ctx: PipelineContext):


    last_error = None

    for route in ctx.routes:
        provider_name = route.provider

        if await is_open(provider_name):
            continue
        try:
            provider = await ProviderFactory.get_provider(provider_name)

        except ValueError as e:
            last_error = e
            continue

        provider_start = time.monotonic()

        try:
            response = await provider.call(
                endpoint_url=route.endpoint_url,
                payload=payload.copy(),
                provider_model_id=route.provider_model_id
            )

            response_data = response.json()

            response.raise_for_status()

            response_data = provider.transform_response(response_data)

            ctx.provider = provider_name
            ctx.provider_model_id = route.provider_model_id
            ctx.provider_latency_ms = int(
                (time.monotonic() - provider_start) * 1000
            )

            ctx.response = response_data
            ctx.status_code = response.status_code

            usage = response_data.get("usage", {})

            ctx.output_tokens = usage.get(
                "completion_tokens",
                0
            )

            ctx.total_tokens = usage.get(
                "total_tokens",
                ctx.input_tokens + ctx.output_tokens
            )

            await record_success(provider_name)

            return

        except httpx.TimeoutException as e:

            await record_failure(provider_name)

            last_error = e

            continue

        except httpx.HTTPStatusError as e:

            await record_failure(provider_name)

            last_error = e

            status = e.response.status_code

            if status == 429 or status >= 500:
                continue

            ctx.status_code = status

            ctx.provider = provider_name
            ctx.provider_model_id = route.provider_model_id

            ctx.provider_latency_ms = int(
                (time.monotonic() - provider_start) * 1000
            )

            try:
                ctx.response = e.response.json()

            except Exception:
                ctx.response = {
                    "error": str(e)
                }

            ctx.error_message = str(ctx.response)

            return

        except httpx.RequestError as e:

            await record_failure(provider_name)

            last_error = e

            continue

        except Exception as e:

            await record_failure(provider_name)

            last_error = e

            continue
    ctx.status_code = 503

    ctx.error_message = (
        str(last_error)
        if last_error
        else "All providers unavailable"
    )

    raise ProviderUnavailableError(
        detail=ctx.error_message
    )