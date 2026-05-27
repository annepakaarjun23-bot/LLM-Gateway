
readme_content = '''# LLM Gateway

> A production-grade, multi-provider LLM reverse proxy with OpenAI-compatible API, intelligent failover, token-weighted rate limiting, input guardrails, exact-match caching, and full observability.

[![Python](https://img.shields.io/badge/Python-3.12-blue)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-green)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB)](https://react.dev)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED)](https://docker.com)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)
- [Screenshots](#screenshots)
- [System Design at Scale](#system-design-at-scale)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

LLM Gateway sits between your application and multiple LLM providers, exposing a single **OpenAI-compatible API** while handling routing, resilience, security, and observability transparently.

**Why not call providers directly?**

| Direct Provider Call | Via LLM Gateway |
|---|---|
| Coupled to one provider\'s format | OpenAI-compatible abstraction |
| Exposed to provider downtime | Automatic failover with circuit breakers |
| No cost control | Token-weighted rate limiting per user |
| No input validation | 3-layer guardrails before spending tokens |
| No caching | Exact-match cache skips provider calls |
| No observability | Full request tracing and usage analytics |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                     │
│         (curl, Python SDK, LangChain, React Dashboard)                  │
└──────────────────────────┬──────────────────────────────────────────────┘
                           │  POST /v1/chat/completions
                           │  Authorization: Bearer <gateway_key>
                           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        FASTAPI GATEWAY                                   │
│  ┌──────────┐ ┌──────────────┐ ┌─────────────┐ ┌─────────────────────┐  │
│  │   Auth   │→│ Token Est.   │→│ Rate Limit  │→│  Input Guardrails   │  │
│  │ (API Key)│ │ (tiktoken)   │ │ (Redis)     │ │ (3-layer regex)     │  │
│  └──────────┘ └──────────────┘ └─────────────┘ └─────────────────────┘  │
│         ┌────────────┐    ┌──────────────┐    ┌─────────────────────┐    │
│         │   Cache    │→→→ │   Router     │→→→ │  Provider Call +    │    │
│         │  (Redis)   │    │  (Static DB) │    │  Failover Loop      │    │
│         └────────────┘    └──────────────┘    └─────────────────────┘    │
│                              │                                          │
│                              ▼                                          │
│                   ┌─────────────────────┐                               │
│                   │  Observability      │                               │
│                   │  (PostgreSQL logs)  │                               │
│                   └─────────────────────┘                               │
└─────────────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
   ┌─────────┐          ┌──────────┐          ┌─────────┐
   │  Groq   │          │OpenRouter│          │ NVIDIA  │
   │(15s/20) │          │(30s/20)  │          │(45s/10) │
   └─────────┘          └──────────┘          └─────────┘
```

### 9-Stage Pipeline

| Stage | Component | Purpose |
|-------|-----------|---------|
| 1 | **API Key Auth** | SHA-256 hash lookup, attaches `user_id` |
| 2 | **Token Estimation** | `tiktoken` counts input, checks context window |
| 3 | **Rate Limiting** | Token-weighted bucket (5h reset), `DECRBY` in Redis |
| 4 | **Input Guardrails** | Schema validation, prompt injection detection, size limits |
| 5 | **Cache Lookup** | SHA-256 of normalized payload → Redis GET |
| 6 | **Static Router** | DB lookup: `internal_model` → ordered provider routes |
| 7 | **Provider Call** | Circuit breaker check, HTTP call, failover loop |
| 8 | **Cache Store** | Redis SET with 10min TTL on success |
| 9 | **Observability** | `finally` block: INSERT usage log to PostgreSQL |

---

## Key Features

### Dual Authentication System

| System | Mechanism | Endpoints | Purpose |
|--------|-----------|-----------|---------|
| **API Key Auth** | SHA-256 hash of `gwy_...` key | `/v1/*` | Machine-to-machine LLM access |
| **Supabase JWT** | RS256 verification, JWKS caching | `/admin/*` | Dashboard user sessions |

### Token-Weighted Rate Limiting

Each user gets a **100,000-token bucket** that refills every 5 hours. Model size determines cost:

| Model Size | Examples | Weight | 1K Token Request Cost |
|-----------|----------|--------|----------------------|
| Small (≤8B) | gpt-4o-mini, gemma | 1.0× | 1,000 tokens |
| Medium (≤70B) | mixtral-8x7b, llama-3.3-70b | 2.0–4.0× | 2,000–4,000 tokens |
| Large (>70B) | mistral-large-3 (675B) | 8.0× | 8,000 tokens |

### Multi-Provider Failover

```
llama-3.3-70b ──→ Groq (priority 1) ──× timeout ──→ OpenRouter (priority 2) ──→ ✓ success
```

- **Circuit Breaker:** 5 failures in 5min → skip provider for 5min
- **Isolated Pools:** Each provider has its own `httpx.AsyncClient` with distinct timeouts and connection limits
- **Fast Fail:** Groq 15s, OpenRouter 30s, NVIDIA 45s

### Input Guardrails (3 Layers)

1. **Schema & Sanity:** OpenAI-compatible validation, temperature bounds, payload size ≤1MB
2. **Prompt Injection:** Regex detection of "ignore instructions", "DAN", "jailbreak", delimiter abuse, embedded roles
3. **Content Size:** Single message ≤50,000 characters

**Blocked requests return 400 immediately — zero provider tokens spent.**

### Exact-Match Caching

- Cache key: `SHA-256(json.dumps({model, messages, temperature}, sort_keys=True))`
- TTL: 10 minutes
- Skip conditions: `temperature > 0.3`, tools/functions present, streaming enabled
- **Cache hit latency: ~2ms** (vs ~350ms provider call)

---

## Tech Stack

### Backend
| Layer | Technology |
|-------|------------|
| Framework | FastAPI + `httpx` (async) |
| Database | PostgreSQL 16 + `asyncpg` + SQLAlchemy 2.0 |
| Migrations | Alembic (async) |
| Cache / Rate Limit | Redis 7 + `redis-py` |
| Token Counting | `tiktoken` |
| JWT Verification | `PyJWT` + JWKS caching |
| Deployment | Docker + Docker Compose |

### Frontend
| Layer | Technology |
|-------|------------|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS |
| Components | shadcn/ui |
| Data Fetching | TanStack Query v5 |
| Charts | Recharts |
| Auth | Supabase `@supabase/supabase-js` |
| Icons | Lucide React |

---

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for frontend dev)
- Python 3.12+ (for backend dev)

### 1. Clone & Configure

```bash
git clone https://github.com/yourusername/llm-gateway.git
cd llm-gateway

# Copy environment template
cp .env.example .env
# Edit .env with your real API keys
```

### 2. Start Infrastructure

```bash
docker-compose up -d postgres redis
```

### 3. Run Migrations

```bash
docker-compose run --rm gateway alembic upgrade head
```

### 4. Start Backend

```bash
# With Docker
docker-compose up -d gateway

# Or locally
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 5. Start Frontend

```bash
cd gateway_ui
npm install
npm run dev
```

### 6. Generate Test API Key

```bash
docker-compose exec gateway python scripts/generate_api_key.py test@example.com "Dev Key"
```

### 7. Test the Gateway

```python
import httpx

client = httpx.Client(base_url="http://localhost:8000")

response = client.post(
    "/v1/chat/completions",
    headers={"Authorization": "Bearer gwy_your_key_here"},
    json={
        "model": "gpt-4o-mini",
        "messages": [{"role": "user", "content": "Hello!"}],
        "temperature": 0.3
    }
)

print(response.json()["choices"][0]["message"]["content"])
```

---

## Project Structure

```
llm-gateway/
│
├── docker-compose.yml          # Full stack orchestration
├── Dockerfile                  # Backend multi-stage build
├── .env.example                # Environment template
├── requirements.txt            # Python dependencies
├── alembic.ini                 # Migration config
│
├── app/                        # FastAPI backend
│   ├── main.py                 # App factory + lifespan
│   ├── models/                 # SQLAlchemy ORM
│   ├── schemas/                # Pydantic models
│   ├── db/                     # Engine, session, repositories
│   ├── redis_client/           # Rate limit, cache, circuit breaker
│   ├── auth/                   # Dual auth: API key + Supabase JWT
│   ├── middleware/             # 9-stage pipeline
│   ├── providers/              # BaseProvider + Groq/OpenRouter/NVIDIA
│   ├── routes/                 # Chat, admin, health endpoints
│   ├── utils/                  # Hashing, token count, normalization
│   └── exceptions/             # Custom exception hierarchy
│
├── alembic/
│   └── versions/               # Migrations + seed data
│
├── scripts/
│   ├── generate_api_key.py     # CLI key generator
│   └── entrypoint.sh           # Docker boot script
│
├── tests/                      # pytest suite
│
└── gateway_ui/                 # React dashboard
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── pages/              # Login, Dashboard, Keys, Usage, Models, Docs
        ├── components/         # Reusable UI components
        ├── lib/                # Supabase client, API client
        └── hooks/              # TanStack Query hooks
```

---

## API Reference

### LLM Endpoints (API Key Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/v1/chat/completions` | Main LLM endpoint — full 9-stage pipeline |
| `GET` | `/v1/models` | List available models with context windows |

### Admin Endpoints (Supabase JWT Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/admin/keys` | Generate new API key (shows raw key once) |
| `GET` | `/admin/keys` | List user\'s API keys |
| `DELETE` | `/admin/keys/{id}` | Deactivate an API key |
| `GET` | `/admin/usage` | Usage logs with pagination + aggregates |
| `GET` | `/admin/quota` | Current rate limit bucket status |
| `GET` | `/admin/models` | Available models with routing details |

### Health Endpoints (No Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Liveness probe |
| `GET` | `/ready` | Readiness probe (DB + Redis) |

---

## Deployment

### Backend (Railway / Render / Fly.io)

1. **Push to GitHub**
2. **Connect Railway/Render** to repo
3. **Add environment variables** from `.env`
4. **Deploy** — migrations run automatically via `entrypoint.sh`

### Frontend (Vercel)

1. **Push `gateway_ui/` to GitHub**
2. **Import to Vercel**
3. **Set build command:** `npm run build`
4. **Set output directory:** `dist`
5. **Add environment variables:** `VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

### Database (Supabase PostgreSQL)

- Use Supabase\'s free PostgreSQL tier
- Update `DATABASE_URL` in backend environment
- Run migrations: `alembic upgrade head`

### Cache (Upstash Redis)

- Serverless Redis with REST API
- Update `REDIS_URL` in backend environment

---

## Environment Variables

```env
# Server
APP_HOST=0.0.0.0
APP_PORT=8000
LOG_LEVEL=INFO

# Database
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/db
DB_POOL_MIN=5
DB_POOL_MAX=20

# Redis
REDIS_URL=redis://host:6379/0

# Rate Limiting
RATE_LIMIT_BUCKET_MAX=100000
RATE_LIMIT_WINDOW_SECONDS=18000  # 5 hours

# Cache
CACHE_TTL_SECONDS=600
CACHE_MAX_TEMPERATURE=0.3

# Circuit Breaker
CIRCUIT_FAILURE_THRESHOLD=5
CIRCUIT_RESET_TTL_SECONDS=300

# Provider API Keys
GROQ_API_KEY=gsk_xxx
OPENROUTER_API_KEY=sk-or_xxx
NVIDIA_API_KEY=nvapi_xxx

# Provider Timeouts
GROQ_TIMEOUT=15.0
OPENROUTER_TIMEOUT=30.0
NVIDIA_TIMEOUT=45.0

# Supabase (Dashboard Auth)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx

# Frontend
DASHBOARD_URL=http://localhost:5173
```

---

## Screenshots

### Dashboard Overview
[Add screenshot of dashboard with stat cards and charts]

### API Key Management
[Add screenshot of keys table with create/revoke actions]

### Usage Analytics
[Add screenshot of logs table with filters and pagination]

### Model Catalog
[Add screenshot of models page with provider badges]

---

## System Design at Scale

This section covers how the architecture would evolve for production-scale traffic — **not implemented in this project**, but designed with these patterns in mind.

### Horizontal Scaling

**Current:** Single Uvicorn worker (async event loop handles concurrency)

**At Scale:**
- **Gunicorn + Uvicorn workers:** Multiple worker processes behind a load balancer
- **Kubernetes Deployment:** Horizontal Pod Autoscaler (HPA) based on CPU/memory or custom metrics (request queue depth)
- **Stateless design:** All state lives in Redis/PostgreSQL — any pod can handle any request

### Database Scaling

**Current:** Single PostgreSQL instance

**At Scale:**
- **Read replicas:** Offload `usage_logs` analytics queries to read replicas
- **Connection pooling:** PgBouncer between app and database (prevents connection exhaustion)
- **Table partitioning:** Partition `usage_logs` by `created_at` month — query only relevant partitions
- **Archival:** Move logs older than 90 days to cold storage (S3 + Athena)

### Redis Scaling

**Current:** Single Redis instance

**At Scale:**
- **Redis Cluster:** Shard data across multiple nodes for horizontal scaling
- **Separate instances:** Cache (eviction OK) vs Rate Limit (must persist) vs Circuit Breaker (transient)
- **Redis Sentinel:** High availability with automatic failover

### Provider Resilience

**Current:** In-memory failover loop with basic circuit breaker

**At Scale:**
- **Async job queues:** Celery/RQ for non-blocking provider calls — return job ID immediately, webhook on completion
- **Exponential backoff with jitter:** `2^n + random()` between retries
- **Provider health scoring:** Weighted routing based on real-time p50/p99 latency

### Caching Strategy

**Current:** Exact-match Redis cache (10min TTL)

**At Scale:**
- **Semantic caching:** Embed prompts, cache by vector similarity (FAISS/Pinecone)
- **CDN edge caching:** Cloudflare Workers cache responses geographically close to users
- **Cache warming:** Pre-populate cache for common prompts during low-traffic periods

### Observability

**Current:** PostgreSQL usage logs + JSON stdout logging

**At Scale:**
- **Metrics:** Prometheus + Grafana (request rate, latency percentiles, error rate per provider)
- **Distributed tracing:** Jaeger/Zipkin traces across all 9 pipeline stages
- **Log aggregation:** ELK stack or Loki for searchable structured logs
- **Alerting:** PagerDuty/Opsgenie on error rate > 1% or p99 latency > 2s

### Security

**Current:** API key hashing, JWT verification, basic guardrails

**At Scale:**
- **Request signing:** HMAC-SHA256 signatures on all requests
- **IP allowlisting:** Per-key IP restrictions
- **DDoS protection:** Cloudflare rate limiting + challenge pages
- **Secrets management:** HashiCorp Vault or AWS Secrets Manager for provider keys
- **Audit logging:** Immutable audit trail of all admin actions

### Cost Optimization

**Current:** Free-tier providers only

**At Scale:**
- **Dynamic model routing:** Route to cheapest provider meeting quality threshold
- **Token budgets:** Hard monthly caps per organization with automatic suspension
- **Batching:** Combine multiple requests into single provider calls
- **Embedding cache:** Aggressive caching for embedding requests (100% deterministic)

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Acknowledgments

- Built with [FastAPI](https://fastapi.tiangolo.com), [React](https://react.dev), and [Supabase](https://supabase.com)
- Provider APIs: [Groq](https://groq.com), [OpenRouter](https://openrouter.ai), [NVIDIA](https://nvidia.com)
- Design inspiration: Linear, Stripe, Vercel dashboards
'''

with open('/mnt/agents/output/README.md', 'w', encoding='utf-8') as f:
    f.write(readme_content)

print(f"README.md generated: {len(readme_content)} characters")
