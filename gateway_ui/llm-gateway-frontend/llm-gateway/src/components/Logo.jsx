export function Logo({ size = 32, showWordmark = true, className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Gateway arch SVG mark */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Arch / gateway shape */}
        <path
          d="M4 28V16C4 9.373 9.373 4 16 4C22.627 4 28 9.373 28 16V28"
          stroke="#c96a3d"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Left pillar */}
        <line
          x1="4"
          y1="21"
          x2="4"
          y2="28"
          stroke="#c96a3d"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Right pillar */}
        <line
          x1="28"
          y1="21"
          x2="28"
          y2="28"
          stroke="#c96a3d"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Keystone dot */}
        <circle cx="16" cy="14" r="2" fill="#c96a3d" />
      </svg>

      {showWordmark && (
        <span
          style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '-0.02em' }}
          className="text-[15px] font-semibold text-text-primary select-none"
        >
          LLM{' '}
          <span style={{ color: '#c96a3d' }}>Gateway</span>
        </span>
      )}
    </div>
  )
}
