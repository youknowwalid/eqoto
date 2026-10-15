import { useId } from 'react'

/* ───────────────────────── Ticker marks (round) ───────────────────────── */
export function TickerMark({ kind, size = 48 }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  const spec = {
    nova: ['#9be34a', '#4a9a1c'],
    arca: ['#8b5cf6', '#4c2a9a'],
    mrdn: ['#4aa8ff', '#1f5fb8'],
    wrld: ['#38bdf8', '#1d4ed8'],
    tchx: ['#a78bfa', '#6d28d9'],
    grnx: ['#4ade80', '#15803d'],
    lumn: ['#fcd34d', '#d97706'],
    orbt: ['#818cf8', '#3730a3'],
    helx: ['#2dd4bf', '#0f766e'],
  }[kind] || ['#6dff8a', '#075434']

  let glyph = null
  switch (kind) {
    case 'nova':
      glyph = (
        <>
          <ellipse cx="24" cy="24" rx="13" ry="9" fill="none" stroke="#fff" strokeWidth="3" />
          <circle cx="24" cy="24" r="4.6" fill="#fff" />
          <path d="M6 24c4-9 12-13 18-13" stroke="#fff" strokeWidth="2" fill="none" opacity="0.55" />
        </>
      )
      break
    case 'arca':
      glyph = (
        <>
          <path d="M14 33 24 13l10 20" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M18.5 26h11" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" />
          <path d="M12 37c8 4 16 4 24 0" stroke="#fcd34d" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        </>
      )
      break
    case 'mrdn':
      glyph = (
        <>
          <circle cx="24" cy="24" r="12" fill="none" stroke="#fff" strokeWidth="2.6" />
          <ellipse cx="24" cy="24" rx="5.2" ry="12" fill="none" stroke="#fff" strokeWidth="2.2" />
          <path d="M12 24h24" stroke="#fff" strokeWidth="2.2" />
        </>
      )
      break
    case 'wrld':
      glyph = (
        <>
          <circle cx="24" cy="24" r="12" fill="none" stroke="#fff" strokeWidth="2.6" />
          <path d="M12.5 20h23M12.5 28h23M24 12c-6 6-6 18 0 24M24 12c6 6 6 18 0 24" stroke="#fff" strokeWidth="1.8" fill="none" />
        </>
      )
      break
    case 'tchx':
      glyph = (
        <>
          <rect x="15" y="15" width="18" height="18" rx="3.5" fill="none" stroke="#fff" strokeWidth="3" />
          <rect x="20.5" y="20.5" width="7" height="7" rx="1.5" fill="#fff" />
          <path d="M19 10v5M24 10v5M29 10v5M19 33v5M24 33v5M29 33v5M10 19h5M10 24h5M10 29h5M33 19h5M33 24h5M33 29h5" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        </>
      )
      break
    case 'grnx':
      glyph = (
        <>
          <path d="M14 33c0-12 8-19 20-19 0 12-7 19-20 19z" fill="#fff" />
          <path d="M14 33c5-5 9-9 14-13" stroke="#15803d" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </>
      )
      break
    case 'lumn':
      glyph = (
        <>
          <path d="M24 11 35 24 24 37 13 24z" fill="#fff" />
          <path d="M13 24h22M24 11l-4 13 4 13 4-13z" stroke="#d97706" strokeWidth="1.6" fill="none" strokeLinejoin="round" />
        </>
      )
      break
    case 'orbt':
      glyph = (
        <>
          <ellipse cx="24" cy="24" rx="14" ry="6.4" transform="rotate(-24 24 24)" fill="none" stroke="#fff" strokeWidth="2.6" />
          <circle cx="24" cy="24" r="5.4" fill="#fff" />
        </>
      )
      break
    case 'helx':
      glyph = (
        <>
          <path d="M17 11c0 8 14 10 14 18s-14 10-14 8M31 11c0 8-14 10-14 18" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" />
          <path d="M19 18h10M19 24h10M19 30h10" stroke="#fff" strokeWidth="1.8" opacity="0.7" strokeLinecap="round" />
        </>
      )
      break
    default:
      glyph = <circle cx="24" cy="24" r="8" fill="#fff" />
  }

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label={`${kind} logo`}>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={spec[0]} />
          <stop offset="1" stopColor={spec[1]} />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="24" fill={`url(#${id}-g)`} />
      {glyph}
    </svg>
  )
}

/* ───────────────────────── Custodian wordmarks ─────────────────────────
   Invented institutions, drawn with plain text + simple shapes. */
