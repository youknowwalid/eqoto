import { useEffect } from 'react'
import { Router, useRouter, matchPath, Link, ParamsCtx } from './lib/router'
import { AuthProvider, MarketProvider, UiProvider } from './lib/store'
import Landing from './Landing'
import { Login, Signup } from './app/Auth'
import { AppShell } from './app/Shell'
import { TradeProvider } from './app/Trade'
import { AdminShell } from './admin/AdminShell'
import Home from './app/pages/Home'
import { Watchlist, Portfolio, Discover } from './app/pages/Markets'
import Wallet from './app/pages/Wallet'
import { InvestorsPage, Calendar, Club, Pulse } from './app/pages/Explore'
import Settings from './app/pages/Settings'
import Verification from './app/pages/Verification'
import Help, { TicketThread } from './app/pages/Support'
import { Academy, Article, Invite, Store } from './app/pages/Learn'
import Overview from './admin/Overview'
import Users from './admin/Users'
import { VerificationQueue, Transactions } from './admin/Queues'
import { MarketsAdmin, InvestorsAdmin } from './admin/Catalog'
import SupportAdmin from './admin/SupportAdmin'
import Content from './admin/Content'
import { Broadcast, PlatformSettings, Audit } from './admin/Platform'
import { Btn } from './app/ui'

const MEMBER = [
  ['/app', () => <Home />],
  ['/app/watchlist', () => <Watchlist />],
  ['/app/portfolio', () => <Portfolio />],
  ['/app/discover', () => <Discover />],
  ['/app/wallet', () => <Wallet />],
  ['/app/store', () => <Store />],
  ['/app/mirror', () => <InvestorsPage kind="investor" />],
  ['/app/agents', () => <InvestorsPage kind="agent" />],
  ['/app/calendar', () => <Calendar />],
  ['/app/club', () => <Club />],
  ['/app/invite', () => <Invite />],
  ['/app/settings', () => <Settings />],
  ['/app/settings/:section', () => <Settings />],
  ['/app/verification', () => <Verification />],
  ['/app/help', () => <Help />],
  ['/app/help/:id', () => <TicketThread />],
  ['/app/academy', () => <Academy />],
  ['/app/academy/:id', () => <Article />],
  ['/app/pulse', () => <Pulse />],
]
const ADMIN = [
  ['/admin', () => <Overview />],
  ['/admin/users', () => <Users />],
  ['/admin/verification', () => <VerificationQueue />],
  ['/admin/transactions', () => <Transactions />],
  ['/admin/markets', () => <MarketsAdmin />],
  ['/admin/investors', () => <InvestorsAdmin />],
  ['/admin/support', () => <SupportAdmin />],
  ['/admin/content', () => <Content />],
  ['/admin/notifications', () => <Broadcast />],
  ['/admin/settings', () => <PlatformSettings />],
  ['/admin/audit', () => <Audit />],
]

const TITLES = { '/login': 'Log in', '/signup': 'Create account' }

function NotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center p-6 text-center">
      <div>
        <p className="text-[64px] font-bold text-soft">404</p>
        <p className="mt-1 text-[18px] font-semibold text-fg">We couldn’t find that page</p>
        <Link to="/"><Btn className="mt-5">Back to eqoto</Btn></Link>
      </div>
    </div>
  )
}

function pick(table, path) {
  const clean = path.length > 1 ? path.replace(/\/+$/, '') : path
  for (const [pattern, render] of table) {
    const params = matchPath(pattern, clean)
    if (params) return { render, params }
  }
  return null
}

function Screen() {
  const { path } = useRouter()
  useEffect(() => {
    const area = path.startsWith('/admin') ? 'Admin' : path.startsWith('/app') ? 'Dashboard' : TITLES[path]
    document.title = area ? `${area} · eqoto` : 'eqoto | Invest with a front-row seat'
  }, [path])

  if (path === '/login') return <Login />
  if (path === '/signup') return <Signup />
  if (path.startsWith('/admin')) {
    const hit = pick(ADMIN, path)
    return (
      <MarketProvider>
        <AdminShell>{hit ? <ParamsCtx.Provider value={hit.params}>{hit.render()}</ParamsCtx.Provider> : <NotFound />}</AdminShell>
      </MarketProvider>
    )
  }
  if (path.startsWith('/app')) {
    const hit = pick(MEMBER, path)
    return (
      <MarketProvider>
        <TradeProvider>
          <AppShell>{hit ? <ParamsCtx.Provider value={hit.params}>{hit.render()}</ParamsCtx.Provider> : <NotFound />}</AppShell>
        </TradeProvider>
      </MarketProvider>
    )
  }
  if (path === '/') return <Landing />
  return <NotFound />
}

export default function App() {
  return (
    <Router>
      <UiProvider>
        <AuthProvider>
          <Screen />
        </AuthProvider>
      </UiProvider>
    </Router>
  )
}
