PG_USER=$(python3 -c "
from urllib.parse import urlparse
url = '$DATABASE_URL'.replace('+asyncpg', '')
parsed = urlparse(url)
print(parsed.username or 'gateway')
")

PG_DB=$(python3 -c "
from urllib.parse import urlparse
url = '$DATABASE_URL'.replace('+asyncpg', '')
parsed = urlparse(url)
# path starts with '/', so strip it
print(parsed.path.lstrip('/') or 'llm_gateway')
")

until pg_isready -h ${PG_HOST} -U ${PG_USER} -d ${PG_DB}; do
  sleep 1
done
echo "PostgreSQL is ready"

echo "Running database migrations..."
alembic upgrade head
echo "Migrations complete"

echo "Starting LLM Gateway..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --log-level info