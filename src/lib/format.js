const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
export const money = (n) => usd.format(Number(n) || 0)
export const moneyShort = (n) => {
  const v = Number(n) || 0
  if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(2)}M`
  if (Math.abs(v) >= 1e4) return `$${(v / 1e3).toFixed(1)}K`
  return money(v)
}
export const price = (n) => {
  const v = Number(n) || 0
  const d = v >= 1000 ? 2 : v >= 1 ? 2 : 4
  return `$${v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}`
}
export const pct = (n, signed = true) => {
  const v = Number(n) || 0
  return `${signed && v > 0 ? '+' : ''}${v.toFixed(2)}%`
}
export const signedMoney = (n) => {
  const v = Number(n) || 0
  return `${v > 0 ? '+' : v < 0 ? '−' : ''}${money(Math.abs(v))}`
}
export const units = (n) => {
  const v = Number(n) || 0
  return v >= 100 ? v.toFixed(2) : v >= 1 ? v.toFixed(3) : v.toFixed(5)
}
export const num = (n) => (Number(n) || 0).toLocaleString('en-US')
export const date = (d, opts) =>
  d ? new Date(d).toLocaleDateString('en-GB', opts || { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
export const dateTime = (d) =>
  d ? new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'
export const timeAgo = (d) => {
  const s = Math.max(1, Math.round((Date.now() - new Date(d).getTime()) / 1000))
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 86400 * 14) return `${Math.floor(s / 86400)}d ago`
  return date(d)
}
export const initials = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('') || '?'
export const cx = (...a) => a.filter(Boolean).join(' ')
export const download = (filename, text, type = 'text/csv') => {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
export const toCsv = (rows) => {
  if (!rows.length) return ''
  const cols = Object.keys(rows[0])
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n')
}
