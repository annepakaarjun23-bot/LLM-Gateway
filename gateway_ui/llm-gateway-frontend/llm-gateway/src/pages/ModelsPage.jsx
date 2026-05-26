import { Badge } from '../components/Badge'
import { ProviderIcon } from '../components/ProviderIcon'

const MODELS = [
  {
    name: 'LLaMA 3.3 70B',
    id: 'llama-3.3-70b',
    provider: 'groq',
    context: '128k',
    type: 'Chat',
  },
  {
    name: 'LLaMA 3.1 8B',
    id: 'llama-3.1-8b',
    provider: 'groq',
    context: '128k',
    type: 'Chat',
  },
  {
    name: 'GPT-4o',
    id: 'gpt-4o',
    provider: 'openai',
    context: '128k',
    type: 'Chat',
  },
  {
    name: 'Claude 3.5 Sonnet',
    id: 'claude-3-5-sonnet',
    provider: 'anthropic',
    context: '200k',
    type: 'Chat',
  },
  {
    name: 'Mixtral 8x22B',
    id: 'mixtral-8x22b',
    provider: 'openrouter',
    context: '64k',
    type: 'Chat',
  },
]

function ModelCard({ model }) {
  return (
    <div className="bg-bg-card border border-border rounded-xl p-6 hover:border-[#c9bfad] transition-colors">
      <div className="flex items-start justify-between mb-3">
        <ProviderIcon provider={model.provider} size={28} />
        <Badge variant="success" dot>Available</Badge>
      </div>
      <h3 className="text-base font-bold text-text-primary mt-2">{model.name}</h3>
      <p className="text-xs font-mono text-text-secondary mt-0.5">{model.id}</p>
      <div className="flex flex-wrap gap-2 mt-4">
        <Badge variant="primary">{model.context} ctx</Badge>
        <Badge variant="default">{model.type}</Badge>
        <Badge variant="default" className="capitalize">{model.provider}</Badge>
      </div>
    </div>
  )
}

export default function ModelsPage() {
  return (
    <div className="bg-bg-main min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-text-primary">Available Models</h1>
          <p className="mt-2 text-base text-text-secondary">
            Production-ready models routed through multiple providers for maximum reliability.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {MODELS.map(model => (
            <ModelCard key={model.id} model={model} />
          ))}
        </div>
      </div>
    </div>
  )
}
