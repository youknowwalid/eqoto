import { useEffect, useState } from 'react'
import { auth, db, rpc } from '../../lib/supabase'
import { useAuth, useMarket, useQuery, useUi } from '../../lib/store'
import { Link, useNavigate, useParams } from '../../lib/router'
import { cx, date, download, money } from '../../lib/format'
import { Badge, Btn, Card, CardTitle, Empty, Field, Input, PageHead, ProgressBar, Select, Toggle, statusTone } from '../ui'
import { useVerification } from '../shared'
import * as I from '../icons'

export const COUNTRIES = ['United Kingdom', 'United States', 'Germany', 'France', 'Spain', 'Italy', 'Netherlands', 'Ireland', 'Poland', 'Portugal', 'Sweden', 'Norway', 'Denmark', 'Switzerland', 'Austria', 'Belgium', 'Canada', 'Australia', 'New Zealand', 'Singapore', 'United Arab Emirates', 'India', 'South Africa', 'Brazil', 'Mexico', 'Japan']

const TILES = [
  { to: 'display', icon: I.MonitorI, title: 'Display', text: 'Theme, language and currency' },
  { to: 'account', icon: I.UserI, title: 'Account', text: 'Personal details and password' },
  { to: 'trading', icon: I.CandlesI, title: 'Trading', text: 'Order defaults and confirmations' },
  { to: 'notifications', icon: I.BellRingI, title: 'Notifications', text: 'Choose what we tell you about' },
  { to: 'privacy', icon: I.LockEyeI, title: 'Privacy and Blocking', text: 'Visibility, blocked investors, your data' },
  { to: 'recurring', icon: I.RefreshI, title: 'Recurring Orders', text: 'Saved plans you can run in one click' },
]

export default function Settings() {
  const params = useParams()
  const section = params.section
  const { percent, status } = useVerification()
  const nav = useNavigate()
  const cur = TILES.find((t) => t.to === section)
  if (section && !cur) return <Empty title="Page not found" action={<Link to="/app/settings"><Btn>Back to settings</Btn></Link>} />
  if (cur) {
    const Page = { display: Display, account: Account, trading: Trading, notifications: Notifs, privacy: Privacy, recurring: Recurring }[section]
    return (
      <>
        <button onClick={() => nav('/app/settings')} className="mb-3 inline-flex items-center gap-1 text-[14px] font-semibold text-azure hover:underline"><I.ChevLeftI size={17} />Settings</button>
        <PageHead title={cur.title} sub={cur.text} />
        <Page />
      </>
    )
  }
  return (
    <>
      <PageHead title="Settings" />
      <Link to="/app/verification" className="mb-5 flex items-center gap-4 rounded-xl border border-line bg-card p-5 transition hover:shadow-md">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-soft text-brand-dark"><I.ShieldI size={24} /></span>
        <span className="min-w-0 flex-1"><span className="flex items-center gap-2 text-[17px] font-semibold text-fg">Verification Centre <Badge tone={statusTone(status)}>{status}</Badge></span><ProgressBar value={percent} className="mt-2.5 max-w-[320px]" /><span className="mt-1 block text-[13px] text-soft">{percent}% complete</span></span>
        <I.ChevRightI className="text-soft" />
      </Link>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TILES.map((t) => (
          <Link key={t.to} to={`/app/settings/${t.to}`} className="group flex flex-col items-start gap-3 rounded-xl border border-line bg-card p-6 transition hover:-translate-y-0.5 hover:shadow-md">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-canvas text-fg transition group-hover:bg-brand-soft group-hover:text-brand-dark"><t.icon size={24} /></span>
            <span><span className="block text-[16.5px] font-semibold text-fg">{t.title}</span><span className="mt-0.5 block text-[13.5px] text-soft">{t.text}</span></span>
          </Link>
        ))}
      </div>
    </>
  )
}

const ToggleRow = ({ title, text, checked, onChange }) => (
  <div className="flex items-center gap-4 border-b border-line py-4 last:border-0"><div className="min-w-0 flex-1"><p className="text-[14.5px] font-semibold text-fg">{title}</p>{text && <p className="text-[13px] text-soft">{text}</p>}</div><Toggle checked={!!checked} onChange={onChange} label={title} /></div>
)

