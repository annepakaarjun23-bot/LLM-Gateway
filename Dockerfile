FROM python:3.12-slim AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends gcc libpq-dev

COPY pyproject.toml requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.12-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends postgresql-client && \
    rm -rf /var/lib/apt/lists/*

RUN groupadd -r gateway && useradd -r -g gateway gateway

COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY . .

ENV TIKTOKEN_CACHE_DIR=/tmp/tiktoken

RUN chmod +x /app/scripts/entrypoint.sh

USER gateway
EXPOSE 8000

ENTRYPOINT ["/app/scripts/entrypoint.sh"]