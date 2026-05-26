const variants = {
  active: 'bg-[#657153]/10 text-[#657153] border border-[#657153]/20',
  inactive: 'bg-[#6f6a63]/10 text-[#6f6a63] border border-[#6f6a63]/20',
  success: 'bg-[#657153]/10 text-[#657153] border border-[#657153]/20',
  warning: 'bg-[#c98a3d]/10 text-[#c98a3d] border border-[#c98a3d]/20',
  danger: 'bg-[#b54a3f]/10 text-[#b54a3f] border border-[#b54a3f]/20',
  primary: 'bg-[#c96a3d]/10 text-[#c96a3d] border border-[#c96a3d]/20',
  default: 'bg-bg-main text-text-secondary border border-border',
}

export function Badge({ variant = 'default', children, dot = false, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {dot && (
        <span className={`inline-block w-1.5 h-1.5 rounded-full ${
          variant === 'active' || variant === 'success' ? 'bg-[#657153]' :
          variant === 'inactive' ? 'bg-[#6f6a63]' :
          variant === 'danger' ? 'bg-[#b54a3f]' :
          variant === 'warning' ? 'bg-[#c98a3d]' :
          'bg-[#c96a3d]'
        }`} />
      )}
      {children}
    </span>
  )
}
