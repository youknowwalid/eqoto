import { useState } from 'react'
import Logo from '../components/Logo'
import { db } from '../lib/supabase'
import { useAuth, useQuery } from '../lib/store'
import { useNavigate, useSearchParams, Link } from '../lib/router'
import { Btn, Field, Input, Select } from './ui'
import { ShieldI, TrendUpI, UsersI } from './icons'

const COUNTRIES = ['United States', 'United Kingdom', 'Ireland', 'Canada', 'Australia', 'Germany', 'France', 'Spain', 'Italy', 'Netherlands', 'Sweden', 'Norway', 'Denmark', 'Poland', 'Bulgaria', 'Brazil', 'Nigeria', 'South Africa', 'India', 'Bangladesh', 'Pakistan', 'Singapore', 'Japan', 'United Arab Emirates', 'Jordan', 'Other']

function Frame({ title, sub, children, footer }) {
  return (
    <div className="grid min-h-screen bg-ink text-cream lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex flex-col px-5 py-8 sm:px-10">
        <Logo href="/" />
        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-10">
          <h1 className="text-[34px] font-bold leading-tight tracking-[-0.03em]">{title}</h1>
          <p className="mt-2 text-[15.5px] text-mute">{sub}</p>
          <div className="mt-8 text-fg [&_label>span:first-child]:text-cream/90">{children}</div>
          <div className="mt-6 text-[14.5px] text-mute">{footer}</div>
        </div>
        <p className="text-[12.5px] text-mute/80">eqoto is a demonstration brand. Balances, prices and returns are simulated.</p>
      </div>
      <aside className="relative hidden overflow-hidden lg:block" style={{ background: 'radial-gradient(120% 90% at 80% 10%,#1d4a38 0%,#112018 45%,#0c0f0b 100%)' }}>
        <div className="absolute inset-0 opacity-[.18]" style={{ backgroundImage: 'radial-gradient(#6dff8a 1px,transparent 1px)', backgroundSize: '26px 26px' }} />
        <div className="relative flex h-full flex-col justify-center gap-6 px-14">
          <h2 className="max-w-[460px] text-[42px] font-bold leading-[1.05] tracking-[-0.04em]">Invest your way, with the people and tools you trust.</h2>
          {[
            [UsersI, 'Mirror verified investors', 'Allocate to someone whose results you respect and let their moves become yours.'],
            [TrendUpI, 'Practice with a demo account', 'Every account comes with $100,000 of virtual funds to learn risk-free.'],
            [ShieldI, 'Verified and transparent', 'Fees are listed in plain numbers and every transaction is on your record.'],
          ].map(([I, t, d]) => (
            <div key={t} className="flex max-w-[480px] gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-neon-deep text-neon"><I size={24} /></span>
              <div><p className="text-[17px] font-semibold">{t}</p><p className="text-[14.5px] leading-snug text-mute">{d}</p></div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  )
}

const dark = 'h-12 !rounded-xl !border-white/15 !bg-white/[.06] !text-cream placeholder:!text-mute/60 focus:!border-neon focus:!ring-neon/20'

export function Login() {
  const { signIn } = useAuth()
  const nav = useNavigate()
  const sp = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await signIn(email, password)
      nav(sp.get('next') || '/app', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <Frame title="Welcome back" sub="Log in to your eqoto account." footer={<>New to eqoto? <Link to="/signup" className="font-semibold text-neon hover:underline">Create an account</Link></>}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Email"><Input className={dark} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></Field>
        <Field label="Password"><Input className={dark} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" /></Field>
        {error && <p role="alert" className="rounded-lg bg-[#c0392b]/20 px-3 py-2 text-[13.5px] text-[#ffb4ab]">{error}</p>}
        <Btn type="submit" size="lg" loading={busy} className="w-full !bg-neon !text-ink hover:!bg-[#8affa1]" disabled={!email || !password}>Log in</Btn>
      </form>
    </Frame>
  )
}

export function Signup() {
  const { signUp } = useAuth()
  const nav = useNavigate()
  const sp = useSearchParams()
  const open = useQuery(() => db.from('platform_settings').select('signups_enabled').eq('id', 1).maybeSingle(), [])
  const [f, setF] = useState({ fullName: '', email: '', password: '', country: 'United States', agree: false })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const closed = open.data && open.data.signups_enabled === false
  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (f.fullName.trim().length < 2) return setError('Please enter your full name.')
    if (f.password.length < 8) return setError('Your password needs at least 8 characters.')
    setBusy(true)
    try {
      await signUp({ email: f.email, password: f.password, fullName: f.fullName.trim(), country: f.country, ref: sp.get('ref') || undefined })
      nav('/app', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <Frame title="Create your account" sub="It takes a minute. You will get a $100,000 demo account straight away." footer={<>Already have an account? <Link to="/login" className="font-semibold text-neon hover:underline">Log in</Link></>}>
      {closed ? (
        <p className="rounded-xl bg-white/[.06] p-4 text-[15px] text-cream">New registrations are temporarily closed. Please check back soon.</p>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field label="Full name"><Input className={dark} autoComplete="name" value={f.fullName} onChange={set('fullName')} placeholder="Alex Morgan" /></Field>
          <Field label="Email"><Input className={dark} type="email" autoComplete="email" value={f.email} onChange={set('email')} placeholder="you@example.com" /></Field>
          <Field label="Password" hint={<span className="text-mute">At least 8 characters.</span>}><Input className={dark} type="password" autoComplete="new-password" value={f.password} onChange={set('password')} placeholder="Choose a password" /></Field>
          <Field label="Country"><Select className={dark} value={f.country} onChange={set('country')}>{COUNTRIES.map((c) => <option key={c} className="text-black">{c}</option>)}</Select></Field>
          <label className="flex items-start gap-3 text-[13.5px] text-mute"><input type="checkbox" checked={f.agree} onChange={set('agree')} className="mt-1 h-4 w-4 accent-[#6dff8a]" />I understand eqoto is a demonstration platform and that investing involves risk.</label>
          {sp.get('ref') && <p className="text-[13px] text-neon">Referral code applied: {sp.get('ref')}</p>}
          {error && <p role="alert" className="rounded-lg bg-[#c0392b]/20 px-3 py-2 text-[13.5px] text-[#ffb4ab]">{error}</p>}
          <Btn type="submit" size="lg" loading={busy} disabled={!f.agree || !f.email || !f.password} className="w-full !bg-neon !text-ink hover:!bg-[#8affa1]">Create account</Btn>
        </form>
      )}
    </Frame>
  )
}
