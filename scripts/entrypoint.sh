#!/bin/bash
set -e

echo "Extracting database host from DATABASE_URL..."
PG_HOST=$(python3 -c "
from urllib.parse import urlparse
url = '$DATABASE_URL'
standard_url = url.replace('+asyncpg', '')
print(urlparse(standard_url).hostname)
")

echo "Waiting for PostgreSQL at ${PG_HOST}..."
until pg_isready -h ${PG_HOST} -U gateway -d llm_gateway; do
  sleep 1
done
echo "PostgreSQL is ready"

echo "Running database migrations..."
alembic upgrade head
echo "Migrations complete"

echo "Starting LLM Gateway..."

exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}