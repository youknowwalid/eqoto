import { useId } from 'react'
import { mulberry32 } from '../lib/rng'

/* Colour helpers ------------------------------------------------------- */
function hexToRgb(hex) {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
export function shade(hex, amount) {
  // amount -1 (black) … 0 … +1 (white)
  const [r, g, b] = hexToRgb(hex)
  const t = amount < 0 ? 0 : 255
  const p = Math.abs(amount)
  const f = (c) => Math.round((t - c) * p + c)
  return `rgb(${f(r)}, ${f(g)}, ${f(b)})`
}

/* Background scenes (soft focus, like an editorial portrait) ----------- */
function Scene({ look, id, seed }) {
  const rnd = mulberry32(seed)
  const { scene, bgA, bgB } = look
  const bokeh = (n, colors, rMin, rMax, yMax = 400) =>
    Array.from({ length: n }).map((_, i) => {
      const r = rMin + rnd() * (rMax - rMin)
      return (
        <circle
          key={i}
          cx={rnd() * 420 - 10}
          cy={rnd() * yMax}
          r={r}
          fill={colors[Math.floor(rnd() * colors.length)]}
          opacity={0.25 + rnd() * 0.45}
        />
      )
    })

  let detail = null
  if (scene === 'interior') {
    detail = (
      <>
        <rect x="318" y="0" width="100" height="330" fill="#e9e2d2" opacity="0.9" />
        <rect x="318" y="0" width="100" height="330" fill={`url(#${id}-win)`} />
        <rect x="346" y="0" width="4" height="330" fill="#6a5f50" opacity="0.5" />
        <rect x="380" y="0" width="4" height="330" fill="#6a5f50" opacity="0.5" />
        <rect x="318" y="150" width="100" height="4" fill="#6a5f50" opacity="0.5" />
        <rect x="70" y="70" width="86" height="110" rx="3" fill="#2f2a26" opacity="0.55" />
        <rect x="80" y="82" width="66" height="86" fill="#b9ad9a" opacity="0.5" />
        <line x1="44" y1="0" x2="44" y2="250" stroke="#22201d" strokeWidth="2" opacity="0.7" />
        <ellipse cx="44" cy="262" rx="46" ry="22" fill="#e9c7a0" opacity="0.9" />
        <ellipse cx="44" cy="276" rx="30" ry="9" fill="#fff4dc" opacity="0.7" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <ellipse
            key={i}
            cx={352 + (i % 3) * 22}
            cy={330 - i * 16}
            rx="52"
            ry="12"
            fill={i % 2 ? '#2f4a2c' : '#3d5e36'}
            transform={`rotate(${-40 + i * 22} ${352 + (i % 3) * 22} ${330 - i * 16})`}
            opacity="0.95"
          />
        ))}
      </>
    )
  } else if (scene === 'forest') {
    detail = (
      <>
        {bokeh(26, ['#d5e86a', '#9ac24a', '#e9f2a3', '#4f7b2c'], 10, 46, 340)}
        {[40, 110, 300, 372].map((x, i) => (
          <rect key={x} x={x} y="0" width={10 + (i % 2) * 8} height="470" fill="#1b2412" opacity="0.55" />
        ))}
      </>
    )
  } else if (scene === 'balcony') {
    detail = (
      <>
        <rect x="0" y="0" width="150" height="400" fill="#e6e8e6" opacity="0.85" />
        {Array.from({ length: 6 }).map((_, r) =>
          Array.from({ length: 3 }).map((__, c) => (
            <rect key={`${r}-${c}`} x={14 + c * 44} y={24 + r * 58} width="32" height="42" fill="#7d8a93" opacity="0.55" />
          )),
        )}
        <rect x="300" y="40" width="110" height="260" fill="#f3f4f2" opacity="0.7" />
        <rect x="0" y="330" width="420" height="6" fill="#9aa09b" opacity="0.7" />
        {bokeh(8, ['#6c8f54', '#89a96a'], 24, 50, 470).map((c, i) => (
          <g key={i} transform="translate(0 150)">
            {c}
          </g>
        ))}
        <ellipse cx="372" cy="430" rx="64" ry="38" fill="#4b6b3a" opacity="0.85" />
        <ellipse cx="28" cy="440" rx="58" ry="34" fill="#587a45" opacity="0.8" />
      </>
    )
  } else if (scene === 'office') {
    detail = (
      <>
        {bokeh(30, ['#ffd48a', '#ffb867', '#ffe9b8', '#8fb6e6'], 6, 26, 300)}
        <rect x="0" y="0" width="420" height="22" fill="#0e131b" opacity="0.5" />
        <rect x="330" y="140" width="60" height="160" fill="#10161f" opacity="0.5" />
        <ellipse cx="362" cy="136" rx="34" ry="12" fill="#ffd9a1" opacity="0.8" />
      </>
    )
  } else if (scene === 'cafe') {
    detail = (
      <>
        {bokeh(24, ['#ffc57d', '#ffdba9', '#f08f4c', '#fff0cf'], 8, 34, 280)}
        <rect x="0" y="120" width="420" height="5" fill="#2a1a10" opacity="0.6" />
        <rect x="0" y="210" width="420" height="5" fill="#2a1a10" opacity="0.6" />
        {Array.from({ length: 9 }).map((_, i) => (
          <rect
            key={i}
            x={14 + i * 46}
            y={82 + (i % 3) * 6}
            width="18"
            height="38"
            rx="3"
            fill={['#7d3b2c', '#c59a52', '#40563d'][i % 3]}
            opacity="0.7"
          />
        ))}
      </>
    )
  } else {
    // sunset
    detail = (
      <>
        <circle cx="318" cy="150" r="92" fill="#ffd9a8" opacity="0.42" />
        <circle cx="318" cy="150" r="46" fill="#fff0cf" opacity="0.7" />
        {bokeh(12, ['#ffb7a3', '#ffd9c2', '#c78fb5'], 10, 30, 260)}
        <path d="M0 330 L40 270 L90 320 L140 250 L200 330 L260 280 L330 340 L420 290 L420 470 L0 470 Z" fill="#2a2038" opacity="0.7" />
      </>
    )
  }

  return (
    <>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={bgA} />
          <stop offset="1" stopColor={bgB} />
        </linearGradient>
        <linearGradient id={`${id}-win`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fffbea" stopOpacity="0.95" />
          <stop offset="1" stopColor="#d6c9ae" stopOpacity="0.5" />
        </linearGradient>
        <filter id={`${id}-blur`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
      <rect width="420" height="520" fill={`url(#${id}-bg)`} />
      <g filter={`url(#${id}-blur)`}>{detail}</g>
    </>
  )
}

/* The person ----------------------------------------------------------- */
export function PortraitFigure({ look, id, offsetY = -36, scale = 1.1 }) {
  const { skin, hair, hairStyle, top, topStyle } = look
  const skinShade = shade(skin, -0.2)
  const skinDeep = shade(skin, -0.34)
  const skinLight = shade(skin, 0.16)
  const hairDark = shade(hair, -0.3)
  const hairLight = shade(hair, 0.28)
  const topDark = shade(top, -0.3)
  const topLight = shade(top, 0.14)
  const lip = shade(skin, -0.38)
  const eyeY = 228

  const backHair = () => {
    if (hairStyle === 'long' || hairStyle === 'wavy') {
      const wave = hairStyle === 'wavy'
      return (
        <path
          d={
            wave
              ? 'M146 196 C118 270 128 340 104 410 C128 440 150 420 160 450 C176 430 200 470 214 440 C238 460 262 430 290 446 C282 380 286 300 254 196 Z'
              : 'M146 196 C122 270 120 360 108 440 L176 452 L226 452 L292 440 C280 360 278 270 254 196 Z'
          }
          fill={hairDark}
        />
      )
    }
    if (hairStyle === 'bob') {
      return (
        <path
          d="M142 206 C124 262 130 318 148 336 C166 346 176 322 176 322 L224 322 C224 322 234 346 252 336 C270 318 276 262 258 206 Z"
          fill={hairDark}
        />
      )
    }
    return null
  }

  const frontHair = () => {
    switch (hairStyle) {
      case 'long':
      case 'wavy':
        return (
          <>
            <path
              d="M146 238 C136 164 178 134 208 136 C250 138 268 182 254 238 C250 206 236 184 210 178 C182 176 158 200 146 238 Z"
              fill={hair}
            />
            <path d="M150 220 C160 176 190 156 214 158" stroke={hairLight} strokeWidth="3" fill="none" opacity="0.55" strokeLinecap="round" />
            <path d="M176 150 C198 142 226 148 240 164" stroke={hairLight} strokeWidth="2.4" fill="none" opacity="0.4" strokeLinecap="round" />
          </>
        )
      case 'bob':
        return (
          <>
            <path
              d="M140 240 C130 160 176 130 208 132 C252 134 272 180 260 240 C258 206 240 178 214 172 C178 170 150 196 140 240 Z"
              fill={hair}
            />
            <path d="M150 190 C170 160 204 150 232 164" stroke={hairLight} strokeWidth="3" fill="none" opacity="0.5" strokeLinecap="round" />
          </>
        )
      case 'curly':
        return (
          <g>
            {Array.from({ length: 15 }).map((_, i) => {
              const a = Math.PI + (i / 14) * Math.PI
              const rx = 62
              const ry = 66
              const cx = 200 + Math.cos(a) * rx
              const cy = 196 + Math.sin(a) * ry
              return <circle key={i} cx={cx} cy={cy} r={20 + (i % 3) * 3} fill={i % 2 ? hair : hairDark} />
            })}
            {Array.from({ length: 7 }).map((_, i) => (
              <circle key={`h${i}`} cx={166 + i * 11} cy={152 + (i % 2) * 9} r="8" fill={hairLight} opacity="0.35" />
            ))}
          </g>
        )
      case 'beard':
        return (
          <>
            <path
              d="M148 226 C144 156 190 130 216 134 C254 140 262 184 252 226 C246 198 232 176 206 172 C180 172 156 192 148 226 Z"
              fill={hair}
            />
            <path
              d="M150 244 C150 304 176 330 200 330 C224 330 250 304 250 244 C244 270 226 286 200 286 C174 286 156 270 150 244 Z"
              fill={hairDark}
            />
            <path d="M184 276 C192 270 208 270 216 276 C208 282 192 282 184 276 Z" fill={hairDark} />
          </>
        )
      default: // short
        return (
          <>
            <path
              d="M148 222 C144 158 190 132 214 136 C252 142 260 186 252 222 C246 196 232 176 206 170 C180 170 156 190 148 222 Z"
              fill={hair}
            />
            <path d="M160 176 C182 152 218 150 238 170" stroke={hairLight} strokeWidth="3" fill="none" opacity="0.45" strokeLinecap="round" />
          </>
        )
    }
  }

  const collar = () => {
    if (topStyle === 'blazer') {
      return (
        <>
          <path d="M166 372 L200 436 L234 372 Z" fill="#f3efe7" />
          <path d="M166 372 L200 436 L186 470 L120 470 L148 384 Z" fill={topDark} />
          <path d="M234 372 L200 436 L214 470 L280 470 L252 384 Z" fill={topDark} />
          <path d="M166 372 L200 436 L234 372 L224 366 L200 398 L176 366 Z" fill={skinShade} opacity="0.55" />
          <path d="M200 440 L200 520" stroke={topDark} strokeWidth="2" />
        </>
      )
    }
    if (topStyle === 'vneck') {
      return (
        <>
          <path d="M162 372 L200 436 L238 372 Z" fill={skinShade} />
          <path d="M162 372 L200 436 L238 372 L226 366 L200 408 L174 366 Z" fill={skinDeep} opacity="0.35" />
        </>
      )
    }
    // sweater: crew neck
    return (
      <>
        <path d="M160 372 C170 408 230 408 240 372 L232 366 C224 392 176 392 168 366 Z" fill={topDark} />
        <path d="M168 366 C178 388 222 388 232 366 L230 360 C220 378 180 378 170 360 Z" fill={skinShade} />
      </>
    )
  }

  return (
    <g transform={`translate(0 ${offsetY}) translate(210 330) scale(${scale}) translate(-210 -330)`}>
      <defs>
        <linearGradient id={`${id}-top`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={topLight} />
          <stop offset="1" stopColor={topDark} />
        </linearGradient>
        <radialGradient id={`${id}-face`} cx="0.38" cy="0.35" r="0.85">
          <stop offset="0" stopColor={skinLight} />
          <stop offset="0.6" stopColor={skin} />
          <stop offset="1" stopColor={skinShade} />
        </radialGradient>
        <linearGradient id={`${id}-neck`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={skinShade} />
          <stop offset="0.5" stopColor={skin} />
          <stop offset="1" stopColor={skinDeep} />
        </linearGradient>
        <filter id={`${id}-soft`}>
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      {backHair()}

      <g transform="translate(0 -30)">
      {/* torso */}
      <path
        d="M28 520 C36 420 92 390 150 372 L250 372 C308 390 364 420 372 520 Z"
        fill={`url(#${id}-top)`}
      />
      <path d="M28 520 C36 420 70 396 112 382" stroke="#fff" strokeOpacity="0.12" strokeWidth="3" fill="none" />

      {/* neck */}
      <path d="M176 296 L176 356 C176 376 188 388 200 388 C212 388 224 376 224 356 L224 296 Z" fill={`url(#${id}-neck)`} />
      {collar()}
      </g>
      <ellipse cx="200" cy="304" rx="28" ry="9" fill="#000" opacity="0.3" filter={`url(#${id}-soft)`} />

      {/* ears */}
      <ellipse cx="150" cy="238" rx="7" ry="13" fill={skinShade} />
      <ellipse cx="250" cy="238" rx="7" ry="13" fill={skinDeep} />

      {/* head */}
      <ellipse cx="200" cy="232" rx="51" ry="64" fill={`url(#${id}-face)`} />

      {/* cheeks + shading */}
      <circle cx="170" cy="258" r="13" fill="#ff7a7a" opacity="0.12" />
      <circle cx="230" cy="258" r="13" fill="#ff7a7a" opacity="0.12" />

      {/* eyes */}
      {[180, 220].map((x, i) => (
        <g key={x}>
          <ellipse cx={x} cy={eyeY} rx="8" ry="4.3" fill="#f6eee8" />
          <circle cx={x + (i ? -0.6 : 0.6)} cy={eyeY} r="3.8" fill="#2a1a12" />
          <circle cx={x + (i ? -1.6 : -0.4)} cy={eyeY - 1.1} r="1" fill="#fff" opacity="0.9" />
          <path d={`M${x - 8} ${eyeY - 1.5} Q${x} ${eyeY - 6.5} ${x + 8} ${eyeY - 1.5}`} stroke={skinDeep} strokeWidth="1.6" fill="none" />
        </g>
      ))}
      <path d="M168 215 Q180 208 192 213" stroke={hairDark} strokeWidth="3.4" fill="none" strokeLinecap="round" />
      <path d="M208 213 Q220 208 232 215" stroke={hairDark} strokeWidth="3.4" fill="none" strokeLinecap="round" />

      {/* nose + mouth */}
      <ellipse cx="203" cy="249" rx="7" ry="9" fill={skinDeep} opacity="0.14" />
      <path d="M194 255 Q200 259 206 255" stroke={skinDeep} strokeWidth="1.8" fill="none" opacity="0.55" strokeLinecap="round" />
      <path d="M184 268 Q200 284 216 268 Q200 274 184 268 Z" fill={lip} />
      <path d="M188 269.5 Q200 280 212 269.5 Q200 273.5 188 269.5 Z" fill="#fff" opacity="0.92" />

      {frontHair()}
    </g>
  )
}

export default function Portrait({ look, seed = 7, className = '', title }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  return (
    <svg
      viewBox="0 0 420 520"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role="img"
      aria-label={title || 'Illustrated investor portrait'}
    >
      <Scene look={look} id={id} seed={seed} />
      <PortraitFigure look={look} id={id} />
    </svg>
  )
}

/** Tiny round avatar used in phone screens */
export function Avatar({ look, size = 28, ring = false, className = '' }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  const { skin, hair, top, bgA, bgB } = look
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className={className}
      style={ring ? { boxShadow: '0 0 0 1.5px rgba(109,255,138,0.9)', borderRadius: '9999px' } : { borderRadius: '9999px' }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}-b`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={bgA} />
          <stop offset="1" stopColor={bgB} />
        </linearGradient>
        <clipPath id={`${id}-c`}>
          <circle cx="20" cy="20" r="20" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-c)`}>
        <rect width="40" height="40" fill={`url(#${id}-b)`} />
        <path d="M2 44 C4 32 12 30 20 30 C28 30 36 32 38 44 Z" fill={top} />
        <rect x="17" y="22" width="6" height="9" fill={shade(skin, -0.18)} />
        <ellipse cx="20" cy="17" rx="7.4" ry="8.6" fill={skin} />
        <path d="M12.4 16 C12 8 18 7 21 7 C27 7 29 11 27.6 16 C26 12 23 11 20 11 C16 11 13.5 13 12.4 16 Z" fill={hair} />
      </g>
    </svg>
  )
}
