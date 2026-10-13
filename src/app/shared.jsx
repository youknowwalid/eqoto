import { useState } from 'react'
import { Avatar as Face } from '../components/Portrait'
import { investors as site } from '../content'
import { db, rpc } from '../lib/supabase'
import { useAuth, useMarket, useQuery, useUi } from '../lib/store'
import { cx, money, num, pct, price } from '../lib/format'
import { Badge, Btn, Field, Input, Modal } from './ui'
import { Sparkline } from './charts'
import { ShieldI } from './icons'

export function InstrumentMark({ symbol, size = 38 }) {
  const hue = [...symbol].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) % 360
  return (
    <span className="grid shrink-0 place-items-center rounded-full font-bold text-white" style={{ width: size, height: size, fontSize: size * 0.3, background: `linear-gradient(135deg,hsl(${hue} 55% 46%),hsl(${(hue + 40) % 360} 60% 36%))` }} aria-hidden="true">
      {symbol.slice(0, 2)}
    </span>
  )
}

export function InvestorFace({ look = 0, size = 44 }) {
  const l = site.list[look % site.list.length].look
  return <Face look={l} size={size} />
}

export function InstrumentRow({ ins, onOpen, right, className = '' }) {
  const { change, spark } = useMarket()
  const c = change(ins.symbol)
  return (
    <div className={cx('flex items-center gap-3 px-3 py-3 transition hover:bg-canvas', onOpen && 'cursor-pointer', className)} onClick={() => onOpen?.(ins.symbol)} role={onOpen ? 'button' : undefined} tabIndex={onOpen ? 0 : undefined} onKeyDown={(e) => e.key === 'Enter' && onOpen?.(ins.symbol)}>
      <InstrumentMark symbol={ins.symbol} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14.5px] font-semibold text-fg">{ins.symbol}</p>
        <p className="truncate text-[12.5px] text-soft">{ins.name}</p>
      </div>
      <div className="hidden sm:block"><Sparkline values={(spark[ins.symbol] || []).filter((_, i, a) => a.length < 60 || i % Math.ceil(a.length / 40) === 0)} /></div>
      <div className="w-[96px] text-right">
        <p className="text-[14.5px] font-semibold tabular-nums text-fg">{price(ins.price)}</p>
        <p className={cx('text-[12.5px] font-semibold tabular-nums', c >= 0 ? 'text-[#13a24d]' : 'text-[#e5484d]')}>{pct(c)}</p>
      </div>
      {right}
    </div>
  )
}

export function useVerification() {
  const { user, profile } = useAuth()
  const q = useQuery(() => (user ? db.from('kyc_documents').select('*').eq('user_id', user.id).order('created_at', { ascending: false }) : []), [user?.id])
  const docs = q.data || []
  const p = profile || {}
  const has = (t, st) => docs.some((d) => d.doc_type === t && (st ? st.includes(d.status) : true))
  const steps = [
    { key: 'account', label: 'Create your account', done: true },
    { key: 'personal', label: 'Personal details', done: !!(p.full_name && p.dob && p.country && p.address) },
    { key: 'contact', label: 'Contact number', done: !!p.phone },
    { key: 'questionnaire', label: 'Investor questionnaire', done: !!p.questionnaire },
    { key: 'documents', label: 'Identity and address documents', done: p.kyc_status === 'verified' || (has('id', ['pending', 'approved']) && has('address', ['pending', 'approved'])) },
  ]
  const percent = p.kyc_status === 'verified' ? 100 : Math.round((steps.filter((s) => s.done).length / steps.length) * 100)
  return { docs, steps, percent, reload: q.reload, loading: q.loading, status: p.kyc_status || 'unverified' }
}

