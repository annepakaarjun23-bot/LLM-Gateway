export function QuotaRing({ used, total, size = 80 }) {
  const pct = total > 0 ? Math.min(used / total, 1) : 0
  const r = (size - 8) / 2
  const circumference = 2 * Math.PI * r
  const strokeDashoffset = circumference * (1 - pct)

  const color =
    pct >= 0.95 ? '#b54a3f' :
    pct >= 0.8 ? '#c96a3d' :
    '#657153'

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#d8cdbd"
        strokeWidth="6"
      />
      {/* Progress */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease' }}
      />
    </svg>
  )
}