function useSettings() {
  const { profile, updateSettings, updateProfile } = useAuth()
  const ui = useUi()
  const s = profile.settings || {}
  const set = async (patch, msg) => {
    try {
      await updateSettings(patch)
      if (msg) ui.ok(msg)
    } catch (e) {
      ui.err(e)
    }
  }
  return { s, set, profile, updateProfile, ui }
}

function Display() {
  const { s, set, profile, updateProfile, ui } = useSettings()
  const save = async (patch) => {
    try {
      await updateProfile(patch)
      ui.ok('Saved')
    } catch (e) {
      ui.err(e)
    }
  }
  return (
    <Card>
      <ToggleRow title="Dark mode" text="Easier on the eyes in low light." checked={s.dark} onChange={(v) => set({ dark: v })} />
      <ToggleRow title="Compact layout" text="Tighter spacing so more fits on screen." checked={s.compact} onChange={(v) => set({ compact: v })} />
      <div className="grid gap-4 pt-5 sm:grid-cols-2">
        <Field label="Language"><Select value={profile.language} onChange={(e) => save({ language: e.target.value })}>{['English', 'Deutsch', 'Español', 'Français', 'Italiano', 'Português'].map((l) => <option key={l}>{l}</option>)}</Select></Field>
        <Field label="Display currency" hint="Balances are held in USD. This is a label for reports."><Select value={profile.currency} onChange={(e) => save({ currency: e.target.value })}>{['USD', 'EUR', 'GBP'].map((l) => <option key={l}>{l}</option>)}</Select></Field>
      </div>
    </Card>
  )
}

function Account() {
  const { user, profile, updateProfile } = useAuth()
  const ui = useUi()
  const [f, setF] = useState({ full_name: profile.full_name || '', username: profile.username || '', dob: profile.dob || '', country: profile.country || '', city: profile.city || '', address: profile.address || '', phone: profile.phone || '' })
  const [busy, setBusy] = useState(false)
  const [pw, setPw] = useState({ a: '', b: '' })
  const [pwBusy, setPwBusy] = useState(false)
  const on = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const save = async () => {
    if (f.full_name.trim().length < 2) return ui.err('Please enter your full name')
    setBusy(true)
    try {
      await updateProfile({ ...f, username: f.username.trim() || null, dob: f.dob || null })
      ui.ok('Details saved')
    } catch (e) {
      ui.err(/duplicate|unique/i.test(e.message) ? 'That username is already taken' : e)
    } finally {
      setBusy(false)
    }
  }
  const changePw = async () => {
    if (pw.a.length < 8) return ui.err('Use at least 8 characters')
    if (pw.a !== pw.b) return ui.err('The two passwords do not match')
    setPwBusy(true)
    try {
      await auth.updatePassword(pw.a)
      setPw({ a: '', b: '' })
      ui.ok('Password updated')
    } catch (e) {
      ui.err(e)
    } finally {
      setPwBusy(false)
    }
  }
  return (
    <div className="space-y-5">
      <Card>
        <CardTitle title="Personal details" sub="Used for verification. Keep them accurate." />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name"><Input value={f.full_name} onChange={on('full_name')} autoComplete="name" /></Field>
          <Field label="Username" hint="Letters, numbers and underscores."><Input value={f.username} onChange={on('username')} maxLength={24} /></Field>
          <Field label="Email" hint="Contact support to change your email."><Input value={user.email} disabled /></Field>
          <Field label="Phone"><Input value={f.phone} onChange={on('phone')} placeholder="+44 7700 900123" autoComplete="tel" /></Field>
          <Field label="Date of birth"><Input type="date" value={f.dob} onChange={on('dob')} max={new Date(Date.now() - 18 * 31557600000).toISOString().slice(0, 10)} /></Field>
          <Field label="Country"><Select value={f.country} onChange={on('country')}><option value="">Select…</option>{COUNTRIES.map((c) => <option key={c}>{c}</option>)}</Select></Field>
          <Field label="City"><Input value={f.city} onChange={on('city')} autoComplete="address-level2" /></Field>
          <Field label="Street address"><Input value={f.address} onChange={on('address')} autoComplete="street-address" /></Field>
        </div>
        <Btn className="mt-5" loading={busy} onClick={save}>Save changes</Btn>
      </Card>
      <Card>
        <CardTitle title="Change password" />
        <div className="grid max-w-[560px] gap-4 sm:grid-cols-2">
          <Field label="New password"><Input type="password" value={pw.a} onChange={(e) => setPw({ ...pw, a: e.target.value })} autoComplete="new-password" /></Field>
          <Field label="Repeat password"><Input type="password" value={pw.b} onChange={(e) => setPw({ ...pw, b: e.target.value })} autoComplete="new-password" /></Field>
        </div>
        <Btn className="mt-5" variant="secondary" loading={pwBusy} onClick={changePw}>Update password</Btn>
      </Card>
    </div>
  )
}

