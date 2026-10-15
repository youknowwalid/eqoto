import { useEffect, useState } from 'react'
import { LogoMark } from '../components/Logo'
import { rpc } from '../lib/supabase'
import { useAuth, useQuery } from '../lib/store'
import { Link, Redirect, useNavigate, useRouter } from '../lib/router'
import { cx } from '../lib/format'
import { Avatar, Badge, Btn } from '../app/ui'
import * as I from '../app/icons'

const NAV = [
  { to: '/admin', label: 'Overview', icon: I.HomeI, exact: true },
  { to: '/admin/users', label: 'Users', icon: I.UsersI },
  { to: '/admin/verification', label: 'Verification', icon: I.ShieldI, badge: 'kyc_pending' },
  { to: '/admin/transactions', label: 'Transactions', icon: I.ArrowsI, badge: 'queue' },
  { to: '/admin/markets', label: 'Markets', icon: I.CandlesI },
  { to: '/admin/investors', label: 'Investors', icon: I.MirrorI },
  { to: '/admin/support', label: 'Support', icon: I.LifebuoyI, badge: 'open_tickets' },
  { to: '/admin/content', label: 'Content', icon: I.BookI },
  { to: '/admin/notifications', label: 'Notifications', icon: I.MegaphoneI },
  { to: '/admin/settings', label: 'Platform settings', icon: I.SlidersI },
  { to: '/admin/audit', label: 'Audit log', icon: I.ListI },
]

function Sidebar({ stats, onNavigate }) {
  const { path } = useRouter()
  const { profile, signOut } = useAuth()
  const nav = useNavigate()
  const count = (b) => (b === 'queue' ? (stats?.pending_deposits?.n || 0) + (stats?.pending_withdrawals?.n || 0) : stats?.[b] || 0)
  return (
    <div className="flex h-full flex-col bg-navy text-white">
      <div className="flex h-[70px] items-center gap-2.5 px-5"><LogoMark size={30} /><span className="text-[19px] font-semibold tracking-tight">Finvero</span><Badge tone="violet" className="ml-1">Admin</Badge></div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2" aria-label="Admin">
        {NAV.map((n) => {
          const on = n.exact ? path === n.to : path === n.to || path.startsWith(`${n.to}/`)
          const c = n.badge ? count(n.badge) : 0
          return (
            <Link key={n.to} to={n.to} onClick={onNavigate} className={cx('flex h-11 items-center gap-3 rounded-lg px-3 text-[14.5px] font-medium transition', on ? 'bg-white/12 text-white' : 'text-white/75 hover:bg-white/8 hover:text-white')} aria-current={on ? 'page' : undefined}>
              <n.icon size={19} /><span className="flex-1">{n.label}</span>
              {c > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#e5484d] px-1.5 text-[11px] font-bold">{c}</span>}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-white/10 p-3">
        <Link to="/app" className="mb-2 flex h-10 items-center gap-3 rounded-lg px-3 text-[14px] text-white/75 hover:bg-white/8 hover:text-white"><I.ChevLeftI size={18} />Back to member view</Link>
        <div className="flex items-center gap-3 rounded-lg bg-navy-2 p-3"><Avatar name={profile?.full_name} size={34} /><div className="min-w-0 flex-1 leading-tight"><p className="truncate text-[13.5px] font-semibold">{profile?.full_name}</p><p className="truncate text-[11.5px] text-white/60">{profile?.email}</p></div><button aria-label="Log out" className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/10" onClick={async () => { await signOut(); nav('/') }}><I.LogoutI size={17} /></button></div>
      </div>
    </div>
  )
}

export function AdminShell({ children }) {
  const { session, booting, profile } = useAuth()
  const { path } = useRouter()
  const [drawer, setDrawer] = useState(false)
  const stats = useQuery(() => (profile?.role === 'admin' ? rpc('admin_stats') : null), [profile?.role])
  useEffect(() => setDrawer(false), [path])
  useEffect(() => {
    const t = setInterval(stats.reload, 45000)
    return () => clearInterval(t)
  }, [stats.reload])
  useEffect(() => {
    document.documentElement.classList.remove('dark')
  }, [])
  if (!session) return <Redirect to={`/login?next=${encodeURIComponent(path)}`} />
  if (booting || !profile) return <div className="grid min-h-screen place-items-center bg-canvas text-soft">Loading…</div>
  if (profile.role !== 'admin')
    return (
      <div className="grid min-h-screen place-items-center bg-canvas p-6">
        <div className="max-w-[420px] rounded-2xl bg-card p-8 text-center shadow-xl">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#fde4e4] text-[#b63232]"><I.ShieldAlertI size={28} /></span>
          <h1 className="mt-4 text-[22px] font-semibold text-fg">Admins only</h1>
          <p className="mt-2 text-[14.5px] text-soft">Your account does not have access to the admin panel.</p>
          <Link to="/app"><Btn className="mt-6">Go to my dashboard</Btn></Link>
        </div>
      </div>
    )
  const cur = NAV.find((n) => (n.exact ? path === n.to : path.startsWith(n.to)))
  return (
    <div className="flex min-h-screen bg-canvas text-fg">
      <aside className="sticky top-0 hidden h-screen w-[262px] shrink-0 lg:block"><Sidebar stats={stats.data} /></aside>
      {drawer && (
        <div className="fixed inset-0 z-[120] lg:hidden" onClick={() => setDrawer(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <aside className="absolute inset-y-0 left-0 w-[270px] max-w-[86vw]" onClick={(e) => e.stopPropagation()}><Sidebar stats={stats.data} onNavigate={() => setDrawer(false)} /></aside>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-[60px] items-center gap-3 border-b border-line bg-card px-4 sm:px-6">
          <button className="grid h-10 w-10 place-items-center rounded-full hover:bg-canvas lg:hidden" aria-label="Open menu" onClick={() => setDrawer(true)}><I.MenuI size={22} /></button>
          <p className="text-[15px] font-semibold text-fg">{cur?.label || 'Admin'}</p>
          <span className="ml-auto flex items-center gap-2 text-[12.5px] text-soft"><span className="h-2 w-2 rounded-full bg-[#3bd16f]" />Live data</span>
          <Btn size="sm" variant="secondary" onClick={stats.reload}><I.RefreshI size={14} />Refresh</Btn>
        </header>
        <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  )
}

export const useAdminStats = () => {
  const { profile } = useAuth()
  return useQuery(() => rpc('admin_stats'), [profile?.id])
}
