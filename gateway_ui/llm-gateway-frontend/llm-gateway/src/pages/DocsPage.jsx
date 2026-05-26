import { useState, useEffect } from 'react'

const SECTIONS = [
  { id: 'introduction', label: 'Introduction' },
  { id: 'quickstart', label: 'Quick Start' },
  { id: 'authentication', label: 'Authentication' },
  { id: 'models', label: 'Supported Models' },
  { id: 'guardrails', label: 'Input Guardrails' },
  { id: 'rate-limiting', label: 'Rate Limiting' },
  { id: 'caching', label: 'Exact-Match Caching' },
  { id: 'fallback', label: 'Multi-Provider Fallback' },
  { id: 'observability', label: 'Observability & Tracing' },
  { id: 'api-reference', label: 'API Reference' },
  { id: 'errors', label: 'Error Handling' },
]

function WorkflowDiagram({ steps }) {
  return (
    <div className="flex flex-wrap items-center gap-2 my-4 p-4 bg-[#fffaf5] border border-[#d8cdbd] rounded-lg">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-xs font-medium text-[#6f6a63] bg-[#f6efe7] border border-[#d8cdbd] px-2.5 py-1 rounded-md whitespace-nowrap">
            {step}
          </span>
          {i < steps.length - 1 && (
            <span className="text-[#6f6a63] text-sm">→</span>
          )}
        </div>
      ))}
    </div>
  )
}

