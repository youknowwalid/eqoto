import { useId } from 'react'
import { mulberry32 } from '../lib/rng'
import { PortraitFigure } from './Portrait'

/* ─────────────────────────────────────────────────────────────
   Hero scene: dark marble table, linen cloth, paper stack, coffee cup.
   Drawn entirely with SVG so nothing is ever blank or missing.
   ───────────────────────────────────────────────────────────── */
export function HeroScene({ className = '' }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  const rnd = mulberry32(42)

  // Thin "contour" bands taken from fractal noise read as natural marble veining
  const band = (peaks, size = 48) =>
    Array.from({ length: size }, (_, i) => {
      const hit = peaks.find(([idx]) => idx === i)
      return hit ? hit[1] : 0
    }).join(' ')

  return (
    <svg
      viewBox="0 0 1200 760"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role="img"
      aria-label="Dark marble table with a linen cloth and a cup of coffee"
    >
      <defs>
        <linearGradient id={`${id}-base`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1b2420" />
          <stop offset="0.55" stopColor="#101713" />
          <stop offset="1" stopColor="#0a0f0c" />
        </linearGradient>
        <linearGradient id={`${id}-linen`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d7d1bf" />
          <stop offset="0.5" stopColor="#bdb7a4" />
          <stop offset="1" stopColor="#8a8575" />
        </linearGradient>
        <radialGradient id={`${id}-cup`} cx="0.45" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#3a2417" />
          <stop offset="0.7" stopColor="#1b0f08" />
          <stop offset="1" stopColor="#0d0704" />
        </radialGradient>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7d6f5e" />
          <stop offset="1" stopColor="#2c251d" />
        </linearGradient>
        <filter id={`${id}-b8`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
        <filter id={`${id}-b30`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="30" />
        </filter>
        <filter id={`${id}-b1`}>
          <feGaussianBlur stdDeviation="0.7" />
        </filter>
        <filter id={`${id}-cloud`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.0032 0.0058" numOctaves="4" seed="7" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.36  0 0 0 0 0.45  0 0 0 0 0.40  2.1 0 0 0 -0.8" />
        </filter>
        <filter id={`${id}-veinA`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.0030 0.0052" numOctaves="3" seed="23" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.95  0 0 0 0 0.98  0 0 0 0 0.94  1 0 0 0 0" result="a" />
          <feComponentTransfer in="a">
            <feFuncA type="table" tableValues={band([[21, 0.95], [22, 0.5], [20, 0.5]])} />
          </feComponentTransfer>
          <feGaussianBlur stdDeviation="0.9" />
        </filter>
        <filter id={`${id}-veinB`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.0062 0.0100" numOctaves="3" seed="91" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.9  0 0 0 0 0.95  0 0 0 0 0.9  1 0 0 0 0" result="a" />
          <feComponentTransfer in="a">
            <feFuncA type="table" tableValues={band([[24, 0.55], [23, 0.2], [25, 0.2]])} />
          </feComponentTransfer>
          <feGaussianBlur stdDeviation="1.1" />
        </filter>
      </defs>

      <rect width="1200" height="760" fill={`url(#${id}-base)`} />

      {/* mineral clouds + marble veining (procedural, so it never looks like a flat colour) */}
      <rect width="1200" height="760" filter={`url(#${id}-cloud)`} opacity="0.6" />
      <rect width="1200" height="760" filter={`url(#${id}-veinB)`} opacity="0.28" />
      <rect width="1200" height="760" filter={`url(#${id}-veinA)`} opacity="0.55" />

      {/* a few bold fractures, like the heavy white veins in polished marble */}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${id}-b1)`}>
        <path d="M470 40 C505 120 462 190 540 250 C598 296 640 270 700 330 C746 372 790 340 850 384" stroke="#f3f7f1" strokeWidth="3.4" opacity="0.72" />
        <path d="M540 250 C522 318 566 352 520 420 C498 452 520 480 506 520" stroke="#f3f7f1" strokeWidth="2.2" opacity="0.6" />
        <path d="M700 330 C720 290 770 280 800 240" stroke="#f3f7f1" strokeWidth="1.6" opacity="0.5" />
        <path d="M130 120 C200 150 220 210 300 220 C340 226 360 260 400 262" stroke="#f3f7f1" strokeWidth="2" opacity="0.5" />
        <path d="M60 470 C140 430 210 440 260 400" stroke="#f3f7f1" strokeWidth="1.4" opacity="0.4" />
      </g>

      {/* linen cloth, top right */}
      <g>
        <path
          d="M880 0 C915 70 905 110 960 170 C1010 225 1070 240 1110 300 C1150 355 1170 400 1200 430 L1200 0 Z"
          fill={`url(#${id}-linen)`}
        />
        <g fill="none" stroke="#6f6a5b" strokeLinecap="round" opacity="0.55">
          <path d="M930 40 C975 110 1040 150 1100 190" strokeWidth="2" />
          <path d="M1000 20 C1040 90 1110 130 1180 160" strokeWidth="1.6" />
          <path d="M990 150 C1050 190 1110 250 1160 300" strokeWidth="1.8" />
          <path d="M1060 80 C1100 130 1150 150 1200 170" strokeWidth="1.2" />
        </g>
        <g fill="none" stroke="#f4efe0" strokeLinecap="round" opacity="0.4">
          <path d="M950 20 C990 100 1060 140 1120 170" strokeWidth="3" />
          <path d="M1030 120 C1080 170 1130 210 1190 240" strokeWidth="2.4" />
        </g>
      </g>

      {/* paper stack, bottom right */}
      <g>
        <path d="M1010 760 L1060 620 L1200 560 L1200 760 Z" fill="#cfd1cb" />
        <path d="M1040 760 L1086 640 L1200 590 L1200 760 Z" fill="#e4e5df" />
        <path d="M1070 760 L1110 664 L1200 626 L1200 760 Z" fill="#f2f2ed" />
        <path d="M1060 620 L1200 560" stroke="#9a9d96" strokeWidth="1.5" />
        <path d="M1086 640 L1200 590" stroke="#b6b9b1" strokeWidth="1.2" />
      </g>

      {/* coffee cup, soft focus */}
      <g filter={`url(#${id}-b8)`}>
        <ellipse cx="205" cy="590" rx="150" ry="140" fill={`url(#${id}-rim)`} opacity="0.85" />
        <ellipse cx="205" cy="590" rx="118" ry="108" fill="#0e0905" />
        <ellipse cx="205" cy="590" rx="108" ry="98" fill={`url(#${id}-cup)`} />
        <ellipse cx="170" cy="560" rx="46" ry="26" fill="#6a4a30" opacity="0.4" />
      </g>

      {/* light falloff */}
      <rect width="1200" height="760" fill="#000" opacity="0.12" />
    </svg>
  )
}

/* ─────────────────────────────────────────────────────────────
   Night city + presenter, used in the "Powered by intelligence" section
   ───────────────────────────────────────────────────────────── */
export function CityScene({ className = '' }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  const rnd = mulberry32(2026)

  const buildings = [
    { x: 0, w: 150, h: 262, tone: '#12171f' },
    { x: 150, w: 70, h: 150, tone: '#161c26' },
    { x: 220, w: 60, h: 110, tone: '#1a202b' },
    { x: 300, w: 66, h: 128, tone: '#1a202b' },
    { x: 366, w: 54, h: 188, tone: '#131922' },
    { x: 420, w: 64, h: 140, tone: '#171d27' },
    { x: 484, w: 52, h: 200, tone: '#10151d' },
    { x: 536, w: 52, h: 120, tone: '#171d27' },
  ]

  const windows = []
  buildings.forEach((b, bi) => {
    const top = 262 - b.h
    for (let y = top + 8; y < 238; y += 11) {
      for (let x = b.x + 6; x < b.x + b.w - 6; x += 9) {
        const r = rnd()
        if (r > 0.52) {
          const color = r > 0.9 ? '#cfe3ff' : r > 0.72 ? '#ffd98a' : '#ffbf66'
          windows.push(<rect key={`${bi}-${x}-${y}`} x={x} y={y} width="4.6" height="6" fill={color} opacity={0.5 + rnd() * 0.5} />)
        }
      }
    }
  })

  const trails = [
    { y: 226, c: '#ff4d2a', w: 3.2 },
    { y: 232, c: '#ffb36b', w: 2.2 },
    { y: 238, c: '#fff1d6', w: 1.6 },
    { y: 244, c: '#ff6a3d', w: 2.8 },
    { y: 250, c: '#ffd29a', w: 1.4 },
  ]

  const womanLook = {
    skin: '#e8c2a6',
    hair: '#6b4a36',
    hairStyle: 'long',
    top: '#1c2547',
    topStyle: 'blazer',
  }

  return (
    <svg
      viewBox="0 0 588 262"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role="img"
      aria-label="Illustrated presenter standing in front of a night city skyline"
    >
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#070a12" />
          <stop offset="0.7" stopColor="#141b2b" />
          <stop offset="1" stopColor="#2a2433" />
        </linearGradient>
        <filter id={`${id}-glow`} x="-10%" y="-200%" width="120%" height="500%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
        <filter id={`${id}-bokeh`}>
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      <rect width="588" height="262" fill={`url(#${id}-sky)`} />
      {buildings.map((b, i) => (
        <rect key={i} x={b.x} y={262 - b.h} width={b.w} height={b.h} fill={b.tone} />
      ))}
      <g>{windows}</g>
      <g filter={`url(#${id}-bokeh)`} opacity="0.7">
        {Array.from({ length: 12 }).map((_, i) => (
          <circle key={i} cx={rnd() * 588} cy={150 + rnd() * 90} r={4 + rnd() * 9} fill={['#ffd29a', '#ff7a45', '#9ec8ff'][i % 3]} opacity={0.35 + rnd() * 0.4} />
        ))}
      </g>
      <g filter={`url(#${id}-glow)`}>
        {trails.map((t, i) => (
          <rect key={i} x={-10} y={t.y} width="610" height={t.w} fill={t.c} opacity={0.75} rx="1.5" />
        ))}
      </g>
      {/* presenter */}
      <svg x="160" y="-22" width="270" height="334" viewBox="0 0 420 520" preserveAspectRatio="xMidYMax meet">
        <PortraitFigure look={womanLook} id={`${id}-w`} offsetY={0} />
      </svg>
    </svg>
  )
}

/* ─────────────────────────────────────────────────────────────
   Wide glowing chart line that runs behind / out of the CTA phone
   ───────────────────────────────────────────────────────────── */
export function GlowChart({ className = '' }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  const rnd = mulberry32(88)
  const pts = []
  let y = 150
  for (let i = 0; i <= 60; i++) {
    y += (rnd() - 0.48) * 16 - 1.2
    y = Math.max(24, Math.min(210, y))
    pts.push([i * (1000 / 60), y])
  }
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  return (
    <svg viewBox="0 0 1000 260" preserveAspectRatio="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6dff8a" stopOpacity="0.22" />
          <stop offset="1" stopColor="#6dff8a" stopOpacity="0" />
        </linearGradient>
        <filter id={`${id}-glow`} x="-5%" y="-30%" width="110%" height="160%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>
      <path d={`${d} L1000 260 L0 260 Z`} fill={`url(#${id}-fill)`} />
      <path d={d} fill="none" stroke="#6dff8a" strokeWidth="6" opacity="0.45" filter={`url(#${id}-glow)`} />
      <path d={d} fill="none" stroke="#6dff8a" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  )
}

/* Small decorative sparkline used on phone screens */
export function Sparkline({ seed = 3, width = 240, height = 90, className = '', dots = true, stroke = '#6dff8a' }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  const rnd = mulberry32(seed)
  const n = 36
  const pts = []
  let y = height * 0.62
  for (let i = 0; i < n; i++) {
    y += (rnd() - 0.5) * (height * 0.2) - height * 0.006
    y = Math.max(height * 0.12, Math.min(height * 0.9, y))
    pts.push([(i / (n - 1)) * width, y])
  }
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" preserveAspectRatio="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-f`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={stroke} stopOpacity="0.25" />
          <stop offset="1" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L${width} ${height} L0 ${height} Z`} fill={`url(#${id}-f)`} />
      <path d={d} fill="none" stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" />
      {dots &&
        pts
          .filter((_, i) => i % 6 === 0)
          .map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="1.6" fill="#10110e" stroke={stroke} strokeWidth="1" />)}
    </svg>
  )
}
