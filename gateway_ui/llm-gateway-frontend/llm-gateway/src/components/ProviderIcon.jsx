// Simple, clean provider icon marks
export function ProviderIcon({ provider, size = 20 }) {
  const p = provider?.toLowerCase()

  if (p === 'groq') {
    return (
      <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-label="Groq">
        <rect width="20" height="20" rx="4" fill="#F55036" fillOpacity="0.12" />
        <text x="3" y="14" fontSize="9" fontWeight="700" fill="#F55036" fontFamily="monospace">GQ</text>
      </svg>
    )
  }

  if (p === 'openrouter') {
    return (
      <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-label="OpenRouter">
        <rect width="20" height="20" rx="4" fill="#7C3AED" fillOpacity="0.12" />
        <circle cx="10" cy="10" r="4" stroke="#7C3AED" strokeWidth="1.5" fill="none" />
        <circle cx="10" cy="10" r="1.5" fill="#7C3AED" />
      </svg>
    )
  }

  if (p === 'openai') {
    return (
      <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-label="OpenAI">
        <rect width="20" height="20" rx="4" fill="#10A37F" fillOpacity="0.12" />
        <path d="M10 4L13.5 7V10L10 13L6.5 10V7L10 4Z" stroke="#10A37F" strokeWidth="1.5" fill="none" />
      </svg>
    )
  }

  if (p === 'anthropic') {
    return (
      <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-label="Anthropic">
        <rect width="20" height="20" rx="4" fill="#D97706" fillOpacity="0.12" />
        <path d="M7 14L10 6L13 14" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8.2 11.5H11.8" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  }

  // Default generic provider icon
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-label={provider}>
      <rect width="20" height="20" rx="4" fill="#6f6a63" fillOpacity="0.12" />
      <circle cx="10" cy="10" r="3.5" stroke="#6f6a63" strokeWidth="1.5" fill="none" />
    </svg>
  )
}
