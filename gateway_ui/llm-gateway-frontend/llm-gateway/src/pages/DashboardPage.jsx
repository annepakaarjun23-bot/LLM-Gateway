import { useMemo } from 'react'
import { useQuota } from '../queries/adminQueries'
import { useUsage } from '../queries/adminQueries'
import { useApiKeys } from '../queries/adminQueries'
import { StatCard } from '../components/StatCard'
import { QuotaRing } from '../components/QuotaRing'
import { Key, Zap, Database, Shield } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import { format, subDays } from 'date-fns'

const CHART_COLORS = ['#c96a3d', '#657153', '#2b2b2b', '#c98a3d', '#b54a3f']

function RequestsChart({ data, loading }) {
  if (loading) {
    return <div className="h-48 shimmer rounded-lg" />
  }
  if (!data?.length) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-text-secondary">
        No request data available
      </div>
    )
  }
  return (
    <ResponsiveContainer width="100%" height={192}>
      <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#d8cdbd" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: '#6f6a63', fontFamily: 'Inter' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#6f6a63', fontFamily: 'Inter' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: '#fffaf5',
            border: '1px solid #d8cdbd',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#2b2b2b',
          }}
        />
        <Line
          type="monotone"
          dataKey="requests"
          stroke="#c96a3d"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: '#c96a3d' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

function ModelsDonut({ data, loading }) {
  if (loading) {
    return <div className="h-48 shimmer rounded-lg" />
  }
  if (!data?.length) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-text-secondary">
        No model data available
      </div>
    )
  }
  return (
    <ResponsiveContainer width="100%" height={192}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={72}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => (
            <span style={{ fontSize: '11px', color: '#6f6a63', fontFamily: 'Inter' }}>
              {value}
            </span>
          )}
        />
        <Tooltip
          contentStyle={{
            background: '#fffaf5',
            border: '1px solid #d8cdbd',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

export default function DashboardPage() {
  // Fetch last 30 days of usage for summary
  const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd')
  const today = format(new Date(), 'yyyy-MM-dd')
  const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd')

  const { data: quota, isLoading: quotaLoading } = useQuota()
  const { data: usageData, isLoading: usageLoading } = useUsage({
    from: thirtyDaysAgo,
    to: today,
    perPage: 200,
  })
  const { data: keysData, isLoading: keysLoading } = useApiKeys()

  // Build chart data from logs — group by date
  const chartData = useMemo(() => {
    if (!usageData?.logs) return []
    const byDate = {}
    // Seed last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'MMM d')
      byDate[d] = 0
    }
    usageData.logs.forEach(log => {
      try {
        const d = format(new Date(log.created_at || log.timestamp), 'MMM d')
        if (d in byDate) byDate[d] = (byDate[d] || 0) + 1
      } catch {}
    })
    return Object.entries(byDate).map(([date, requests]) => ({ date, requests }))
  }, [usageData])

  // Build model distribution from logs
  const modelData = useMemo(() => {
    if (!usageData?.logs) return []
    const byModel = {}
    usageData.logs.forEach(log => {
      const m = log.model || log.internal_model || 'unknown'
      byModel[m] = (byModel[m] || 0) + 1
    })
    return Object.entries(byModel)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }))
  }, [usageData])

  const summary = usageData?.summary
  const activeKeys = keysData?.keys?.filter(k => k.is_active).length ?? null

  const cacheHitRate = summary
    ? summary.total_requests > 0
      ? ((summary.cache_hits / summary.total_requests) * 100).toFixed(1) + '%'
      : '0%'
    : null

  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Quota */}
        <StatCard
          title="Quota Remaining"
          loading={quotaLoading}
          subtext={quota ? `${quota.tokens_remaining.toLocaleString()} / ${quota.tokens_total.toLocaleString()} tokens` : undefined}
        >
          {quota && (
            <div className="flex items-center gap-4">
              <QuotaRing
                used={quota.tokens_used}
                total={quota.tokens_total}
                size={64}
              />
              <div>
                <p className="text-2xl font-bold text-text-primary font-mono">
                  {(100 - quota.usage_percentage).toFixed(1)}%
                </p>
                <p className="text-xs text-text-secondary mt-0.5">remaining</p>
              </div>
            </div>
          )}
        </StatCard>

        <StatCard
          title="Total Requests (30d)"
          value={summary ? summary.total_requests.toLocaleString() : null}
          loading={usageLoading}
          subtext="last 30 days"
          icon={Zap}
        />

        <StatCard
          title="Cache Hit Rate"
          value={cacheHitRate}
          loading={usageLoading}
          subtext={summary ? `${summary.cache_hits} cache hits` : undefined}
          icon={Database}
        />

        <StatCard
          title="Active API Keys"
          value={activeKeys !== null ? String(activeKeys) : null}
          loading={keysLoading}
          subtext={keysData ? `${keysData.keys.length} total` : undefined}
          icon={Key}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Requests over time */}
        <div className="lg:col-span-2 bg-bg-card border border-border rounded-xl p-6">
          <h2 className="text-sm font-semibold text-text-primary mb-1">Requests over Time</h2>
          <p className="text-xs text-text-secondary mb-4">Last 7 days</p>
          <RequestsChart data={chartData} loading={usageLoading} />
        </div>

        {/* Top Models */}
        <div className="bg-bg-card border border-border rounded-xl p-6">
          <h2 className="text-sm font-semibold text-text-primary mb-1">Top Models Used</h2>
          <p className="text-xs text-text-secondary mb-4">By request count</p>
          <ModelsDonut data={modelData} loading={usageLoading} />
        </div>
      </div>

      {/* Blocked requests callout if any */}
      {summary?.blocked_requests > 0 && (
        <div className="bg-[#b54a3f]/5 border border-[#b54a3f]/20 rounded-xl p-4 flex items-center gap-3">
          <Shield size={16} className="text-danger shrink-0" />
          <p className="text-sm text-danger">
            <span className="font-semibold">{summary.blocked_requests} requests</span> were blocked
            by guardrails in the last 30 days.
          </p>
        </div>
      )}
    </div>
  )
}
