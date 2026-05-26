import { useState, useMemo } from 'react'
import { useUsage } from '../queries/adminQueries'
import { StatCard } from '../components/StatCard'
import { Badge } from '../components/Badge'
import { EmptyState } from '../components/EmptyState'
import { format, subDays } from 'date-fns'
import { BarChart2, ChevronLeft, ChevronRight, Clock, Filter } from 'lucide-react'

const DATE_PRESETS = [
  { label: 'Last 7d', days: 7 },
  { label: 'Last 30d', days: 30 },
  { label: 'Last 90d', days: 90 },
]

function StatusBadge({ code }) {
  if (!code) return <span className="text-text-secondary text-xs">—</span>
  const variant = code >= 500 ? 'danger' : code >= 400 ? 'warning' : 'success'
  return <Badge variant={variant}>{code}</Badge>
}

function BoolBadge({ value }) {
  if (value === null || value === undefined) return <span className="text-xs text-text-secondary">—</span>
  return value
    ? <Badge variant="success">Yes</Badge>
    : <Badge variant="default">No</Badge>
}

function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-3 py-4 border-t border-border">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        className="flex items-center gap-1 text-xs font-medium text-text-secondary hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors px-2 py-1"
      >
        <ChevronLeft size={14} />
        Previous
      </button>
      <span className="text-xs text-text-secondary">
        Page <span className="font-medium text-text-primary">{page}</span> of{' '}
        <span className="font-medium text-text-primary">{totalPages}</span>
      </span>
      <button
        onClick={() => onPage(page + 1)}
        disabled={page >= totalPages}
        className="flex items-center gap-1 text-xs font-medium text-text-secondary hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors px-2 py-1"
      >
        Next
        <ChevronRight size={14} />
      </button>
    </div>
  )
}

export default function UsagePage() {
  const [activeDays, setActiveDays] = useState(30)
  const [model, setModel] = useState('')
  const [page, setPage] = useState(1)

  const from = format(subDays(new Date(), activeDays), 'yyyy-MM-dd')
  const to = format(new Date(), 'yyyy-MM-dd')

  const { data, isLoading, isError } = useUsage({ from, to, model: model || undefined, page, perPage: 20 })

  const summary = data?.summary
  const logs = data?.logs ?? []
  const pagination = data?.pagination

  // Collect model list from logs for filter dropdown
  const modelOptions = useMemo(() => {
    if (!logs.length) return []
    return [...new Set(logs.map(l => l.model || l.internal_model).filter(Boolean))]
  }, [logs])

  const handlePreset = (days) => {
    setActiveDays(days)
    setPage(1)
  }

  const handleModelChange = (e) => {
    setModel(e.target.value)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="sticky top-0 z-10 bg-bg-card border border-border rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1">
            <Filter size={14} className="text-text-secondary" />
            <span className="text-xs font-medium text-text-secondary">Filters:</span>
          </div>

          {/* Date presets */}
          <div className="flex gap-1">
            {DATE_PRESETS.map(({ label, days }) => (
              <button
                key={days}
                onClick={() => handlePreset(days)}
                className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                  activeDays === days
                    ? 'bg-accent-primary text-white'
                    : 'text-text-secondary border border-border hover:bg-bg-main'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Model filter */}
          <select
            value={model}
            onChange={handleModelChange}
            className="text-xs px-3 py-1.5 rounded-md border border-border bg-bg-main text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30 focus:border-accent-primary"
            aria-label="Filter by model"
          >
            <option value="">All Models</option>
            {modelOptions.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Input Tokens"
          value={summary ? summary.total_input_tokens.toLocaleString() : null}
          loading={isLoading}
          subtext="last period"
        />
        <StatCard
          title="Total Output Tokens"
          value={summary ? summary.total_output_tokens.toLocaleString() : null}
          loading={isLoading}
          subtext="last period"
        />
        <StatCard
          title="Avg Latency"
          value={summary ? `${summary.avg_latency_ms.toFixed(0)} ms` : null}
          loading={isLoading}
          icon={Clock}
          subtext="per request"
        />
        <StatCard
          title="Blocked Requests"
          value={summary ? String(summary.blocked_requests) : null}
          loading={isLoading}
          subtext="guardrail blocks"
        />
      </div>

      {/* Logs Table */}
      <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">Request Logs</h2>
          {pagination && (
            <span className="text-xs text-text-secondary">
              {pagination.total_items.toLocaleString()} total
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="p-6 space-y-2">
            {[1,2,3,4,5].map(i => <div key={i} className="shimmer h-10 rounded" />)}
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-sm text-danger">
            Failed to load usage logs. Please refresh.
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            icon={BarChart2}
            title="No logs found"
            description="No requests matched the selected filters."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" role="table">
                <thead>
                  <tr className="border-b border-border bg-bg-main">
                    {['Timestamp', 'Model', 'Provider', 'Status', 'In Tokens', 'Out Tokens', 'Latency', 'Cache', 'Blocked'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logs.map((log, i) => (
                    <tr key={log.id || i} className="hover:bg-bg-main transition-colors">
                      <td className="px-4 py-3 text-xs font-mono text-text-secondary whitespace-nowrap">
                        {log.created_at || log.timestamp
                          ? format(new Date(log.created_at || log.timestamp), 'MMM d, HH:mm:ss')
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-text-primary whitespace-nowrap">
                        {log.model || log.internal_model || '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-text-secondary whitespace-nowrap">
                        {log.provider || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge code={log.status_code} />
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-text-secondary text-right">
                        {log.input_tokens != null ? log.input_tokens.toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-text-secondary text-right">
                        {log.output_tokens != null ? log.output_tokens.toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-text-secondary whitespace-nowrap">
                        {log.latency_ms != null ? `${log.latency_ms} ms` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <BoolBadge value={log.cache_hit} />
                      </td>
                      <td className="px-4 py-3">
                        <BoolBadge value={log.guardrail_blocked} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={pagination?.page ?? page}
              totalPages={pagination?.total_pages ?? 1}
              onPage={setPage}
            />
          </>
        )}
      </div>
    </div>
  )
}