function CodeBlock({ language, code }) {
  return (
    <div className="my-4 bg-[#2b2b2b] rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-[#1f1f1f] border-b border-[#3a3a3a]">
        <span className="text-xs font-mono text-[#9ca3af]">{language}</span>
        <button 
          onClick={() => navigator.clipboard.writeText(code)}
          className="text-xs text-[#9ca3af] hover:text-[#f9fafb] transition-colors"
        >
          Copy
        </button>
      </div>
      <pre className="p-4 overflow-x-auto">
        <code className="text-sm font-mono text-[#f9fafb] leading-relaxed">
          {code}
        </code>
      </pre>
    </div>
  )
}

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('introduction')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActiveSection(entry.target.id)
        })
      },
      { rootMargin: '-20% 0px -70% 0px' }
    )
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const pythonCode = `import httpx

API_KEY = "gwy_your_api_key_here"
BASE_URL = "http://localhost:8000"

client = httpx.Client(base_url=BASE_URL, timeout=60)

response = client.post(
    "/v1/chat/completions",
    headers={"Authorization": f"Bearer {API_KEY}"},
    json={
        "model": "gpt-4o-mini",
        "messages": [{"role": "user", "content": "what is quantum entanglement"}],
        "temperature": 0.3
    }
)

print(response.json())`

  const jsCode = `const axios = require('axios');

const API_KEY = 'gwy_your_api_key_here';
const BASE_URL = 'http://localhost:8000';

async function chat() {
  const response = await axios.post(
    \`\${BASE_URL}/v1/chat/completions\`,
    {
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'what is quantum entanglement' }],
      temperature: 0.3
    },
    {
      headers: { Authorization: \`Bearer \${API_KEY}\` },
      timeout: 60000
    }
  );

  console.log(response.data);
}

chat();`

  return (
    <div className="bg-[#f6efe7] min-h-screen">
      <div className="max-w-[1100px] mx-auto px-6 py-12 flex gap-12">
        {/* Sticky TOC sidebar */}
        <aside className="hidden lg:block w-52 shrink-0">
          <div className="sticky top-24">
            <p className="text-xs font-semibold text-[#6f6a63] uppercase tracking-wider mb-3">
              On this page
            </p>
            <nav className="space-y-0.5">
              {SECTIONS.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className={`block w-full text-left text-sm px-2 py-1.5 rounded transition-colors ${
                    activeSection === id
                      ? 'text-[#c96a3d] font-medium bg-[#c96a3d]/5'
                      : 'text-[#6f6a63] hover:text-[#2b2b2b]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <article className="flex-1 min-w-0 max-w-[640px] space-y-12">

          {/* ─── INTRODUCTION ─── */}
          <section id="introduction">
            <h1 className="text-3xl font-bold text-[#2b2b2b] mb-6">Documentation</h1>
            <h2 className="text-xl font-semibold text-[#2b2b2b] mb-3">Introduction</h2>
            <h3 className="text-base font-semibold text-[#2b2b2b] mb-2">What is LLM Gateway?</h3>
            <p className="text-sm text-[#6f6a63] leading-relaxed mb-4">
              LLM Gateway is a production-grade reverse proxy for LLM APIs. It exposes a single 
              OpenAI-compatible endpoint while routing requests across multiple free-tier providers 
              — Groq, OpenRouter, and NVIDIA. The gateway handles authentication, rate limiting, 
              input guardrails, exact-match caching, automatic failover, and full observability 
              without requiring streaming support.
            </p>
            <h3 className="text-base font-semibold text-[#2b2b2b] mb-2">Who is it for?</h3>
            <p className="text-sm text-[#6f6a63] leading-relaxed mb-4">
              Developers and engineering teams who want a unified, reliable interface to multiple 
              LLM providers with built-in cost control, security guardrails, and usage analytics. 
              Ideal for prototyping, resume projects, and production AI applications that need 
              provider redundancy.
            </p>
            <h3 className="text-base font-semibold text-[#2b2b2b] mb-2">Architecture Overview</h3>
            <p className="text-sm text-[#6f6a63] leading-relaxed">
              Every request flows through a 9-stage middleware pipeline: Authentication → Token 
              Estimation → Rate Limiting → Input Guardrails → Cache Lookup → Static Model Router → 
              Provider Call + Failover → Cache Store → Observability Logging. All stages are 
              async, non-blocking, and fully instrumented.
            </p>
          </section>

          {/* ─── QUICK START ─── */}
          <section id="quickstart">
            <h2 className="text-xl font-semibold text-[#2b2b2b] mb-4">Quick Start</h2>
            <p className="text-sm text-[#6f6a63] leading-relaxed mb-4">
              Get up and running in under 2 minutes. Sign in with Google, create an API key from 
              the dashboard, and send your first request.
            </p>

            <h3 className="text-sm font-semibold text-[#2b2b2b] mb-2">Python</h3>
            <CodeBlock language="python" code={pythonCode} />

            <h3 className="text-sm font-semibold text-[#2b2b2b] mb-2 mt-6">JavaScript / Node.js</h3>
            <CodeBlock language="javascript" code={jsCode} />

            <div className="mt-4 p-4 bg-[#657153]/10 border border-[#657153]/20 rounded-lg">
              <p className="text-sm text-[#2b2b2b]">
                <span className="font-semibold">Tip:</span> Replace <code className="font-mono text-xs bg-[#fffaf5] border border-[#d8cdbd] px-1.5 py-0.5 rounded">gwy_your_api_key_here</code> with 
                your actual key from the dashboard. The gateway accepts any supported model name — 
                routing and provider selection is handled automatically.
              </p>
            </div>
          </section>

          {/* ─── AUTHENTICATION ─── */}
          <section id="authentication">
            <h2 className="text-xl font-semibold text-[#2b2b2b] mb-3">Authentication</h2>

            <h3 className="text-sm font-semibold text-[#2b2b2b] mb-2">Dashboard Access (Supabase JWT)</h3>
            <p className="text-sm text-[#6f6a63] leading-relaxed mb-4">
              The React dashboard uses Supabase Google OAuth 2.0. On successful login, Supabase 
              issues a JWT containing the user's UUID (<code className="font-mono text-xs bg-[#fffaf5] border border-[#d8cdbd] px-1.5 py-0.5 rounded">sub</code>) and email. 
              This JWT is sent as <code className="font-mono text-xs bg-[#fffaf5] border border-[#d8cdbd] px-1.5 py-0.5 rounded">Authorization: Bearer &lt;jwt&gt;</code> on 
              all <code className="font-mono text-xs bg-[#fffaf5] border border-[#d8cdbd] px-1.5 py-0.5 rounded">/admin/*</code> endpoints. The backend verifies the JWT 
              against Supabase's JWKS, caches the keys for 1 hour, and lazily creates the user 
              in PostgreSQL on first access.
            </p>

            <h3 className="text-sm font-semibold text-[#2b2b2b] mb-2">API Requests (Gateway API Key)</h3>
            <p className="text-sm text-[#6f6a63] leading-relaxed mb-2">
              Client applications use gateway-managed API keys prefixed with <code className="font-mono text-xs bg-[#fffaf5] border border-[#d8cdbd] px-1.5 py-0.5 rounded">gwy_</code>. 
              The key is hashed with SHA-256 and looked up in the <code className="font-mono text-xs bg-[#fffaf5] border border-[#d8cdbd] px-1.5 py-0.5 rounded">api_keys</code> table. 
              All rate limiting, observability, and guardrails use the associated <code className="font-mono text-xs bg-[#fffaf5] border border-[#d8cdbd] px-1.5 py-0.5 rounded">user_id</code>, 
              not the key itself — so multiple keys share one quota.
            </p>
            <WorkflowDiagram steps={['Client', 'Bearer gwy_...', 'SHA-256 Hash', 'DB Lookup', 'Pipeline']} />
          </section>

          {/* ─── SUPPORTED MODELS ─── */}
          <section id="models">
            <h2 className="text-xl font-semibold text-[#2b2b2b] mb-3">Supported Models</h2>
            <p className="text-sm text-[#6f6a63] leading-relaxed mb-4">
              Models are referenced by internal name. The gateway resolves each to provider-specific 
              IDs and routes according to priority order. Weights affect rate limit token consumption.
            </p>

            <div className="space-y-3">
              {[
                ['gpt-4o-mini', 'OpenRouter', '128K', '1.0x', 'Fast, cheap, high-context'],
                ['gpt-4o', 'OpenRouter', '128K', '4.0x', 'Capable multimodal model'],
                ['claude-3.5-sonnet', 'OpenRouter', '200K', '3.0x', 'Strong reasoning, long context'],
                ['kimi-k2-6', 'OpenRouter', '256K', '4.0x', 'Moonshot AI, massive context'],
                ['llama-3.3-70b', 'Groq → OpenRouter', '128K', '4.0x', 'Meta Llama, fast inference'],
                ['mixtral-8x7b', 'Groq → OpenRouter', '32K', '2.0x', 'Mistral MoE, balanced'],
                ['mistral-large-3', 'NVIDIA', '256K', '8.0x', '675B parameters, most powerful'],
              ].map(([name, provider, ctx, weight, desc]) => (
                <div key={name} className="flex items-center gap-3 p-3 bg-[#fffaf5] border border-[#d8cdbd] rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono font-semibold text-[#2b2b2b]">{name}</p>
                    <p className="text-xs text-[#6f6a63]">{desc}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-mono text-[#657153] bg-[#657153]/10 px-2 py-0.5 rounded">{ctx}</span>
                    <span className="text-xs font-mono text-[#c96a3d] bg-[#c96a3d]/10 px-2 py-0.5 rounded">{weight}</span>
                  </div>
                  <span className="text-xs text-[#6f6a63] shrink-0">{provider}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ─── INPUT GUARDRAILS (UPDATED) ─── */}
          <section id="guardrails">
            <h2 className="text-xl font-semibold text-[#2b2b2b] mb-3">Input Guardrails</h2>
            <p className="text-sm text-[#6f6a63] leading-relaxed mb-2">
              Three-layer defense system that inspects every request <strong>before</strong> spending 
              provider tokens. If any layer blocks, the request returns 400 immediately — no provider 
              is called, no quota is consumed.
            </p>

            <div className="space-y-4 mt-4">
              <div className="p-4 bg-[#fffaf5] border border-[#d8cdbd] rounded-lg">
                <h4 className="text-sm font-semibold text-[#2b2b2b] mb-1">Layer 1 — Schema & Sanity</h4>
                <p className="text-sm text-[#6f6a63] leading-relaxed">
                  Validates OpenAI-compatible schema: messages array exists, each item has role + content, 
                  temperature ∈ [0.0, 2.0], max_tokens ≤ 8192, payload ≤ 1MB, ≤ 50 messages.
                </p>
              </div>
              <div className="p-4 bg-[#fffaf5] border border-[#d8cdbd] rounded-lg">
                <h4 className="text-sm font-semibold text-[#2b2b2b] mb-1">Layer 2 — AI Judge (Threshold‑Based)</h4>
                <p className="text-sm text-[#6f6a63] leading-relaxed">
                  Instead of brittle regex rules, we use a separate <strong>LLM‑as‑Judge</strong> that 
                  evaluates the entire conversation for prompt injection attempts. The judge model 
                  (e.g., gpt‑4o‑mini) receives the message history and returns an <strong>injection 
                  risk score</strong> between 0.0 and 1.0. If the score exceeds a configurable 
                  threshold (default 0.85), the request is blocked. This approach catches semantic 
                  attacks, role‑play jailbreaks, and obfuscated instructions that static patterns 
                  miss. The judge is completely isolated from the primary model, so an attacker 
                  cannot influence both.
                </p>
              </div>
              <div className="p-4 bg-[#fffaf5] border border-[#d8cdbd] rounded-lg">
                <h4 className="text-sm font-semibold text-[#2b2b2b] mb-1">Layer 3 — Content Size Guard</h4>
                <p className="text-sm text-[#6f6a63] leading-relaxed">
                  Any single message content &gt; 50,000 characters is blocked as potential prompt stuffing.
                </p>
              </div>
            </div>

            <WorkflowDiagram steps={['Request', 'Schema Check', 'AI Judge (Threshold)', 'Size Guard', 'Provider']} />
          </section>

          {/* ─── RATE LIMITING ─── */}
          <section id="rate-limiting">
            <h2 className="text-xl font-semibold text-[#2b2b2b] mb-3">Rate Limiting</h2>
            <p className="text-sm text-[#6f6a63] leading-relaxed mb-2">
              User-level token bucket with 5-hour reset windows, inspired by Claude's rate limit 
              model. All API keys belonging to the same user share one bucket. Large models consume 
              more tokens from the bucket.
            </p>

            <div className="space-y-3 mt-4">
              <div className="p-4 bg-[#fffaf5] border border-[#d8cdbd] rounded-lg">
                <h4 className="text-sm font-semibold text-[#2b2b2b] mb-1">Bucket Mechanics</h4>
                <p className="text-sm text-[#6f6a63] leading-relaxed">
                  Each user gets 100,000 tokens per 5-hour window. On first request, Redis initializes 
                  <code className="font-mono text-xs bg-[#f6efe7] border border-[#d8cdbd] px-1.5 py-0.5 rounded">ratelimit_window:&lt;user_id&gt;</code> and 
                  <code className="font-mono text-xs bg-[#f6efe7] border border-[#d8cdbd] px-1.5 py-0.5 rounded">ratelimit:&lt;user_id&gt;</code> with TTL = 18,000s. 
                  Subsequent requests atomically decrement via <code className="font-mono text-xs bg-[#f6efe7] border border-[#d8cdbd] px-1.5 py-0.5 rounded">DECRBY</code>.
                </p>
              </div>
              <div className="p-4 bg-[#fffaf5] border border-[#d8cdbd] rounded-lg">
                <h4 className="text-sm font-semibold text-[#2b2b2b] mb-1">Token-Weighted Multipliers</h4>
                <p className="text-sm text-[#6f6a63] leading-relaxed">
                  Small models (≤8B): 1.0×. Medium (≤70B): 2.0–4.0×. Large (&gt;70B): 4.0–8.0×. 
                  A 1,000-token request to Mistral Large 3 (8.0×) deducts 8,000 from the bucket.
                </p>
              </div>
            </div>

            <WorkflowDiagram steps={['Request', 'Estimate Tokens', 'Apply Weight', 'DECRBY Redis', 'Allowed / 429']} />
          </section>

          {/* ─── CACHING ─── */}
          <section id="caching">
            <h2 className="text-xl font-semibold text-[#2b2b2b] mb-3">Exact-Match Caching</h2>
            <p className="text-sm text-[#6f6a63] leading-relaxed mb-2">
              Deterministic exact-match cache using SHA-256 of normalized request payload. Skips 
              provider calls entirely on cache hit — zero latency, zero cost.
            </p>

            <div className="p-4 bg-[#fffaf5] border border-[#d8cdbd] rounded-lg mt-4">
              <h4 className="text-sm font-semibold text-[#2b2b2b] mb-1">Cache Key Generation</h4>
              <p className="text-sm text-[#6f6a63] leading-relaxed">
                Canonical JSON = <code className="font-mono text-xs bg-[#f6efe7] border border-[#d8cdbd] px-1.5 py-0.5 rounded">json.dumps(&#123;&#123;"model": ..., "messages": ..., "temperature": ...&#125;&#125;, sort_keys=True, separators=(",", ":"))</code>.
                Hash = <code className="font-mono text-xs bg-[#f6efe7] border border-[#d8cdbd] px-1.5 py-0.5 rounded">sha256(canonical).hexdigest()</code>.
                Redis key = <code className="font-mono text-xs bg-[#f6efe7] border border-[#d8cdbd] px-1.5 py-0.5 rounded">llm_cache:&lt;hash&gt;</code>, TTL = 10 minutes.
              </p>
            </div>

            <p className="text-sm text-[#6f6a63] leading-relaxed mt-4">
              <strong>Skip conditions:</strong> temperature &gt; 0.3, tools/functions present, streaming enabled. 
              These requests are too variable or complex to cache safely.
            </p>

            <WorkflowDiagram steps={['Request', 'Normalize', 'SHA-256', 'Redis GET', 'Hit → Return / Miss → Provider']} />
          </section>

          {/* ─── MULTI-PROVIDER FALLBACK ─── */}
          <section id="fallback">
            <h2 className="text-xl font-semibold text-[#2b2b2b] mb-3">Multi-Provider Fallback</h2>
            <p className="text-sm text-[#6f6a63] leading-relaxed mb-2">
              Static model routing with per-provider circuit breakers. Each internal model maps to an 
              ordered list of provider routes (priority 1 = primary, 2 = fallback). If the primary 
              fails with 429, 5xx, or timeout, the gateway automatically retries with the next route.
            </p>

            <div className="space-y-3 mt-4">
              <div className="p-4 bg-[#fffaf5] border border-[#d8cdbd] rounded-lg">
                <h4 className="text-sm font-semibold text-[#2b2b2b] mb-1">Circuit Breaker</h4>
                <p className="text-sm text-[#6f6a63] leading-relaxed">
                  Per-provider failure tracking in Redis. After 5 consecutive failures within 5 minutes, 
                  the circuit opens and the provider is skipped for 5 minutes. A successful request 
                  immediately closes the circuit.
                </p>
              </div>
              <div className="p-4 bg-[#fffaf5] border border-[#d8cdbd] rounded-lg">
                <h4 className="text-sm font-semibold text-[#2b2b2b] mb-1">Provider Isolation</h4>
                <p className="text-sm text-[#6f6a63] leading-relaxed">
                  Each provider holds its own <code className="font-mono text-xs bg-[#f6efe7] border border-[#d8cdbd] px-1.5 py-0.5 rounded">httpx.AsyncClient</code> with isolated connection pools. 
                  Groq: 15s timeout, 20 connections. OpenRouter: 30s, 20 connections. NVIDIA: 45s, 10 connections. 
                  A slow NVIDIA request cannot starve Groq's pool.
                </p>
              </div>
            </div>

            <WorkflowDiagram steps={['Request', 'Route Priority 1', 'Circuit Open?', 'Call Provider', 'Fail → Priority 2', 'Success → Response']} />
          </section>

          {/* ─── OBSERVABILITY ─── */}
          <section id="observability">
            <h2 className="text-xl font-semibold text-[#2b2b2b] mb-3">Observability & Tracing</h2>
            <p className="text-sm text-[#6f6a63] leading-relaxed mb-2">
              Every request is logged to PostgreSQL in the <code className="font-mono text-xs bg-[#fffaf5] border border-[#d8cdbd] px-1.5 py-0.5 rounded">usage_logs</code> table via a 
              <code className="font-mono text-xs bg-[#fffaf5] border border-[#d8cdbd] px-1.5 py-0.5 rounded">finally</code> block — guaranteeing capture even if the request 
              is blocked by guardrails or rate limits.
            </p>

            <div className="grid grid-cols-2 gap-3 mt-4">
              {[
                ['gateway_latency_ms', 'Total time in gateway'],
                ['provider_latency_ms', 'Time waiting for provider'],
                ['input_tokens', 'Prompt tokens counted by tiktoken'],
                ['output_tokens', 'Completion tokens from provider'],
                ['cache_hit', 'Boolean — served from cache?'],
                ['guardrail_blocked', 'Boolean — blocked at Stage 4?'],
                ['provider', 'Which provider served the request'],
                ['status_code', 'Final HTTP status returned to client'],
              ].map(([field, desc]) => (
                <div key={field} className="p-3 bg-[#fffaf5] border border-[#d8cdbd] rounded-lg">
                  <p className="text-xs font-mono font-semibold text-[#2b2b2b]">{field}</p>
                  <p className="text-xs text-[#6f6a63]">{desc}</p>
                </div>
              ))}
            </div>

            <p className="text-sm text-[#6f6a63] leading-relaxed mt-4">
              Structured JSON logging with <code className="font-mono text-xs bg-[#fffaf5] border border-[#d8cdbd] px-1.5 py-0.5 rounded">X-Request-ID</code> propagation across all 
              middleware stages. Request IDs are injected at the edge and returned in response headers 
              for end-to-end traceability.
            </p>
          </section>

          {/* ─── API REFERENCE ─── */}
          <section id="api-reference">
            <h2 className="text-xl font-semibold text-[#2b2b2b] mb-3">API Reference</h2>

            <div className="space-y-4">
              <div className="p-4 bg-[#fffaf5] border border-[#d8cdbd] rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono font-semibold text-[#657153] bg-[#657153]/10 px-2 py-0.5 rounded">POST</span>
                  <span className="text-sm font-mono text-[#2b2b2b]">/v1/chat/completions</span>
                </div>
                <p className="text-sm text-[#6f6a63] mb-2">Main LLM endpoint. Full 9-stage pipeline.</p>
                <p className="text-xs text-[#6f6a63]">Auth: <code className="font-mono">Bearer gwy_xxx</code></p>
              </div>

              <div className="p-4 bg-[#fffaf5] border border-[#d8cdbd] rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono font-semibold text-[#657153] bg-[#657153]/10 px-2 py-0.5 rounded">GET</span>
                  <span className="text-sm font-mono text-[#2b2b2b]">/v1/models</span>
                </div>
                <p className="text-sm text-[#6f6a63] mb-2">List available internal models.</p>
                <p className="text-xs text-[#6f6a63]">Auth: <code className="font-mono">Bearer gwy_xxx</code></p>
              </div>

              <div className="p-4 bg-[#fffaf5] border border-[#d8cdbd] rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono font-semibold text-[#c96a3d] bg-[#c96a3d]/10 px-2 py-0.5 rounded">POST</span>
                  <span className="text-sm font-mono text-[#2b2b2b]">/admin/keys</span>
                </div>
                <p className="text-sm text-[#6f6a63] mb-2">Generate new API key.</p>
                <p className="text-xs text-[#6f6a63]">Auth: <code className="font-mono">Bearer &lt;supabase_jwt&gt;</code></p>
              </div>

              <div className="p-4 bg-[#fffaf5] border border-[#d8cdbd] rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono font-semibold text-[#657153] bg-[#657153]/10 px-2 py-0.5 rounded">GET</span>
                  <span className="text-sm font-mono text-[#2b2b2b]">/admin/usage</span>
                </div>
                <p className="text-sm text-[#6f6a63] mb-2">Usage analytics with pagination and aggregates.</p>
                <p className="text-xs text-[#6f6a63]">Auth: <code className="font-mono">Bearer &lt;supabase_jwt&gt;</code></p>
              </div>

              <div className="p-4 bg-[#fffaf5] border border-[#d8cdbd] rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono font-semibold text-[#657153] bg-[#657153]/10 px-2 py-0.5 rounded">GET</span>
                  <span className="text-sm font-mono text-[#2b2b2b]">/admin/quota</span>
                </div>
                <p className="text-sm text-[#6f6a63] mb-2">Current rate limit bucket status.</p>
                <p className="text-xs text-[#6f6a63]">Auth: <code className="font-mono">Bearer &lt;supabase_jwt&gt;</code></p>
              </div>
            </div>
          </section>

          {/* ─── ERROR HANDLING ─── */}
          <section id="errors">
            <h2 className="text-xl font-semibold text-[#2b2b2b] mb-3">Error Handling</h2>
            <p className="text-sm text-[#6f6a63] leading-relaxed mb-4">
              All errors return structured JSON with <code className="font-mono text-xs bg-[#fffaf5] border border-[#d8cdbd] px-1.5 py-0.5 rounded">error.type</code> and 
              <code className="font-mono text-xs bg-[#fffaf5] border border-[#d8cdbd] px-1.5 py-0.5 rounded">error.message</code>. 
              Retry strategies depend on the error type.
            </p>

            <div className="space-y-2">
              {[
                ['401', 'authentication_error', 'Invalid or deactivated API key. Do not retry.'],
                ['400', 'guardrail_blocked', 'Request failed input validation. Fix payload and retry.'],
                ['400', 'context_exceeded', 'Estimated tokens exceed model context window. Reduce prompt.'],
                ['429', 'rate_limit_exceeded', 'Quota exhausted. Retry after retry_after_seconds.'],
                ['429', 'provider_rate_limited', 'Upstream provider throttled. Gateway will auto-fallback.'],
                ['503', 'provider_unavailable', 'All providers failed. Retry with exponential backoff.'],
                ['500', 'internal_error', 'Unexpected gateway error. Retry once, then escalate.'],
              ].map(([code, type_, strategy]) => (
                <div key={type_} className="flex items-start gap-3 p-3 bg-[#fffaf5] border border-[#d8cdbd] rounded-lg">
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded shrink-0 ${
                    code === '200' || code === '201' ? 'bg-[#657153]/10 text-[#657153]' :
                    code === '400' ? 'bg-[#b8860b]/10 text-[#b8860b]' :
                    code === '429' ? 'bg-[#c96a3d]/10 text-[#c96a3d]' :
                    'bg-[#a94442]/10 text-[#a94442]'
                  }`}>
                    {code}
                  </span>
                  <div>
                    <p className="text-sm font-mono text-[#2b2b2b]">{type_}</p>
                    <p className="text-xs text-[#6f6a63]">{strategy}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </article>
      </div>
    </div>
  )
}