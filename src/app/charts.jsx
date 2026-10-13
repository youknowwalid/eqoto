import { useMemo, useRef, useState } from 'react'

/** Smooth-ish area/line chart with hover read-out. points: [{t, v}] */
export function LineChart({ points, height = 220, color = '#17b857', fmt = (v) => v.toFixed(2), label, className = '', grid = true }) {
  const ref = useRef(null)
  const [hover, setHover] = useState(null)
  const W = 640
  const H = height
  const pad = { l: 6, r: 6, t: 14, b: 22 }

  const g = useMemo(() => {
    if (!points || points.length < 2) return null
    const xs = points.map((p) => p.t)
    const ys = points.map((p) => p.v)
    const x0 = Math.min(...xs)
    const x1 = Math.max(...xs)
    let y0 = Math.min(...ys)
    let y1 = Math.max(...ys)
    if (y0 === y1) {
      y0 -= 1
      y1 += 1
    }
    const padY = (y1 - y0) * 0.12
    y0 -= padY
    y1 += padY
    const sx = (t) => pad.l + ((t - x0) / (x1 - x0 || 1)) * (W - pad.l - pad.r)
    const sy = (v) => pad.t + (1 - (v - y0) / (y1 - y0)) * (H - pad.t - pad.b)
    const line = points.map((p, i) => `${i ? 'L' : 'M'}${sx(p.t).toFixed(1)} ${sy(p.v).toFixed(1)}`).join('')
    const area = `${line}L${sx(x1).toFixed(1)} ${H - pad.b}L${sx(x0).toFixed(1)} ${H - pad.b}Z`
    const ticks = [0, 1, 2, 3].map((i) => {
      const v = y0 + ((y1 - y0) * i) / 3
      return { y: sy(v), v }
    })
    return { sx, sy, line, area, x0, x1, ticks }
  }, [points, H])

  if (!g) return <div className={`grid place-items-center text-[14px] text-soft ${className}`} style={{ height }}>Not enough data yet</div>

  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width) * W
    let best = 0
    let bd = Infinity
    points.forEach((p, i) => {
      const d = Math.abs(g.sx(p.t) - x)
      if (d < bd) {
        bd = d
        best = i
      }
    })
    setHover(best)
  }
  const hp = hover != null ? points[hover] : null
  const up = points[points.length - 1].v >= points[0].v
  const c = color === 'auto' ? (up ? '#17b857' : '#e5484d') : color
  const id = `g${Math.abs(Math.round(points[0].v * 1000 + points.length))}`

  return (
    <div className={`relative ${className}`}>
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={label || 'Chart'} onMouseMove={onMove} onMouseLeave={() => setHover(null)} onTouchMove={(e) => onMove(e.touches[0])}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c} stopOpacity="0.28" />
            <stop offset="100%" stopColor={c} stopOpacity="0" />
          </linearGradient>
        </defs>
        {grid && g.ticks.map((t, i) => <line key={i} x1={pad.l} x2={W - pad.r} y1={t.y} y2={t.y} stroke="var(--c-line)" strokeDasharray="3 5" />)}
        <path d={g.area} fill={`url(#${id})`} />
        <path d={g.line} fill="none" stroke={c} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
        {hp && (
          <>
            <line x1={g.sx(hp.t)} x2={g.sx(hp.t)} y1={pad.t} y2={H - pad.b} stroke={c} strokeOpacity=".6" />
            <circle cx={g.sx(hp.t)} cy={g.sy(hp.v)} r="5" fill="var(--c-card)" stroke={c} strokeWidth="2.5" />
          </>
        )}
      </svg>
      <div className="mt-1 flex justify-between text-[12px] text-soft">
        <span>{new Date(g.x0).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
        <span>{new Date(g.x1).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
      </div>
      {hp && (
        <div className="pointer-events-none absolute left-2 top-1 rounded-md bg-navy px-2.5 py-1.5 text-[12.5px] font-medium text-white shadow-lg">
          {fmt(hp.v)} · {new Date(hp.t).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
    </div>
  )
}

export function Sparkline({ values, width = 90, height = 30, up }) {
  if (!values || values.length < 2) return <svg width={width} height={height} aria-hidden="true" />
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${((i / (values.length - 1)) * (width - 2) + 1).toFixed(1)} ${(height - 3 - ((v - min) / span) * (height - 6)).toFixed(1)}`).join('')
  const isUp = up ?? values[values.length - 1] >= values[0]
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <path d={d} fill="none" stroke={isUp ? '#17b857' : '#e5484d'} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

export function BarChart({ data, height = 180, color = '#4f8bea', fmt = (v) => v, className = '' }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  const [hover, setHover] = useState(null)
  return (
    <div className={className}>
      <div className="relative flex items-end gap-1.5" style={{ height }}>
        {data.map((d, i) => (
          <div key={i} className="group relative flex h-full flex-1 items-end" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <div className="w-full rounded-t-[4px] transition-opacity" style={{ height: `${Math.max(2, (d.value / max) * 100)}%`, background: color, opacity: hover == null || hover === i ? 1 : 0.45 }} />
            {hover === i && (
              <div className="absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-navy px-2 py-1 text-[12px] font-medium text-white shadow">
                {d.label}: {fmt(d.value)}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-1.5 text-[11px] text-soft">
        {data.map((d, i) => (
          <span key={i} className="flex-1 truncate text-center">{i % 2 === 0 || data.length < 8 ? d.short ?? d.label : ''}</span>
        ))}
      </div>
    </div>
  )
}

export function Donut({ parts, size = 150, thickness = 22, center }) {
  const total = parts.reduce((s, p) => s + p.value, 0) || 1
  const r = (size - thickness) / 2
  const c = 2 * Math.PI * r
  let off = 0
  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Allocation">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--c-line)" strokeWidth={thickness} />
        {parts.map((p, i) => {
          const len = (p.value / total) * c
          const el = (
            <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={p.color} strokeWidth={thickness} strokeDasharray={`${Math.max(0, len - 2)} ${c}`} strokeDashoffset={-off} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
          )
          off += len
          return el
        })}
      </svg>
      {center && <div className="absolute inset-0 grid place-items-center text-center">{center}</div>}
    </div>
  )
}
