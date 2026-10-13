import { useEffect } from 'react'
import { CheckI, ChevRightI, XI } from './icons'
import { cx, initials } from '../lib/format'

export const Card = ({ className = '', pad = true, children, ...r }) => (
  <section className={cx('rounded-xl border border-line bg-card shadow-[0_1px_2px_rgba(20,28,50,.04)]', pad && 'p-5 sm:p-6', className)} {...r}>
    {children}
  </section>
)

export const CardTitle = ({ title, sub, action, className = '' }) => (
  <div className={cx('mb-4 flex flex-wrap items-start justify-between gap-3', className)}>
    <div>
      <h2 className="text-[17px] font-semibold tracking-tight text-fg">{title}</h2>
      {sub && <p className="mt-0.5 text-[13.5px] text-soft">{sub}</p>}
    </div>
    {action}
  </div>
)

export const PageHead = ({ title, sub, action }) => (
  <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 className="text-[26px] font-semibold tracking-tight text-fg sm:text-[30px]">{title}</h1>
      {sub && <p className="mt-1 text-[14.5px] text-soft">{sub}</p>}
    </div>
    {action}
  </div>
)

const variants = {
  primary: 'bg-brand text-white hover:bg-brand-dark',
  blue: 'bg-azure text-white hover:bg-azure-dark',
  secondary: 'border border-line bg-card text-fg hover:bg-canvas',
  ghost: 'text-fg hover:bg-canvas',
  danger: 'bg-[#d64545] text-white hover:bg-[#bf3b3b]',
  soft: 'bg-brand-soft text-brand-dark hover:bg-brand-soft2',
}
const sizes = { sm: 'h-8 px-3.5 text-[13px]', md: 'h-10 px-5 text-[14px]', lg: 'h-12 px-7 text-[15.5px]' }

export function Btn({ variant = 'primary', size = 'md', loading, className = '', children, disabled, ...r }) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={cx(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azure disabled:cursor-not-allowed disabled:opacity-55',
        variants[variant],
        sizes[size],
        className,
      )}
      {...r}
    >
      {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {children}
    </button>
  )
}

export const Field = ({ label, hint, error, children, className = '' }) => (
  <label className={cx('block', className)}>
    {label && <span className="mb-1.5 block text-[13px] font-semibold text-fg">{label}</span>}
    {children}
    {error ? <span className="mt-1 block text-[12.5px] text-[#d64545]">{error}</span> : hint ? <span className="mt-1 block text-[12.5px] text-soft">{hint}</span> : null}
  </label>
)

const inputCls =
  'h-11 w-full rounded-lg border border-line bg-card px-3.5 text-[14.5px] text-fg outline-none transition placeholder:text-soft/70 focus:border-azure focus:ring-4 focus:ring-azure/15 disabled:bg-canvas disabled:text-soft'
export const Input = ({ className = '', ...r }) => <input className={cx(inputCls, className)} {...r} />
export const Select = ({ className = '', children, ...r }) => (
  <select className={cx(inputCls, 'appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-9', className)} style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%236c7488' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m3 6 5 5 5-5'/%3E%3C/svg%3E\")" }} {...r}>
    {children}
  </select>
)
export const Textarea = ({ className = '', ...r }) => <textarea className={cx(inputCls, 'h-auto min-h-[110px] py-3 leading-relaxed', className)} {...r} />

const tones = {
  green: 'bg-[#dff6e8] text-[#0c7a39]',
  red: 'bg-[#fde4e4] text-[#b63232]',
  amber: 'bg-[#fff0d6] text-[#955f00]',
  blue: 'bg-[#e1ecfd] text-[#2557b3]',
  gray: 'bg-[#e8eaf0] text-[#4b5468]',
  violet: 'bg-[#ece6fb] text-[#5b3fb4]',
}
export const Badge = ({ tone = 'gray', children, className = '' }) => (
  <span className={cx('inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-[3px] text-[12px] font-semibold', tones[tone], className)}>{children}</span>
)
export const statusTone = (s) =>
  ({ completed: 'green', approved: 'green', verified: 'green', active: 'green', open: 'blue', pending: 'amber', unverified: 'gray', rejected: 'red', cancelled: 'gray', suspended: 'red', closed: 'gray', stopped: 'gray', high: 'red', medium: 'amber', low: 'gray', normal: 'blue', admin: 'violet', user: 'gray' })[s] || 'gray'

export const Chg = ({ value, className = '' }) => {
  const v = Number(value) || 0
  return <span className={cx('font-semibold tabular-nums', v > 0 ? 'text-[#13a24d]' : v < 0 ? 'text-[#e5484d]' : 'text-soft', className)}>{v > 0 ? '+' : ''}{v.toFixed(2)}%</span>
}

export const Spinner = ({ className = '' }) => <span className={cx('inline-block h-5 w-5 animate-spin rounded-full border-2 border-azure border-t-transparent', className)} role="status" aria-label="Loading" />
export const Loading = ({ label = 'Loading…' }) => (
  <div className="grid place-items-center gap-3 py-16 text-[14px] text-soft"><Spinner className="!h-7 !w-7" />{label}</div>
)
export const Empty = ({ title, text, action, icon: Icon }) => (
  <div className="grid place-items-center gap-2 px-6 py-14 text-center">
    {Icon && <span className="grid h-14 w-14 place-items-center rounded-full bg-canvas text-soft"><Icon size={26} /></span>}
    <p className="text-[16px] font-semibold text-fg">{title}</p>
    {text && <p className="max-w-[360px] text-[14px] text-soft">{text}</p>}
    {action && <div className="mt-2">{action}</div>}
  </div>
)
export const ErrorBox = ({ error, retry }) => (
  <div className="rounded-lg border border-[#f3c4c4] bg-[#fdf0f0] p-4 text-[14px] text-[#b63232]">
    {error?.message || 'Something went wrong.'} {retry && <button className="ml-1 font-semibold underline" onClick={retry}>Try again</button>}
  </div>
)

