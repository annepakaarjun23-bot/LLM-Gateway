import { TrendingUp, TrendingDown } from 'lucide-react'

export function StatCard({ title, value, subtext, trend, trendLabel, icon: Icon, loading, children, className = '' }) {
  if (loading) {
    return (
      <div className={`bg-bg-card border border-border rounded-xl p-6 ${className}`}>
        <div className="space-y-3">
          <div className="shimmer h-4 w-24 rounded" />
          <div className="shimmer h-8 w-32 rounded" />
          <div className="shimmer h-3 w-20 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-bg-card border border-border rounded-xl p-6 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-secondary">{title}</p>
          {children ? (
            <div className="mt-3">{children}</div>
          ) : (
            <p className="mt-2 text-3xl font-bold text-text-primary tracking-tight font-mono">
              {value ?? '—'}
            </p>
          )}
          {(subtext || trend !== undefined) && (
            <div className="mt-2 flex items-center gap-2">
              {trend !== undefined && (
                <span className={`flex items-center gap-0.5 text-xs font-medium ${
                  trend >= 0 ? 'text-accent-secondary' : 'text-danger'
                }`}>
                  {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {Math.abs(trend)}%
                </span>
              )}
              {subtext && (
                <span className="text-xs text-text-secondary">{subtext}</span>
              )}
            </div>
          )}
        </div>
        {Icon && (
          <div className="ml-4 p-2 rounded-lg bg-bg-main">
            <Icon size={18} className="text-text-secondary" />
          </div>
        )}
      </div>
    </div>
  )
}