export function PartnerLogo({ kind }) {
  const base = 'inline-flex items-center gap-2 whitespace-nowrap text-cream'
  switch (kind) {
    case 'aldercroft':
      return (
        <span className={base}>
          <span className="font-serif text-[30px] italic leading-none tracking-[-0.02em]" style={{ fontFamily: '"Playfair Display", Georgia, "Times New Roman", serif' }}>
            Aldercroft
          </span>
          <span className="h-6 w-px bg-cream/40" />
          <svg width="24" height="21" viewBox="0 0 30 26" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
            <path d="M3 22h24M5 22l-2-10 6 4 6-10 6 10 6-4-2 10" />
            <circle cx="15" cy="4" r="1.6" fill="currentColor" />
          </svg>
        </span>
      )
    case 'northmark':
      return (
        <span className={`${base} text-[19px] font-bold tracking-tight`}>
          <svg width="30" height="30" viewBox="0 0 38 38" aria-hidden="true">
            <rect x="1.5" y="1.5" width="35" height="35" fill="none" stroke="currentColor" strokeWidth="3" />
            <path d="M10 28 28 10" stroke="currentColor" strokeWidth="4.5" />
          </svg>
          Northmark Bank
        </span>
      )
    case 'halvorsen':
      return (
        <span className={`${base} text-[17px] font-medium tracking-[0.1em]`} style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
          <svg width="30" height="30" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <circle cx="18" cy="18" r="16" />
            <circle cx="18" cy="18" r="11" />
            <path d="M13 22c2 2 8 2 10-1s-2-4-5-5-5-3-3-5 6-2 8 0" strokeWidth="1.8" />
            <path d="M18 8v20" />
          </svg>
          S. HALVORSEN
        </span>
      )
    case 'cirro':
      return (
        <span className={`${base} relative text-[38px] font-bold leading-none tracking-[-0.06em]`}>
          cirro
          <span className="absolute right-[-6px] top-[2px] h-[9px] w-[9px] rounded-full bg-cream" />
        </span>
      )
    case 'kestrel':
      return (
        <span className={`${base} text-[28px] font-bold tracking-[-0.01em]`} style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
          <svg width="30" height="30" viewBox="0 0 38 38" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <path d="M19 4v30M6 11l26 16M32 11 6 27" />
            <circle cx="19" cy="19" r="3.4" fill="currentColor" />
            <path d="M19 4l-3 4M19 4l3 4M19 34l-3-4M19 34l3-4" strokeWidth="1.8" />
          </svg>
          KESTREL
        </span>
      )
    case 'marlowe':
      return (
        <span className={`${base} text-[30px] tracking-[-0.04em]`} style={{ fontFamily: '"Playfair Display", Georgia, "Times New Roman", serif' }}>
          Marlowe<span className="mx-1 text-[0.7em] italic opacity-80">&amp;</span>Grey
        </span>
      )
    case 'orvieux':
      return (
        <span className={`${base} text-[21px] tracking-[0.04em]`} style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
          <svg width="30" height="33" viewBox="0 0 38 42" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <path d="M19 3c-5 5-12 6-12 14 0 7 5 12 12 16 7-4 12-9 12-16 0-8-7-9-12-14z" />
            <path d="M19 12v18M12 19h14" />
            <path d="M10 38h18" strokeWidth="2" />
          </svg>
          <span className="flex flex-col leading-none">
            ORVIEUX
            <span className="mt-1 text-[8px] tracking-[0.3em] opacity-70">EST. 1811</span>
          </span>
        </span>
      )
    default:
      return <span className={base}>{kind}</span>
  }
}