function Trading() {
  const { s, set } = useSettings()
  return (
    <Card>
      <ToggleRow title="Confirm before placing orders" text="Show a review step every time." checked={s.confirm_orders !== false} onChange={(v) => set({ confirm_orders: v })} />
      <ToggleRow title="Start on the demo account" text="Open eqoto in the virtual account after you sign in." checked={s.start_demo} onChange={(v) => set({ start_demo: v })} />
      <ToggleRow title="Show prices with full precision" text="Four decimals instead of two on low-priced assets." checked={s.precise} onChange={(v) => set({ precise: v })} />
      <div className="grid gap-4 pt-5 sm:grid-cols-2">
        <Field label="Default order amount (USD)"><Input type="number" min="1" defaultValue={s.default_amount || 250} onBlur={(e) => set({ default_amount: Math.max(1, Number(e.target.value) || 250) }, 'Default amount saved')} /></Field>
      </div>
    </Card>
  )
}

const NOTIF = [
  ['n_trades', 'Order and mirror updates', 'When orders fill or a mirror starts or stops.'],
  ['n_money', 'Deposits and withdrawals', 'When a request is approved or declined.'],
  ['n_verification', 'Verification progress', 'Document reviews and account status.'],
  ['n_price', 'Market movers', 'Big moves in your watchlist.'],
  ['n_news', 'Product news', 'New features and the occasional tip.'],
]
function Notifs() {
  const { s, set } = useSettings()
  return (
    <Card>
      {NOTIF.map(([k, t, d]) => <ToggleRow key={k} title={t} text={d} checked={s[k] !== false} onChange={(v) => set({ [k]: v })} />)}
      <p className="pt-4 text-[13px] text-soft">Important security and account messages are always sent.</p>
    </Card>
  )
}

function Privacy() {
  const { s, set, ui } = useSettings()
  const { user, profile } = useAuth()
  const inv = useQuery(() => db.from('investors').select('id,name,handle').eq('active', true).order('name'), [])
  const blocked = s.blocked || []
  const [pick, setPick] = useState('')
  const exportData = async () => {
    try {
      const [accounts, tx, positions, copies, watch] = await Promise.all([
        db.from('accounts').select('*'),
        db.from('transactions').select('*').order('created_at'),
        db.from('positions').select('*'),
        db.from('copies').select('*'),
        db.from('watchlist').select('*'),
      ])
      download('eqoto-my-data.json', JSON.stringify({ exported_at: new Date().toISOString(), profile, accounts, transactions: tx, positions, copies, watchlist: watch }, null, 2), 'application/json')
    } catch (e) {
      ui.err(e)
    }
  }
  return (
    <div className="space-y-5">
      <Card>
        <ToggleRow title="Show my username to other members" text="Used on leaderboards and referrals." checked={s.show_username !== false} onChange={(v) => set({ show_username: v })} />
        <ToggleRow title="Personalised tips" text="Use your activity to suggest instruments." checked={s.personalised !== false} onChange={(v) => set({ personalised: v })} />
      </Card>
      <Card>
        <CardTitle title="Blocked investors" sub="They will not appear in Discover or Mirror Pro Investors for you." />
        <div className="flex gap-2"><Select value={pick} onChange={(e) => setPick(e.target.value)} aria-label="Investor to block"><option value="">Choose an investor…</option>{(inv.data || []).filter((i) => !blocked.includes(i.id)).map((i) => <option key={i.id} value={i.id}>{i.name} (@{i.handle})</option>)}</Select><Btn variant="secondary" disabled={!pick} onClick={() => { set({ blocked: [...blocked, pick] }, 'Investor blocked'); setPick('') }}>Block</Btn></div>
        {blocked.length === 0 ? <p className="mt-4 text-[14px] text-soft">You have not blocked anyone.</p> : <ul className="mt-4 divide-y divide-line">{blocked.map((id) => { const i = (inv.data || []).find((x) => x.id === id); return <li key={id} className="flex items-center justify-between py-2.5 text-[14.5px]"><span className="font-medium text-fg">{i ? `${i.name} (@${i.handle})` : 'Unavailable investor'}</span><Btn size="sm" variant="secondary" onClick={() => set({ blocked: blocked.filter((x) => x !== id) }, 'Unblocked')}>Unblock</Btn></li> })}</ul>}
      </Card>
      <Card>
        <CardTitle title="Your data" sub={`Account created ${date(profile.created_at)}.`} />
        <Btn variant="secondary" onClick={exportData}><I.DownloadI size={16} />Download my data (JSON)</Btn>
      </Card>
    </div>
  )
}

