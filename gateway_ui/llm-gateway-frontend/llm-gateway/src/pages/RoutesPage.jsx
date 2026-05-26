import { useState } from 'react'
import { useModels } from '../queries/adminQueries'
import { Badge } from '../components/Badge'
import { ProviderIcon } from '../components/ProviderIcon'
import { EmptyState } from '../components/EmptyState'
import { ChevronDown, Network } from 'lucide-react'

function RouteItem({ route, priority }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className="text-xs font-mono text-text-secondary w-16 shrink-0">
        Priority {priority}
      </span>
      <ProviderIcon provider={route.provider} size={20} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary capitalize">{route.provider}</p>
        <p className="text-xs font-mono text-text-secondary mt-0.5 truncate">{route.provider_model_id}</p>
      </div>
      <Badge variant={route.is_active ? 'active' : 'inactive'} dot>
        {route.is_active ? 'Active' : 'Inactive'}
      </Badge>
    </div>
  )
}

function ModelAccordionItem({ model }) {
  const [open, setOpen] = useState(false)
  const routes = model.routes ?? []

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-bg-card">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-bg-main transition-colors text-left"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-bold text-text-primary font-mono">{model.internal_name}</span>
          <div className="flex gap-2">
            {model.context_window && (
              <Badge variant="primary">
                {model.context_window >= 1000
                  ? `${Math.round(model.context_window / 1000)}k`
                  : model.context_window} ctx
              </Badge>
            )}
            {model.weight_multiplier != null && (
              <Badge variant="default">{model.weight_multiplier}x weight</Badge>
            )}
            <Badge variant="default">{routes.length} route{routes.length !== 1 ? 's' : ''}</Badge>
          </div>
        </div>
        <ChevronDown
          size={16}
          className={`text-text-secondary shrink-0 ml-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="px-5 pb-4 border-t border-border">
          {routes.length === 0 ? (
            <p className="text-sm text-text-secondary py-4 text-center">No routes configured.</p>
          ) : (
            <div className="divide-y divide-border">
              {routes
                .slice()
                .sort((a, b) => a.priority - b.priority)
                .map((route, i) => (
                  <RouteItem key={i} route={route} priority={route.priority ?? i + 1} />
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function RoutesPage() {
  const { data, isLoading, isError } = useModels()
  const models = data?.models ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-text-primary">Routing & Models</h2>
        <p className="text-sm text-text-secondary mt-0.5">
          Internal model routing configuration and provider priorities. Read-only.
        </p>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-4">
                <div className="shimmer h-5 w-48 rounded mb-2" />
                <div className="shimmer h-4 w-32 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="bg-bg-card border border-border rounded-xl p-8 text-center text-sm text-danger">
          Failed to load routing configuration. Please refresh.
        </div>
      ) : models.length === 0 ? (
        <div className="bg-bg-card border border-border rounded-xl">
          <EmptyState
            icon={Network}
            title="No models configured"
            description="No internal model routing has been configured yet."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {models.map(model => (
            <ModelAccordionItem key={model.internal_name} model={model} />
          ))}
        </div>
      )}
    </div>
  )
}
