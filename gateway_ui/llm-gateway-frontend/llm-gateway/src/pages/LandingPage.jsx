import { useAuth } from '../hooks/useAuth'
import { CodeBlock } from '../components/CodeBlock'

const QUICKSTART_CODE = `import httpx

response = httpx.post(
    "https://api.llmgateway.com/v1/chat/completions",
    headers={"Authorization": "Bearer YOUR_API_KEY"},
    json={
        "model": "llama-3.3-70b",
        "messages": [{"role": "user", "content": "Hello, world!"}]
    }
)
print(response.json())`

export default function LandingPage() {
  const { signInWithGoogle } = useAuth()

  const handleSignIn = async () => {
    try {
      await signInWithGoogle()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="bg-bg-main">
      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 pt-24 pb-20">
        <div className="max-w-[800px] mx-auto">
          <h1 className="text-6xl font-bold text-text-primary tracking-tight leading-tight">
            LLM Gateway
          </h1>
          <p className="mt-4 text-2xl font-medium text-text-secondary">
            Production infrastructure for AI apps
          </p>
          <p className="mt-5 text-base text-text-secondary max-w-xl mx-auto leading-relaxed">
            Unified API layer for Large Language Models. Route requests intelligently
            across multiple providers with built-in fallback, rate limiting, and
            observability. Deploy AI infrastructure that scales with your application.
          </p>
          <div className="mt-8">
            <button
              onClick={handleSignIn}
              className="inline-flex items-center gap-3 bg-accent-primary hover:bg-accent-primary-hover text-white font-medium px-6 py-3 rounded-md transition-colors text-sm shadow-sm"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path fill="#fff" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18Z"/>
                <path fill="#fff" fillOpacity=".85" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.04c-.72.48-1.63.77-2.7.77-2.1 0-3.87-1.42-4.5-3.34H1.8v2.07A8 8 0 0 0 8.98 17Z"/>
                <path fill="#fff" fillOpacity=".7" d="M4.48 10.45A4.8 4.8 0 0 1 4.23 9c0-.5.1-1 .25-1.45V5.48H1.8A8 8 0 0 0 .98 9c0 1.29.31 2.5.82 3.52l2.68-2.07Z"/>
                <path fill="#fff" fillOpacity=".55" d="M8.98 4.21c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 8.98 1a8 8 0 0 0-7.18 4.48l2.67 2.07c.64-1.92 2.4-3.34 4.51-3.34Z"/>
              </svg>
              Sign in with Google
            </button>
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="px-6 pb-24">
        <div className="max-w-[720px] mx-auto">
          <h2 className="text-xl font-semibold text-text-primary">Quick Start</h2>
          <p className="mt-1 text-sm text-text-secondary">Send your first request in seconds.</p>
          <div className="mt-4">
            <CodeBlock code={QUICKSTART_CODE} language="python" />
          </div>
          <p className="mt-3 text-sm text-text-secondary">
            Grab your API key from the dashboard after signing in.
          </p>
        </div>
      </section>
    </div>
  )
}
