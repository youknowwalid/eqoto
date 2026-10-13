import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const RouterCtx = createContext({ path: '/', search: '', navigate: () => {} })

export function Router({ children }) {
  const [loc, setLoc] = useState({ path: window.location.pathname, search: window.location.search })

  const navigate = useCallback((to, { replace = false } = {}) => {
    const url = new URL(to, window.location.origin)
    if (url.origin !== window.location.origin) {
      window.location.href = to
      return
    }
    const next = url.pathname + url.search + url.hash
    if (next !== window.location.pathname + window.location.search + window.location.hash) {
      window.history[replace ? 'replaceState' : 'pushState']({}, '', next)
    }
    setLoc({ path: url.pathname, search: url.search })
    if (url.hash) {
      setTimeout(() => document.getElementById(url.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 30)
    } else {
      window.scrollTo(0, 0)
    }
  }, [])

  useEffect(() => {
    const onPop = () => setLoc({ path: window.location.pathname, search: window.location.search })
    // Turn ordinary same-site links into in-app navigation
    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = e.target.closest?.('a[href]')
      if (!a || a.target || a.hasAttribute('download')) return
      const href = a.getAttribute('href')
      if (!href || href.startsWith('#') && window.location.pathname === '/' ) return
      if (!href.startsWith('/')) return
      e.preventDefault()
      navigate(href)
    }
    window.addEventListener('popstate', onPop)
    document.addEventListener('click', onClick)
    return () => {
      window.removeEventListener('popstate', onPop)
      document.removeEventListener('click', onClick)
    }
  }, [navigate])

  const value = useMemo(() => ({ path: loc.path, search: loc.search, navigate }), [loc, navigate])
  return <RouterCtx.Provider value={value}>{children}</RouterCtx.Provider>
}

export const useRouter = () => useContext(RouterCtx)
export const useNavigate = () => useContext(RouterCtx).navigate
export const useSearchParams = () => {
  const { search } = useContext(RouterCtx)
  return useMemo(() => new URLSearchParams(search), [search])
}

/** "/app/settings/:section" style matching. Returns params or null. */
export function matchPath(pattern, path) {
  const a = pattern.split('/').filter(Boolean)
  const b = path.split('/').filter(Boolean)
  if (a.length !== b.length) return null
  const params = {}
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith(':')) params[a[i].slice(1)] = decodeURIComponent(b[i])
    else if (a[i] !== b[i]) return null
  }
  return params
}

export function Link({ to, className, children, ...rest }) {
  return (
    <a href={to} className={className} {...rest}>
      {children}
    </a>
  )
}

export function Redirect({ to }) {
  const { navigate } = useRouter()
  useEffect(() => navigate(to, { replace: true }), [to, navigate])
  return null
}

export const ParamsCtx = createContext({})
export const useParams = () => useContext(ParamsCtx)