/* ───────────────────────── Sponsor crests ───────────────────────── */
export function Crest({ kind, size = 100 }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  const common = { width: size * 1.2, height: size, role: 'img' }
  switch (kind) {
    case 'harbor':
      return (
        <svg {...common} viewBox="0 0 120 100" aria-label="Harbor City FC crest">
          <text x="4" y="58" fill="#ff3b30" fontFamily="Inter, Arial, sans-serif" fontWeight="800" fontSize="19" letterSpacing="0.3">HARBOR</text>
          <path d="M101 34l4.4 10.4 11.2.9-8.5 7.3 2.6 11-9.7-5.9-9.7 5.9 2.6-11-8.5-7.3 11.2-.9z" fill="#ff3b30" />
          <circle cx="95" cy="26" r="1.8" fill="#ff3b30" />
          <circle cx="107" cy="26" r="1.8" fill="#ff3b30" />
        </svg>
      )
    case 'northgate':
      return (
        <svg {...common} viewBox="0 0 120 100" aria-label="Northgate United crest">
          <rect x="6" y="36" width="108" height="26" rx="3" fill="#f6c516" />
          <rect x="6" y="36" width="108" height="26" rx="3" fill="none" stroke="#b52a1f" strokeWidth="3" />
          <text x="60" y="55.5" textAnchor="middle" fill="#c8301f" fontFamily="Inter, Arial, sans-serif" fontWeight="900" fontSize="13.5" textLength="92" lengthAdjust="spacingAndGlyphs">NORTHGATE</text>
          <rect x="6" y="64" width="108" height="8" fill="#b52a1f" />
          <text x="60" y="71" textAnchor="middle" fill="#fff" fontFamily="Inter, Arial, sans-serif" fontWeight="800" fontSize="6.5" letterSpacing="2">UNITED</text>
        </svg>
      )
    case 'lakeside':
      return (
        <svg {...common} viewBox="0 0 120 100" aria-label="Lakeside Rovers crest">
          <path d="M60 6c14 8 30 8 40 6 0 38-4 62-40 82C24 74 20 50 20 12c10 2 26 2 40-6z" fill="#d62d20" stroke="#111" strokeWidth="3" />
          <path d="M30 22h60M28 34h64" stroke="#fff" strokeWidth="5" />
          <rect x="30" y="42" width="60" height="16" fill="#111" />
          <text x="60" y="54" textAnchor="middle" fill="#fff" fontFamily="Inter, Arial, sans-serif" fontWeight="800" fontSize="10" letterSpacing="1">LAKESIDE</text>
          <circle cx="60" cy="74" r="9" fill="#fff" stroke="#111" strokeWidth="2" />
          <text x="60" y="78" textAnchor="middle" fill="#111" fontFamily="Inter, Arial, sans-serif" fontWeight="900" fontSize="10">R</text>
          <text x="60" y="20" textAnchor="middle" fill="#fff" fontFamily="Inter, Arial, sans-serif" fontWeight="800" fontSize="8">1904</text>
        </svg>
      )
    case 'summit':
      return (
        <svg {...common} viewBox="0 0 120 100" aria-label="Summit Women's Rugby crest">
          <text x="62" y="14" textAnchor="middle" fill="#f2f2ee" fontFamily="Inter, Arial, sans-serif" fontWeight="900" fontSize="12" letterSpacing="3">SUMMIT</text>
          <circle cx="24" cy="48" r="17" fill="#f2f2ee" />
          <path d="M24 36a12 12 0 1 0 10 18c-4 3-11 3-14-2s-1-11 4-16z" fill="#10110e" />
          <text x="82" y="56" textAnchor="middle" fill="#f2f2ee" fontFamily="Inter, Arial, sans-serif" fontWeight="900" fontSize="27">SWR</text>
          <text x="82" y="70" textAnchor="middle" fill="#f2f2ee" fontFamily="Inter, Arial, sans-serif" fontWeight="800" fontSize="6" letterSpacing="0.8">PREMIER</text>
          <text x="82" y="79" textAnchor="middle" fill="#f2f2ee" fontFamily="Inter, Arial, sans-serif" fontWeight="800" fontSize="6" letterSpacing="0.8">WOMEN’S RUGBY</text>
        </svg>
      )
    case 'ridgeway':
      return (
        <svg {...common} viewBox="0 0 120 100" aria-label="Ridgeway SC crest">
          <path d="M60 6 100 18v34c0 20-16 34-40 42C36 86 20 72 20 52V18z" fill="#f4f1ea" stroke="#d62d20" strokeWidth="5" />
          <path d="M28 62 46 36l10 14 12-22 24 34z" fill="#d62d20" />
          <path d="M46 36l-6 9 10 6z" fill="#fff" opacity="0.8" />
          <circle cx="60" cy="20" r="4" fill="#d62d20" />
          <text x="60" y="82" textAnchor="middle" fill="#10110e" fontFamily="Inter, Arial, sans-serif" fontWeight="900" fontSize="6.6" letterSpacing="0.3">RIDGEWAY</text>
        </svg>
      )
    case 'apex':
      return (
        <svg {...common} viewBox="0 0 120 100" aria-label="Apex Alpine Racing lockup">
          <path d="M8 34v34M8 34h6M8 68h6M112 34v34M112 34h-6M112 68h-6" stroke="#f2f2ee" strokeWidth="2" fill="none" />
          <text x="34" y="46" textAnchor="middle" fill="#f2f2ee" fontFamily="Inter, Arial, sans-serif" fontWeight="900" fontSize="12">APEX</text>
          <text x="34" y="57" textAnchor="middle" fill="#f2f2ee" fontFamily="Inter, Arial, sans-serif" fontWeight="700" fontSize="5.4" letterSpacing="1.6">ALPINE</text>
          <text x="34" y="64" textAnchor="middle" fill="#f2f2ee" fontFamily="Inter, Arial, sans-serif" fontWeight="600" fontSize="3.6" letterSpacing="0.8">RACING TEAM</text>
          <path d="M58 40v22" stroke="#f2f2ee" strokeOpacity="0.5" />
          <rect x="66" y="45" width="10" height="10" rx="3" fill="#6dff8a" />
          <circle cx="71" cy="50" r="2.2" fill="none" stroke="#10110e" strokeWidth="1.4" />
          <text x="91" y="54" textAnchor="middle" fill="#6dff8a" fontFamily="Inter, Arial, sans-serif" fontWeight="800" fontSize="11" letterSpacing="-0.4">Finvero</text>
          <text x="90" y="62" textAnchor="middle" fill="#f2f2ee" fontFamily="Inter, Arial, sans-serif" fontWeight="600" fontSize="3.6" letterSpacing="0.8">TEAM PARTNER</text>
        </svg>
      )
    case 'crestview':
      return (
        <svg {...common} viewBox="0 0 120 100" aria-label="Crestview Athletic crest">
          <path d="M60 6 100 18v32c0 22-17 36-40 44C37 86 20 72 20 50V18z" fill="#2a63c9" stroke="#f4f1ea" strokeWidth="3" />
          <path d="M20 40h80v16H20z" fill="#f4f1ea" />
          <path d="M20 44h80v8H20z" fill="#c62a2a" />
          <path d="M60 14l3.2 6.6 7.2 1-5.2 5 1.3 7.2L60 30.400l-6.5 3.400 1.300-7.200-5.200-5 7.200-1z" fill="#ffd23f" />
          <text x="60" y="76" textAnchor="middle" fill="#fff" fontFamily="Inter, Arial, sans-serif" fontWeight="900" fontSize="7.6" letterSpacing="0.3">CRESTVIEW</text>
          <path d="M42 84c10 6 26 6 36 0" stroke="#ffd23f" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      )
    case 'pitch':
      return (
        <svg {...common} viewBox="0 0 120 100" aria-label="Pitch Rugby lockup">
          <text x="60" y="44" textAnchor="middle" fill="#f6f6f2" fontFamily="Inter, Arial, sans-serif" fontWeight="900" fontStyle="italic" fontSize="25" letterSpacing="-1">PITCH</text>
          <rect x="14" y="48" width="92" height="22" fill="#f6f6f2" transform="skewX(-10) translate(9 0)" />
          <text x="60" y="66" textAnchor="middle" fill="#10110e" fontFamily="Inter, Arial, sans-serif" fontWeight="900" fontStyle="italic" fontSize="19" letterSpacing="-0.5">RUGBY</text>
          <text x="60" y="84" textAnchor="middle" fill="#f6f6f2" fontFamily="Inter, Arial, sans-serif" fontWeight="600" fontSize="7" letterSpacing="0.6">OFFICIAL PARTNER</text>
        </svg>
      )
    case 'riverton':
      return (
        <svg {...common} viewBox="0 0 120 100" aria-label="Riverton 05 crest">
          <circle cx="60" cy="50" r="40" fill="#e11d2e" />
          <circle cx="60" cy="50" r="31" fill="#fff" />
          <circle cx="60" cy="50" r="25" fill="#e11d2e" />
          <text x="60" y="61" textAnchor="middle" fill="#fff" fontFamily="Inter, Arial, sans-serif" fontWeight="900" fontSize="30" letterSpacing="-1">05</text>
          <defs>
            <path id={`${id}-arc`} d="M24 50a36 36 0 0 1 72 0" />
          </defs>
        </svg>
      )
    default:
      return <svg {...common} viewBox="0 0 120 100" />
  }
}

