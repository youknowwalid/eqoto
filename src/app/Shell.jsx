import { useEffect, useMemo, useRef, useState } from 'react'
import { LogoMark } from '../components/Logo'
import { db } from '../lib/supabase'
import { useAuth, useMarket, useQuery, useUi } from '../lib/store'
import { Link, Redirect, useNavigate, useRouter } from '../lib/router'
import { cx, money, pct, timeAgo } from '../lib/format'
import { Avatar, Badge, Btn, Empty, ProgressBar } from './ui'
import { InstrumentMark, useVerification } from './shared'
import { useTrade } from './Trade'
import * as I from './icons'

const MAIN = [
  { to: '/app', label: 'Home', icon: I.HomeI, exact: true },
  { to: '/app/watchlist', label: 'Watchlist', icon: I.StarI },
  { to: '/app/portfolio', label: 'Portfolio', icon: I.PieI },
  { to: '/app/discover', label: 'Discover', icon: I.CompassI },
  { to: '/app/wallet', label: 'Wallet', icon: I.WalletI },
]
const MORE = [
  { to: '/app/store', label: 'App Store', icon: I.GridI, tag: 'New' },
  { to: '/app/mirror', label: 'Mirror Pro Investors', icon: I.MirrorI },
  { to: '/app/calendar', label: 'Economic Calendar', icon: I.CalendarI },
  { to: '/app/agents', label: 'Agent Portfolios', icon: I.MirrorI, tag: 'Beta' },
  { to: '/app/club', label: 'eqoto Club', icon: I.AwardI },
  { to: '/app/invite', label: 'Invite Friends', icon: I.MegaphoneI },
  { to: '/app/wallet?tab=withdraw', label: 'Withdraw Funds', icon: I.CoinsHandI },
  { to: '/app/settings', label: 'Settings', icon: I.SettingsI },
  { to: '/app/help', label: 'Help & Resources', icon: I.HelpI },
  { to: '/app/academy', label: 'Academy', icon: I.BookI },
  { to: '/app/pulse', label: 'Try Pulse', icon: I.CandlesI },
]

function isActive(path, item) {
  const base = item.to.split('?')[0]
  if (item.exact) return path === base
  if (item.to.includes('?')) return false
  return path === base || path.startsWith(`${base}/`)
}

