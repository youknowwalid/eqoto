import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { auth, db, getSession, onAuthChange, rpc } from './supabase'

/* ───────────── data hook ───────────── */
export function useQuery(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const [tick, setTick] = useState(0)
  const alive = useRef(true)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])
  useEffect(() => {
    let on = true
    setState((s) => ({ ...s, loading: true, error: null }))
    Promise.resolve()
      .then(fn)
      .then((data) => on && setState({ data, loading: false, error: null }))
      .catch((error) => on && setState((s) => ({ data: s.data, loading: false, error })))
    return () => {
      on = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])
  const reload = useCallback(() => setTick((n) => n + 1), [])
  return { ...state, reload }
}

/* ───────────── auth + profile + accounts ───────────── */
const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(getSession())
  const [profile, setProfile] = useState(null)
  const [accounts, setAccounts] = useState([])
  const [booting, setBooting] = useState(!!getSession())
  const [kind, setKindState] = useState(() => {
    try {
      return localStorage.getItem('eqoto.acct') || 'real'
    } catch {
      return 'real'
    }
  })

  useEffect(
    () =>
      onAuthChange((s) => {
        setSession(s)
        if (!s) {
          setProfile(null)
          setAccounts([])
        }
      }),
    [],
  )

  const load = useCallback(async () => {
    const uid = getSession()?.user?.id
    if (!uid) return
    const [p, a] = await Promise.all([
      db.from('profiles').select('*').eq('id', uid).maybeSingle(),
      db.from('accounts').select('*').eq('user_id', uid),
    ])
    setProfile(p)
    setAccounts(a || [])
  }, [])

  const uid = session?.user?.id
  useEffect(() => {
    if (!uid) {
      setBooting(false)
      return
    }
    load()
      .catch(() => {})
      .finally(() => setBooting(false))
  }, [uid, load])

  const setKind = (k) => {
    setKindState(k)
    try {
      localStorage.setItem('eqoto.acct', k)
    } catch {
      /* ignore */
    }
  }

  const updateProfile = useCallback(
    async (patch) => {
      await db.from('profiles').update(patch).eq('id', getSession().user.id)
      await load()
    },
    [load],
  )
  const updateSettings = useCallback(
    async (patch) => {
      const next = { ...(profile?.settings || {}), ...patch }
      await updateProfile({ settings: next })
    },
    [profile, updateProfile],
  )

  const value = useMemo(() => {
    const real = accounts.find((a) => a.kind === 'real')
    const demo = accounts.find((a) => a.kind === 'demo')
    return {
      session,
      user: session?.user || null,
      profile,
      accounts,
      real,
      demo,
      account: (kind === 'demo' ? demo : real) || real || demo || null,
      kind,
      setKind,
      booting,
      isAdmin: profile?.role === 'admin',
      refresh: load,
      updateProfile,
      updateSettings,
      signIn: auth.signIn,
      signUp: auth.signUp,
      signOut: auth.signOut,
    }
  }, [session, profile, accounts, kind, booting, load, updateProfile, updateSettings])

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

/* ───────────── market data ───────────── */
const MarketCtx = createContext(null)
export const useMarket = () => useContext(MarketCtx)