function Recurring() {
  const { s, set, ui } = useSettings()
  const { list } = useMarket()
  const { account, refresh, kind } = useAuth()
  const plans = s.recurring || []
  const [f, setF] = useState({ symbol: 'AAPL', amount: '100', every: 'Weekly' })
  const [busy, setBusy] = useState(null)
  const add = () => {
    if (!(Number(f.amount) > 0)) return ui.err('Enter an amount')
    set({ recurring: [...plans, { id: String(Date.now()), ...f, amount: Number(f.amount), created: new Date().toISOString() }] }, 'Plan saved')
  }
  const run = async (p) => {
    setBusy(p.id)
    try {
      await rpc('place_order', { p_account: account.id, p_symbol: p.symbol, p_side: 'buy', p_amount: p.amount })
      await set({ recurring: plans.map((x) => (x.id === p.id ? { ...x, last_run: new Date().toISOString() } : x)) })
      await refresh()
      ui.ok(`Bought ${money(p.amount)} of ${p.symbol} on your ${kind === 'demo' ? 'demo' : 'main'} account`)
    } catch (e) {
      ui.err(e)
    } finally {
      setBusy(null)
    }
  }
  return (
    <div className="space-y-5">
      <Card>
        <CardTitle title="New plan" sub="Plans are saved to your profile. Press Run now whenever it is time to invest; orders are never placed automatically." />
        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="Instrument"><Select value={f.symbol} onChange={(e) => setF({ ...f, symbol: e.target.value })}>{list.map((i) => <option key={i.symbol} value={i.symbol}>{i.symbol} · {i.name}</option>)}</Select></Field>
          <Field label="Amount (USD)"><Input type="number" min="1" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>
          <Field label="Reminder"><Select value={f.every} onChange={(e) => setF({ ...f, every: e.target.value })}>{['Weekly', 'Every 2 weeks', 'Monthly'].map((x) => <option key={x}>{x}</option>)}</Select></Field>
          <div className="flex items-end"><Btn className="w-full" onClick={add}><I.PlusI size={16} />Save plan</Btn></div>
        </div>
      </Card>
      <Card pad={false}>
        {plans.length === 0 ? <Empty icon={I.RefreshI} title="No plans yet" text="Save a plan above to invest the same amount in one click." /> : (
          <ul className="divide-y divide-line">{plans.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-3 px-5 py-4"><div className="min-w-[160px] flex-1"><p className="text-[15px] font-semibold text-fg">{money(p.amount)} of {p.symbol}</p><p className="text-[13px] text-soft">{p.every}{p.last_run ? ` · last run ${date(p.last_run)}` : ' · not run yet'}</p></div><Btn size="sm" loading={busy === p.id} onClick={() => run(p)}>Run now</Btn><Btn size="sm" variant="secondary" onClick={() => set({ recurring: plans.filter((x) => x.id !== p.id) }, 'Plan removed')} aria-label="Delete plan"><I.TrashI size={15} /></Btn></li>
          ))}</ul>
        )}
      </Card>
    </div>
  )
}
