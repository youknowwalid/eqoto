// A tiny, dependency-free Supabase client (Auth + PostgREST + Storage + Functions).
import { SUPABASE_URL as URL_, SUPABASE_KEY as KEY } from './config'

const STORE = 'eqoto.session'
const listeners = new Set()
let session = read()

function read() {
  try {
    return JSON.parse(localStorage.getItem(STORE))
  } catch {
    return null
  }
}
function save(s) {
  session = s
  try {
    if (s) localStorage.setItem(STORE, JSON.stringify(s))
    else localStorage.removeItem(STORE)
  } catch {
    /* storage may be blocked */
  }
  listeners.forEach((f) => f(s))
}
export const onAuthChange = (f) => {
  listeners.add(f)
  return () => listeners.delete(f)
}
export const getSession = () => session

const toSession = (j) => ({
  access_token: j.access_token,
  refresh_token: j.refresh_token,
  expires_at: Math.floor(Date.now() / 1000) + (j.expires_in || 3600),
  user: j.user,
})

async function authCall(path, body, { method = 'POST', token } = {}) {
  const res = await fetch(`${URL_}/auth/v1${path}`, {
    method,
    headers: { apikey: KEY, 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const j = await res.json().catch(() => ({}))
  if (!res.ok) {
    const m = j.msg || j.error_description || j.message || j.error || `Request failed (${res.status})`
    throw new Error(m === 'Invalid login credentials' ? 'Incorrect email or password.' : m)
  }
  return j
}

let refreshing = null
async function freshToken() {
  if (!session) return null
  if (session.expires_at - 60 > Date.now() / 1000) return session.access_token
  refreshing ||= authCall('/token?grant_type=refresh_token', { refresh_token: session.refresh_token })
    .then((j) => save(toSession(j)))
    .catch(() => save(null))
    .finally(() => {
      refreshing = null
    })
  await refreshing
  return session?.access_token || null
}

export const auth = {
  async signIn(email, password) {
    save(toSession(await authCall('/token?grant_type=password', { email: email.trim(), password })))
  },
  async signUp({ email, password, fullName, country, ref }) {
    try {
      await authCall('/signup', { email: email.trim(), password, data: { full_name: fullName, country, ref: ref || '' } })
    } catch (e) {
      if (/already|registered/i.test(e.message)) throw new Error('An account with this email already exists. Try logging in.')
      if (/closed/i.test(e.message) || /Database error/i.test(e.message)) throw new Error('New sign-ups are temporarily closed.')
      throw e
    }
    await this.signIn(email, password)
  },
  async signOut() {
    const t = session?.access_token
    save(null)
    if (t) authCall('/logout', null, { token: t }).catch(() => {})
  },
  async updatePassword(password) {
    await authCall('/user', { password }, { method: 'PUT', token: await freshToken() })
  },
}

async function rest(path, { method = 'GET', body, prefer, count } = {}) {
  const t = await freshToken()
  const headers = { apikey: KEY, 'Content-Type': 'application/json' }
  if (t) headers.Authorization = `Bearer ${t}`
  const pref = [prefer, count ? 'count=exact' : ''].filter(Boolean).join(',')
  if (pref) headers.Prefer = pref
  const res = await fetch(`${URL_}/rest/v1/${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) {
    if (res.status === 401 && t) save(null)
    const e = new Error((data && (data.message || data.error)) || `Request failed (${res.status})`)
    e.code = data?.code
    throw e
  }
  let total = null
  const range = res.headers.get('content-range')
  if (range && range.includes('/')) total = Number(range.split('/')[1]) || 0
  return { data, total }
}

class Query {
  constructor(table) {
    this.table = table
    this.params = []
    this.method = 'GET'
    this.body = undefined
    this.prefer = ''
    this.wantCount = false
    this.single = false
  }
  select(cols = '*', opts = {}) {
    this.params.push(['select', cols])
    if (opts.count) this.wantCount = true
    if (this.method !== 'GET') this.prefer = 'return=representation'
    return this
  }
  insert(rows) {
    this.method = 'POST'
    this.body = rows
    this.prefer = 'return=minimal'
    return this
  }
  update(values) {
    this.method = 'PATCH'
    this.body = values
    this.prefer = 'return=minimal'
    return this
  }
  remove() {
    this.method = 'DELETE'
    this.prefer = 'return=minimal'
    return this
  }
  upsert(rows, onConflict) {
    this.method = 'POST'
    this.body = rows
    this.prefer = 'resolution=merge-duplicates,return=minimal'
    if (onConflict) this.params.push(['on_conflict', onConflict])
    return this
  }
  filter(col, op, val) {
    this.params.push([col, `${op}.${val}`])
    return this
  }
  eq(c, v) { return this.filter(c, 'eq', v) }
  neq(c, v) { return this.filter(c, 'neq', v) }
  gt(c, v) { return this.filter(c, 'gt', v) }
  gte(c, v) { return this.filter(c, 'gte', v) }
  lte(c, v) { return this.filter(c, 'lte', v) }
  ilike(c, v) { return this.filter(c, 'ilike', v) }
  in(c, vals) { return this.filter(c, 'in', `(${vals.join(',')})`) }
  or(expr) {
    this.params.push(['or', `(${expr})`])
    return this
  }
  order(col, { ascending = true } = {}) {
    this.params.push(['order', `${col}.${ascending ? 'asc' : 'desc'}`])
    return this
  }
  limit(n) {
    this.params.push(['limit', String(n)])
    return this
  }
  range(from, to) {
    this.params.push(['offset', String(from)], ['limit', String(to - from + 1)])
    return this
  }
  maybeSingle() {
    this.single = true
    return this
  }
  async run() {
    const qs = this.params.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')
    const { data, total } = await rest(`${this.table}${qs ? `?${qs}` : ''}`, {
      method: this.method,
      body: this.body,
      prefer: this.prefer,
      count: this.wantCount,
    })
    if (this.single) return Array.isArray(data) ? data[0] || null : data
    if (this.wantCount) return { rows: data || [], total: total ?? (data || []).length }
    return data
  }
  then(res, rej) {
    return this.run().then(res, rej)
  }
}

export const db = { from: (table) => new Query(table) }
export const rpc = async (fn, args = {}) => (await rest(`rpc/${fn}`, { method: 'POST', body: args })).data

export const storage = {
  async upload(bucket, path, file) {
    const t = await freshToken()
    const res = await fetch(`${URL_}/storage/v1/object/${bucket}/${path}`, {
      method: 'POST',
      headers: { apikey: KEY, Authorization: `Bearer ${t}`, 'Content-Type': file.type || 'application/octet-stream', 'x-upsert': 'false' },
      body: file,
    })
    const j = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(j.message || j.error || 'Upload failed')
  },
  async signedUrl(bucket, path, expiresIn = 300) {
    const t = await freshToken()
    const res = await fetch(`${URL_}/storage/v1/object/sign/${bucket}/${path}`, {
      method: 'POST',
      headers: { apikey: KEY, Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ expiresIn }),
    })
    const j = await res.json().catch(() => ({}))
    if (!res.ok || !j.signedURL) throw new Error('Preview unavailable')
    return `${URL_}/storage/v1${j.signedURL}`
  },
}