export function MarketProvider({ children }) {
  const [list, setList] = useState([])
  const [spark, setSpark] = useState({})
  const [loaded, setLoaded] = useState(false)

  const refresh = useCallback(async () => {
    const rows = await db.from('instruments').select('*').order('symbol')
    setList(rows || [])
    setLoaded(true)
  }, [])

  const loadSpark = useCallback(async () => {
    const since = new Date(Date.now() - 7 * 86400000).toISOString()
    const rows = await db.from('price_history').select('symbol,price').gte('ts', since).order('ts').limit(6000)
    const m = {}
    ;(rows || []).forEach((r) => (m[r.symbol] ||= []).push(Number(r.price)))
    setSpark(m)
  }, [])

  useEffect(() => {
    refresh().catch(() => setLoaded(true))
    loadSpark().catch(() => {})
    const sp = setInterval(() => document.visibilityState === 'visible' && loadSpark().catch(() => {}), 90000)
    const poll = setInterval(() => document.visibilityState === 'visible' && refresh().catch(() => {}), 15000)
    const tick = () => {
      if (document.visibilityState === 'visible' && getSession()) rpc('tick_prices').catch(() => {})
    }
    const t0 = setTimeout(tick, 2500)
    const ticker = setInterval(tick, 50000)
    return () => {
      clearInterval(poll)
      clearInterval(sp)
      clearInterval(ticker)
      clearTimeout(t0)
    }
  }, [refresh, loadSpark])

  const value = useMemo(() => {
    const by = Object.fromEntries(list.map((i) => [i.symbol, i]))
    const change = (sym) => {
      const i = by[sym]
      if (!i) return 0
      const prev = Number(i.prev_close) || Number(i.price)
      return ((Number(i.price) - prev) / prev) * 100
    }
    return { list, by, spark, loaded, refresh, change }
  }, [list, spark, loaded, refresh])

  return <MarketCtx.Provider value={value}>{children}</MarketCtx.Provider>
}

const histCache = new Map()
/** Price history for a symbol. range: 1D | 1W | 1M | 3M */
export async function loadHistory(symbol, range = '1M') {
  const days = { '1D': 1, '1W': 7, '1M': 30, '3M': 90 }[range] || 30
  const key = `${symbol}:${range}`
  const hit = histCache.get(key)
  if (hit && Date.now() - hit.at < 20000) return hit.rows
  const since = new Date(Date.now() - days * 86400000).toISOString()
  const rows = await db.from('price_history').select('ts,price').eq('symbol', symbol).gte('ts', since).order('ts').limit(2000)
  const out = (rows || []).map((r) => ({ t: new Date(r.ts).getTime(), v: Number(r.price) }))
  histCache.set(key, { at: Date.now(), rows: out })
  return out
}

/* ───────────── toasts + confirm ───────────── */
const UiCtx = createContext(null)
export const useUi = () => useContext(UiCtx)

export function UiProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const [dialog, setDialog] = useState(null)
  const id = useRef(0)

  const push = useCallback((kind, text) => {
    const n = ++id.current
    setToasts((t) => [...t.slice(-3), { id: n, kind, text }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== n)), kind === 'err' ? 6000 : 3800)
  }, [])

  const value = useMemo(
    () => ({
      ok: (t) => push('ok', t),
      err: (e) => push('err', typeof e === 'string' ? e : e?.message || 'Something went wrong'),
      info: (t) => push('info', t),
      confirm: (opts) =>
        new Promise((resolve) => setDialog({ ...(typeof opts === 'string' ? { message: opts } : opts), resolve })),
    }),
    [push],
  )

  const close = (v) => {
    dialog?.resolve(v)
    setDialog(null)
  }

  return (
    <UiCtx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[300] flex w-[min(92vw,380px)] flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto animate-pop rounded-lg px-4 py-3 text-[14px] font-medium shadow-lg ${
              t.kind === 'err' ? 'bg-[#c0392b] text-white' : t.kind === 'ok' ? 'bg-[#13a24d] text-white' : 'bg-navy text-white'
            }`}
          >
            {t.text}
          </div>
        ))}
      </div>
      {dialog && (
        <div className="fixed inset-0 z-[250] grid place-items-center bg-black/50 p-4" onClick={() => close(false)}>
          <div role="alertdialog" aria-modal="true" className="w-full max-w-[420px] rounded-xl bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[18px] font-semibold text-fg">{dialog.title || 'Are you sure?'}</h3>
            <p className="mt-2 text-[14.5px] leading-relaxed text-soft">{dialog.message}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button className="h-10 rounded-full border border-line px-5 text-[14px] font-medium text-fg hover:bg-canvas" onClick={() => close(false)}>
                Cancel
              </button>
              <button
                autoFocus
                className={`h-10 rounded-full px-5 text-[14px] font-semibold text-white ${dialog.danger ? 'bg-[#d64545] hover:bg-[#bf3b3b]' : 'bg-brand hover:bg-brand-dark'}`}
                onClick={() => close(true)}
              >
                {dialog.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </UiCtx.Provider>
  )
}
