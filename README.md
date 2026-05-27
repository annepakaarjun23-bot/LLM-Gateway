
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


print(f"README.md generated: {len(readme_content)} characters")