/* ───────────────────────── Store badges (generic) ───────────────────────── */
export function StoreBadge({ store }) {
  const isApple = store === 'apple'
  return (
    <a
      href="#get-the-app"
      className="inline-flex h-12 items-center gap-2.5 rounded-[10px] border border-white/60 bg-black px-3.5 text-white transition hover:border-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon"
      aria-label={isApple ? 'Download on the App Store' : 'Get it on Google Play'}
    >
      {isApple ? (
        <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true">
          <rect x="3" y="3" width="26" height="26" rx="7" fill="#1d8cff" />
          <path d="M11 22l7-12M14.5 22l6-10.4M9 19h14" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      ) : (
        <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true">
          <path d="M5 3.5v25L18 16z" fill="#2fd1ff" />
          <path d="M5 3.5 24 14l-6 2z" fill="#34d27b" />
          <path d="M5 28.5 24 18l-6-2z" fill="#ff4d4d" />
          <path d="M24 14l4 2-4 2-6-2z" fill="#ffd23f" />
        </svg>
      )}
      <span className="flex flex-col leading-none">
        <span className="text-[9.5px] uppercase tracking-wide">{isApple ? 'Download on the' : 'Get it on'}</span>
        <span className="mt-0.5 text-[19px] font-medium tracking-tight">{isApple ? 'App Store' : 'Google Play'}</span>
      </span>
    </a>
  )
}
