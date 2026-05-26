FROM python:3.12-slim AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

RUN python -m venv /venv
ENV PATH="/venv/bin:$PATH"

COPY requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip==24.0 && \
    pip install --no-cache-dir -r requirements.txt

FROM python:3.12-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl postgresql-client && \
    rm -rf /var/lib/apt/lists/*

RUN groupadd -r gateway && useradd -r -g gateway gateway

COPY --from=builder --chown=gateway:gateway /venv /venv
ENV PATH="/venv/bin:$PATH" \
    VIRTUAL_ENV=/venv

COPY --chown=gateway:gateway . .

ENV TIKTOKEN_CACHE_DIR=/tmp/tiktoken

RUN sed -i 's/\r$//' /app/scripts/entrypoint.sh && chmod +x /app/scripts/entrypoint.sh

LABEL org.opencontainers.image.title="LLM Gateway" \
      org.opencontainers.image.description="API Gateway for routing requests to multiple LLM providers" \
      org.opencontainers.image.version="1.0" \
      org.opencontainers.image.source="https://github.com/"

USER gateway
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

ENTRYPOINT ["scripts/entrypoint.sh"]

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]