export function Modal({ open, onClose, title, sub, children, footer, wide }) {
  useEffect(() => {
    if (!open) return
    const k = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', k)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', k)
      document.body.style.overflow = ''
    }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[200] grid place-items-center overflow-y-auto bg-black/50 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className={cx('my-auto w-full rounded-2xl bg-card shadow-2xl', wide ? 'max-w-[760px]' : 'max-w-[480px]')}>
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
          <div>
            <h3 className="text-[18px] font-semibold text-fg">{title}</h3>
            {sub && <p className="mt-0.5 text-[13.5px] text-soft">{sub}</p>}
          </div>
          <button aria-label="Close" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-soft hover:bg-canvas"><XI size={18} /></button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-3 border-t border-line px-6 py-4">{footer}</div>}
      </div>
    </div>
  )
}

export function Drawer({ open, onClose, title, sub, children, width = 560 }) {
  useEffect(() => {
    if (!open) return
    const k = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', k)
    return () => document.removeEventListener('keydown', k)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[180] bg-black/45" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside role="dialog" aria-modal="true" aria-label={title} className="absolute inset-y-0 right-0 flex w-full flex-col bg-card shadow-2xl" style={{ maxWidth: width }}>
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
          <div className="min-w-0">
            <h3 className="truncate text-[19px] font-semibold text-fg">{title}</h3>
            {sub && <p className="mt-0.5 truncate text-[13.5px] text-soft">{sub}</p>}
          </div>
          <button aria-label="Close" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-soft hover:bg-canvas"><XI size={19} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </aside>
    </div>
  )
}

export const Tabs = ({ tabs, value, onChange, className = '' }) => (
  <div role="tablist" className={cx('flex flex-wrap gap-1.5', className)}>
    {tabs.map((t) => {
      const v = t.value ?? t
      const l = t.label ?? t
      const on = v === value
      return (
        <button key={v} role="tab" aria-selected={on} onClick={() => onChange(v)} className={cx('h-9 rounded-full px-4 text-[13.5px] font-semibold transition', on ? 'bg-navy text-white' : 'bg-card text-soft ring-1 ring-line hover:text-fg')}>
          {l}
          {t.count != null && <span className={cx('ml-1.5 rounded-full px-1.5 text-[11.5px]', on ? 'bg-white/20' : 'bg-canvas')}>{t.count}</span>}
        </button>
      )
    })}
  </div>
)

export const Toggle = ({ checked, onChange, label, disabled }) => (
  <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={() => onChange(!checked)} className={cx('relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50', checked ? 'bg-brand' : 'bg-[#c4c9d6]')}>
    <span className={cx('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', checked ? 'left-[22px]' : 'left-0.5')} />
  </button>
)

export const ProgressBar = ({ value, className = '' }) => (
  <div className={cx('h-1.5 w-full overflow-hidden rounded-full bg-line', className)} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
    <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
  </div>
)

export const Stat = ({ label, value, sub, tone, icon: Icon }) => (
  <div className="rounded-xl border border-line bg-card p-5">
    <div className="flex items-center justify-between">
      <p className="text-[13px] font-medium text-soft">{label}</p>
      {Icon && <span className="grid h-8 w-8 place-items-center rounded-lg bg-canvas text-soft"><Icon size={17} /></span>}
    </div>
    <p className={cx('mt-2 text-[26px] font-semibold tracking-tight tabular-nums', tone === 'up' ? 'text-[#13a24d]' : tone === 'down' ? 'text-[#e5484d]' : 'text-fg')}>{value}</p>
    {sub && <p className="mt-0.5 text-[13px] text-soft">{sub}</p>}
  </div>
)

export const Avatar = ({ name, size = 36, className = '' }) => {
  const hue = [...(name || '?')].reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return (
    <span className={cx('grid shrink-0 place-items-center rounded-full font-semibold text-white', className)} style={{ width: size, height: size, fontSize: size * 0.38, background: `hsl(${hue} 42% 42%)` }} aria-hidden="true">
      {initials(name)}
    </span>
  )
}

export const Row = ({ to, icon: Icon, title, text, right, onClick }) => {
  const Tag = to ? 'a' : 'button'
  return (
    <Tag href={to} onClick={onClick} className="flex w-full items-center gap-4 rounded-lg px-3 py-3 text-left transition hover:bg-canvas">
      {Icon && <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-canvas text-fg"><Icon size={19} /></span>}
      <span className="min-w-0 flex-1"><span className="block truncate text-[14.5px] font-semibold text-fg">{title}</span>{text && <span className="block truncate text-[13px] text-soft">{text}</span>}</span>
      {right ?? <ChevRightI size={18} className="text-soft" />}
    </Tag>
  )
}

export const Check = ({ done }) => (
  <span className={cx('grid h-6 w-6 shrink-0 place-items-center rounded-full', done ? 'bg-brand text-white' : 'border-2 border-line text-transparent')}>
    <CheckI size={14} strokeWidth={3} />
  </span>
)

export const th = 'whitespace-nowrap px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-soft'
export const td = 'px-4 py-3 text-[14px] text-fg'