function AccountSwitcher() {
  const { real, demo, kind, setKind } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const h = (e) => !ref.current?.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  const cur = kind === 'demo' ? demo : real
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 rounded-lg bg-navy-2 px-3 py-2.5 text-left" aria-haspopup="listbox" aria-expanded={open}>
        <span className={cx('h-2.5 w-2.5 rounded-full', kind === 'demo' ? 'bg-[#a98bff]' : 'bg-[#3bd16f]')} />
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block text-[14px] font-semibold text-white">{kind === 'demo' ? 'Demo Account' : 'Main Account'}</span>
          <span className="block text-[11px] text-white/60">{kind === 'demo' ? 'Virtual' : 'Real'} · {money(cur?.balance)}</span>
        </span>
        <I.ChevDownI size={18} className="text-white/70" />
      </button>
      {open && (
        <ul role="listbox" className="absolute inset-x-0 top-full z-30 mt-1.5 overflow-hidden rounded-lg bg-navy-2 shadow-xl ring-1 ring-white/10">
          {[['real', 'Main Account', 'Real', real], ['demo', 'Demo Account', 'Virtual', demo]].map(([k, n, s, a]) => (
            <li key={k}>
              <button role="option" aria-selected={kind === k} onClick={() => { setKind(k); setOpen(false) }} className={cx('flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-white/5', kind === k && 'bg-white/5')}>
                <span className={cx('h-2.5 w-2.5 rounded-full', k === 'demo' ? 'bg-[#a98bff]' : 'bg-[#3bd16f]')} />
                <span className="flex-1 leading-tight"><span className="block text-[14px] font-semibold text-white">{n}</span><span className="block text-[11px] text-white/60">{s}</span></span>
                <span className="text-[13px] tabular-nums text-white/80">{money(a?.balance)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Sidebar({ collapsed, onNavigate }) {
  const { path } = useRouter()
  const { profile, isAdmin, signOut } = useAuth()
  const { percent } = useVerification()
  const nav = useNavigate()
  const Item = ({ item }) => {
    const on = isActive(path, item)
    return (
      <Link to={item.to} onClick={onNavigate} title={item.label} className={cx('group relative flex items-center gap-3 rounded-md py-[9px] text-[15px] transition hover:bg-white/5 hover:text-white', collapsed ? 'justify-center px-0' : 'px-3', on ? 'bg-white/[.06] font-semibold text-white' : 'text-white/75')}>
        {on && <span className="absolute -left-4 top-1.5 h-[calc(100%-12px)] w-[3px] rounded-r bg-[#3bd16f]" />}
        <item.icon size={19} className="shrink-0" />
        {!collapsed && <span className="truncate">{item.label}</span>}
        {!collapsed && item.tag && <span className="rounded-full bg-[#3bd16f] px-2 py-px text-[10px] font-bold text-navy">{item.tag}</span>}
      </Link>
    )
  }
  return (
    <div className="flex h-full flex-col bg-navy text-white">
      <div className={cx('flex items-center pt-6', collapsed ? 'justify-center px-2' : 'justify-between px-6')}>
        <Link to="/app" onClick={onNavigate} className="flex items-center gap-2.5" aria-label="eqoto home">
          <LogoMark size={30} />
          {!collapsed && <span className="text-[26px] font-bold tracking-[-0.04em] text-white">eqoto<span className="text-[#6dff8a]">.</span></span>}
        </Link>
      </div>
      <div className={cx('mt-7 flex-1 overflow-y-auto pb-4', collapsed ? 'px-2' : 'px-6')}>
        {!collapsed && <AccountSwitcher />}
        <div className={cx('mt-5 flex items-center gap-3', collapsed && 'justify-center')}>
          <Avatar name={profile?.full_name || profile?.email} size={collapsed ? 36 : 50} className="!rounded-md" />
          {!collapsed && <p className="truncate text-[17px] font-semibold">{profile?.full_name || 'Your account'}</p>}
        </div>
        {!collapsed && (
          <div className="mt-4">
            <p className="text-[13px] font-medium text-white/85">{percent}% Complete</p>
            <ProgressBar value={percent} className="mt-1.5 !bg-white/15 [&>div]:!bg-azure" />
            <Link to="/app/verification" onClick={onNavigate} className="mt-2 block text-[15px] text-white/85 hover:text-white">{percent >= 100 ? 'Profile verified' : 'Complete Profile'}</Link>
          </div>
        )}
        <nav className={cx('mt-6 space-y-0.5', collapsed && 'mt-5')} aria-label="Main">{MAIN.map((i) => <Item key={i.to} item={i} />)}</nav>
        {!collapsed && <p className="mb-1 mt-7 px-3 text-[13px] font-semibold text-white/90">More</p>}
        <nav className={cx('space-y-0.5', collapsed && 'mt-4 border-t border-white/10 pt-4')} aria-label="More">
          {MORE.map((i) => <Item key={i.to} item={i} />)}
          {isAdmin && <Item item={{ to: '/admin', label: 'Admin panel', icon: I.DashI, tag: 'Staff' }} />}
          <button onClick={async () => { await signOut(); nav('/') }} title="Logout" className={cx('flex w-full items-center gap-3 rounded-md py-[9px] text-[15px] text-white/75 transition hover:bg-white/5 hover:text-white', collapsed ? 'justify-center' : 'px-3')}>
            <I.LogoutI size={19} />{!collapsed && 'Logout'}
          </button>
        </nav>
      </div>
      <div className={cx('pb-6 pt-3', collapsed ? 'px-2' : 'px-6')}>
        <Btn variant="blue" className="w-full !rounded-md" size="lg" onClick={() => { nav('/app/wallet?tab=deposit'); onNavigate?.() }}>{collapsed ? <I.PlusI size={20} /> : 'Deposit Funds'}</Btn>
      </div>
    </div>
  )
}

function SearchBox() {
  const { list, change } = useMarket()
  const { open } = useTrade()
  const [q, setQ] = useState('')
  const [focus, setFocus] = useState(false)
  const results = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return []
    return list.filter((i) => i.symbol.toLowerCase().includes(s) || i.name.toLowerCase().includes(s)).slice(0, 7)
  }, [q, list])
  return (
    <div className="relative w-full max-w-[380px]">
      <I.SearchI size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-soft" />
      <input value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => setFocus(true)} onBlur={() => setTimeout(() => setFocus(false), 150)} placeholder="Search stocks, ETFs, crypto" aria-label="Search markets" className="h-10 w-full rounded-md bg-canvas pl-10 pr-3 text-[14.5px] text-fg outline-none placeholder:text-soft focus:ring-2 focus:ring-azure/40" />
      {focus && q && (
        <ul className="absolute inset-x-0 top-full z-40 mt-1.5 max-h-[360px] overflow-y-auto rounded-xl border border-line bg-card py-1 shadow-xl">
          {results.length === 0 && <li className="px-4 py-3 text-[14px] text-soft">No matches for “{q}”.</li>}
          {results.map((i) => (
            <li key={i.symbol}>
              <button onMouseDown={() => { open(i.symbol); setQ('') }} className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-canvas">
                <InstrumentMark symbol={i.symbol} size={30} />
                <span className="min-w-0 flex-1"><span className="block text-[14px] font-semibold text-fg">{i.symbol}</span><span className="block truncate text-[12px] text-soft">{i.name}</span></span>
                <span className={cx('text-[12.5px] font-semibold', change(i.symbol) >= 0 ? 'text-[#13a24d]' : 'text-[#e5484d]')}>{pct(change(i.symbol))}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Popover({ button, children, label }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const h = (e) => !ref.current?.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <div ref={ref} className="relative">
      <button aria-label={label} aria-expanded={open} onClick={() => setOpen(!open)} className="relative grid h-10 w-10 place-items-center rounded-full text-fg transition hover:bg-canvas">{button}</button>
      {open && <div className="absolute right-0 top-full z-40 mt-2 w-[min(92vw,380px)] overflow-hidden rounded-xl border border-line bg-card shadow-2xl">{typeof children === 'function' ? children(() => setOpen(false)) : children}</div>}
    </div>
  )
}

function Notifications() {
  const { user } = useAuth()
  const ui = useUi()
  const q = useQuery(() => db.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(25), [user.id])
  useEffect(() => {
    const t = setInterval(q.reload, 60000)
    return () => clearInterval(t)
  }, [q.reload])
  const rows = q.data || []
  const unread = rows.filter((n) => !n.read).length
  const markAll = async () => {
    try {
      await db.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false)
      q.reload()
    } catch (e) {
      ui.err(e)
    }
  }
  return (
    <Popover label="Notifications" button={<><I.BellI size={21} />{unread > 0 && <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#e5484d] px-1 text-[10px] font-bold text-white">{unread}</span>}</>}>
      <div className="flex items-center justify-between border-b border-line px-4 py-3"><p className="text-[15px] font-semibold text-fg">Notifications</p>{unread > 0 && <button onClick={markAll} className="text-[13px] font-semibold text-azure hover:underline">Mark all as read</button>}</div>
      <ul className="max-h-[380px] divide-y divide-line overflow-y-auto">
        {rows.length === 0 && <li><Empty title="You are all caught up" text="New alerts about your account will show up here." /></li>}
        {rows.map((n) => (
          <li key={n.id} className={cx('px-4 py-3', !n.read && 'bg-azure/[.07]')}>
            <div className="flex items-start gap-2"><p className="flex-1 text-[14px] font-semibold text-fg">{n.title}</p><span className="shrink-0 text-[11.5px] text-soft">{timeAgo(n.created_at)}</span></div>
            {n.body && <p className="mt-0.5 text-[13px] leading-snug text-soft">{n.body}</p>}
          </li>
        ))}
      </ul>
    </Popover>
  )
}

function Pulse() {
  const { list, change } = useMarket()
  const sorted = [...list].sort((a, b) => change(b.symbol) - change(a.symbol))
  const up = sorted.slice(0, 3)
  const down = sorted.slice(-3).reverse()
  const { open } = useTrade()
  const Line = ({ i }) => (
    <button onClick={() => open(i.symbol)} className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-canvas">
      <InstrumentMark symbol={i.symbol} size={28} /><span className="flex-1 text-[14px] font-semibold text-fg">{i.symbol}</span>
      <span className={cx('text-[13px] font-semibold', change(i.symbol) >= 0 ? 'text-[#13a24d]' : 'text-[#e5484d]')}>{pct(change(i.symbol))}</span>
    </button>
  )
  return (
    <Popover label="Market pulse" button={<I.SparkleI size={21} className="text-[#13a24d]" />}>
      <div className="border-b border-line px-4 py-3"><p className="text-[15px] font-semibold text-fg">Market pulse</p><p className="text-[12.5px] text-soft">Today’s biggest movers on eqoto</p></div>
      <p className="px-4 pt-3 text-[11.5px] font-semibold uppercase tracking-wide text-soft">Top gainers</p>
      {up.map((i) => <Line key={i.symbol} i={i} />)}
      <p className="px-4 pt-3 text-[11.5px] font-semibold uppercase tracking-wide text-soft">Top decliners</p>
      {down.map((i) => <Line key={i.symbol} i={i} />)}
      <Link to="/app/pulse" className="mt-1 block border-t border-line px-4 py-3 text-center text-[13.5px] font-semibold text-azure hover:bg-canvas">Open full market view</Link>
    </Popover>
  )
}

export function AppShell({ children }) {
  const { session, booting, profile, signOut } = useAuth()
  const { path } = useRouter()
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('eqoto.nav') === '1' } catch { return false }
  })
  const [drawer, setDrawer] = useState(false)
  const nav = useNavigate()
  const ann = useQuery(() => db.from('platform_settings').select('announcement,announcement_active,trading_enabled').eq('id', 1).maybeSingle(), [])

  useEffect(() => {
    try { localStorage.setItem('eqoto.nav', collapsed ? '1' : '0') } catch { /* ignore */ }
  }, [collapsed])
  useEffect(() => setDrawer(false), [path])
  useEffect(() => {
    const s = profile?.settings || {}
    document.documentElement.classList.toggle('dark', !!s.dark)
    document.documentElement.classList.toggle('compact', !!s.compact)
    return () => document.documentElement.classList.remove('dark', 'compact')
  }, [profile])

  if (!session) return <Redirect to={`/login?next=${encodeURIComponent(path)}`} />
  if (booting || !profile) return <div className="grid min-h-screen place-items-center bg-canvas text-soft">Loading your dashboard…</div>
  if (profile.status === 'suspended')
    return (
      <div className="grid min-h-screen place-items-center bg-canvas p-6">
        <div className="max-w-[440px] rounded-2xl bg-card p-8 text-center shadow-xl">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#fde4e4] text-[#b63232]"><I.BanI size={28} /></span>
          <h1 className="mt-4 text-[22px] font-semibold text-fg">Your account is suspended</h1>
          <p className="mt-2 text-[14.5px] text-soft">Trading and transfers are disabled. Please contact support to find out more.</p>
          <Btn className="mt-6" variant="secondary" onClick={async () => { await signOut(); nav('/') }}>Log out</Btn>
        </div>
      </div>
    )

  return (
    <div className="flex min-h-screen bg-canvas text-fg">
      <aside className={cx('sticky top-0 hidden h-screen shrink-0 transition-[width] duration-200 lg:block', collapsed ? 'w-[76px]' : 'w-[300px]')}><Sidebar collapsed={collapsed} /></aside>
      {drawer && (
        <div className="fixed inset-0 z-[120] lg:hidden" onClick={() => setDrawer(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <aside className="absolute inset-y-0 left-0 w-[290px] max-w-[86vw]" onClick={(e) => e.stopPropagation()}><Sidebar onNavigate={() => setDrawer(false)} /></aside>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        {ann.data?.trading_enabled === false && <div className="bg-[#b63232] px-4 py-2 text-center text-[13.5px] font-medium text-white">Trading is temporarily paused. You can still view your portfolio.</div>}
        {ann.data?.announcement_active && ann.data.announcement && <div className="bg-navy px-4 py-2 text-center text-[13.5px] text-white/90">{ann.data.announcement}</div>}
        <header className="sticky top-0 z-30 flex h-[70px] items-center gap-3 border-b border-line bg-card px-4 sm:px-6">
          <button className="grid h-10 w-10 place-items-center rounded-full hover:bg-canvas lg:hidden" aria-label="Open menu" onClick={() => setDrawer(true)}><I.MenuI size={22} /></button>
          <button className="hidden h-10 w-10 place-items-center rounded-full text-soft hover:bg-canvas lg:grid" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={() => setCollapsed(!collapsed)}><I.PanelLeftI size={20} className={collapsed ? 'rotate-180' : ''} /></button>
          <div className="flex flex-1 justify-center"><SearchBox /></div>
          <Pulse />
          <Notifications />
        </header>
        <main className="app-main mx-auto w-full max-w-[1120px] flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  )
}
