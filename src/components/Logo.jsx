// The Finvero brand mark: a green rising-V symbol followed by the wordmark.
// Original artwork — easy to swap for your final logo later.

export function LogoMark({ size = 30, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#6dff8a" />
      <path d="M7.5 10 15 23l6.5-11" fill="none" stroke="#10110e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="24.2" cy="7.8" r="2.7" fill="#10110e" />
    </svg>
  )
}

export default function Logo({ className = '', size = 'md', href = '#top' }) {
  const text = size === 'lg' ? 'text-[34px]' : 'text-[30px]'
  const mark = size === 'lg' ? 34 : 30
  return (
    <a
      href={href}
      aria-label="Finvero home"
      className={`inline-flex items-center gap-2 text-neon focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neon ${className}`}
    >
      <LogoMark size={mark} />
      <span className={`${text} font-bold leading-none tracking-[-0.04em] text-neon`}>
        Finvero<span className="text-cream">.</span>
      </span>
    </a>
  )
}