export function MirrorModal({ investor, onClose, onDone }) {
  const { account, refresh, kind } = useAuth()
  const ui = useUi()
  const [amount, setAmount] = useState('500')
  const [busy, setBusy] = useState(false)
  const settings = useQuery(() => db.from('platform_settings').select('min_copy').eq('id', 1).maybeSingle(), [])
  if (!investor) return null
  const min = Number(settings.data?.min_copy ?? 200)
  const submit = async () => {
    setBusy(true)
    try {
      await rpc('start_copy', { p_investor: investor.id, p_account: account.id, p_amount: Number(amount) })
      ui.ok(`You are now mirroring ${investor.name}`)
      await refresh()
      onDone?.()
      onClose()
    } catch (e) {
      ui.err(e)
    } finally {
      setBusy(false)
    }
  }
  return (
    <Modal open onClose={onClose} title={`Mirror ${investor.name}`} sub={investor.kind === 'agent' ? 'AI portfolio' : `@${investor.handle} · ${investor.country}`} footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn loading={busy} onClick={submit}>Start mirroring</Btn></>}>
      <div className="flex items-center gap-4">
        <InvestorFace look={investor.look} size={56} />
        <div className="grid flex-1 grid-cols-3 gap-2 text-center">
          <div><p className="text-[17px] font-semibold text-[#13a24d]">{pct(investor.return_24m)}</p><p className="text-[12px] text-soft">Return (24M)</p></div>
          <div><p className="text-[17px] font-semibold text-fg">{investor.risk}/10</p><p className="text-[12px] text-soft">Risk score</p></div>
          <div><p className="text-[17px] font-semibold text-fg">{num(investor.copiers)}</p><p className="text-[12px] text-soft">Mirroring</p></div>
        </div>
      </div>
      <p className="mt-4 text-[13.5px] leading-relaxed text-soft">{investor.bio}</p>
      <Field label={`Amount to allocate (${kind === 'demo' ? 'demo account' : 'real account'})`} hint={`Minimum ${money(min)} · Available ${money(account?.balance)}`} className="mt-4">
        <Input type="number" min={min} step="50" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </Field>
      <div className="mt-2 flex gap-2">
        {[200, 500, 1000, 2500].map((v) => <button key={v} className="rounded-full bg-canvas px-3 py-1 text-[12.5px] font-semibold text-fg hover:bg-line" onClick={() => setAmount(String(v))}>{money(v).replace('.00', '')}</button>)}
      </div>
      <p className="mt-4 flex gap-2 rounded-lg bg-canvas p-3 text-[12.5px] leading-relaxed text-soft"><ShieldI size={16} className="mt-0.5 shrink-0" />Past performance does not guarantee future results. You can stop mirroring at any time and the current value returns to your available balance.</p>
    </Modal>
  )
}

export function InvestorCard({ inv, onMirror, mirrored }) {
  return (
    <div className="flex flex-col rounded-xl border border-line bg-card p-5">
      <div className="flex items-center gap-3">
        <InvestorFace look={inv.look} size={52} />
        <div className="min-w-0">
          <p className="truncate text-[15.5px] font-semibold text-fg">{inv.name}</p>
          <p className="truncate text-[12.5px] text-soft">{inv.kind === 'agent' ? 'AI portfolio' : `@${inv.handle} · ${inv.country}`}</p>
        </div>
        {inv.verified && inv.kind === 'investor' && <Badge tone="green" className="ml-auto">Verified</Badge>}
        {inv.kind === 'agent' && <Badge tone="violet" className="ml-auto">Beta</Badge>}
      </div>
      <p className="mt-3 line-clamp-2 min-h-[40px] text-[13.5px] leading-snug text-soft">{inv.bio}</p>
      <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-canvas p-3 text-center">
        <div><p className="text-[16px] font-semibold text-[#13a24d]">{pct(inv.return_24m)}</p><p className="text-[11.5px] text-soft">24M return</p></div>
        <div><p className="text-[16px] font-semibold text-fg">{inv.risk}</p><p className="text-[11.5px] text-soft">Risk</p></div>
        <div><p className="text-[16px] font-semibold text-fg">{num(inv.followers)}</p><p className="text-[11.5px] text-soft">Followers</p></div>
      </div>
      <Btn className="mt-4" variant={mirrored ? 'secondary' : 'primary'} onClick={() => onMirror(inv)} disabled={mirrored}>{mirrored ? 'Already mirroring' : 'Mirror'}</Btn>
    </div>
  )
}
