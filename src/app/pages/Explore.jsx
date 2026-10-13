import { useMemo, useState } from 'react'
import { db } from '../../lib/supabase'
import { useAuth, useMarket, useQuery, useUi } from '../../lib/store'
import { cx, date, dateTime, money, pct, price } from '../../lib/format'
import { Badge, Btn, Card, CardTitle, Chg, Empty, Loading, PageHead, ProgressBar, Select, Tabs } from '../ui'
import { InstrumentMark, InvestorCard, MirrorModal } from '../shared'
import { usePortfolio } from '../usePortfolio'
import { useTrade } from '../Trade'
import * as I from '../icons'

export function InvestorsPage({ kind }) {
  const { account } = useAuth()
  const [sort, setSort] = useState('return_24m')
  const [risk, setRisk] = useState('any')
  const [mirror, setMirror] = useState(null)
  const q = useQuery(() => db.from('investors').select('*').eq('active', true).eq('kind', kind), [kind])
  const mine = useQuery(() => (account ? db.from('copies').select('investor_id').eq('account_id', account.id).eq('status', 'active') : []), [account?.id])
  const mirrored = new Set((mine.data || []).map((c) => c.investor_id))
  const rows = useMemo(() => {
    let r = [...(q.data || [])]
    if (risk === 'low') r = r.filter((i) => i.risk <= 3)
    if (risk === 'mid') r = r.filter((i) => i.risk >= 4 && i.risk <= 6)
    if (risk === 'high') r = r.filter((i) => i.risk >= 7)
    return r.sort((a, b) => (sort === 'risk' ? a.risk - b.risk : Number(b[sort]) - Number(a[sort])))
  }, [q.data, sort, risk])
  const agent = kind === 'agent'
  return (
    <>
      <PageHead title={agent ? 'Agent Portfolios' : 'Mirror Pro Investors'} sub={agent ? 'Rules-based AI portfolios that rebalance automatically. Beta.' : 'Allocate to verified investors and follow their trades automatically.'} action={<div className="flex gap-2"><Select className="!w-[170px]" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort"><option value="return_24m">Best 24M return</option><option value="followers">Most followed</option><option value="copiers">Most mirrored</option><option value="risk">Lowest risk</option></Select><Select className="!w-[140px]" value={risk} onChange={(e) => setRisk(e.target.value)} aria-label="Risk"><option value="any">Any risk</option><option value="low">Low (1–3)</option><option value="mid">Medium (4–6)</option><option value="high">High (7–10)</option></Select></div>} />
      {q.loading && !q.data ? <Loading /> : rows.length === 0 ? <Card><Empty title="No matches" text="Try a different risk filter." /></Card> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{rows.map((i) => <InvestorCard key={i.id} inv={i} mirrored={mirrored.has(i.id)} onMirror={setMirror} />)}</div>}
      <p className="mt-6 text-[12.5px] text-soft">Past performance does not guarantee future results. Mirroring involves risk and you may get back less than you allocate.</p>
      <MirrorModal investor={mirror} onClose={() => setMirror(null)} onDone={mine.reload} />
    </>
  )
}

export function Calendar() {
  const [impact, setImpact] = useState('all')
  const q = useQuery(() => db.from('events').select('*').gte('starts_at', new Date(Date.now() - 86400000).toISOString()).order('starts_at').limit(80), [])
  const rows = (q.data || []).filter((e) => impact === 'all' || e.impact === impact)
  const groups = rows.reduce((m, e) => {
    const k = date(e.starts_at, { weekday: 'long', day: 'numeric', month: 'long' })
    ;(m[k] ||= []).push(e)
    return m
  }, {})
  const dot = { high: 'bg-[#e5484d]', medium: 'bg-[#e0a100]', low: 'bg-[#8a93a8]' }
  return (
    <>
      <PageHead title="Economic Calendar" sub="Upcoming data releases and central bank events that can move markets." action={<Tabs tabs={[{ value: 'all', label: 'All' }, { value: 'high', label: 'High impact' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }]} value={impact} onChange={setImpact} />} />
      {q.loading && !q.data ? <Loading /> : rows.length === 0 ? <Card><Empty icon={I.CalendarI} title="No events" text="Nothing scheduled for this filter." /></Card> : Object.entries(groups).map(([day, evs]) => (
        <div key={day} className="mb-5">
          <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-soft">{day}</h2>
          <Card pad={false}><ul className="divide-y divide-line">{evs.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center gap-x-5 gap-y-1 px-5 py-4"><span className="w-[52px] text-[14px] font-semibold tabular-nums text-fg">{new Date(e.starts_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span><span className={cx('h-2.5 w-2.5 rounded-full', dot[e.impact])} title={`${e.impact} impact`} /><Badge tone="gray">{e.region}</Badge><span className="min-w-[200px] flex-1 text-[14.5px] font-medium text-fg">{e.title}</span><span className="text-[13px] text-soft">Forecast <b className="text-fg">{e.forecast || '—'}</b></span><span className="text-[13px] text-soft">Previous <b className="text-fg">{e.previous || '—'}</b></span></li>
          ))}</ul></Card>
        </div>
      ))}
    </>
  )
}

const TIERS = [
  { name: 'Standard', min: 0, color: '#8a93a8', perks: ['Demo account with $100,000', 'Access to all instruments', 'Academy lessons'] },
  { name: 'Silver', min: 5000, color: '#9aa7bd', perks: ['Everything in Standard', 'Priority support queue', 'Weekly market digest'] },
  { name: 'Gold', min: 25000, color: '#d9a400', perks: ['Everything in Silver', 'Dedicated account manager', 'Early access to new features'] },
  { name: 'Platinum', min: 100000, color: '#5b3fb4', perks: ['Everything in Gold', 'Fee reviews on request', 'Invitations to investor events'] },
]
export function Club() {
  const pf = usePortfolio('real')
  const idx = TIERS.reduce((a, t, i) => (pf.equity >= t.min ? i : a), 0)
  const cur = TIERS[idx]
  const next = TIERS[idx + 1]
  return (
    <>
      <PageHead title="eqoto Club" sub="Your tier is based on the total equity of your main account." />
      {pf.loading ? <Loading /> : (
        <>
          <Card className="mb-5">
            <div className="flex flex-wrap items-center gap-5"><span className="grid h-16 w-16 place-items-center rounded-2xl text-white" style={{ background: cur.color }}><I.AwardI size={32} /></span><div className="flex-1"><p className="text-[13px] text-soft">Current tier</p><p className="text-[28px] font-semibold text-fg">{cur.name}</p></div><div className="text-right"><p className="text-[13px] text-soft">Main account equity</p><p className="text-[22px] font-semibold tabular-nums">{money(pf.equity)}</p></div></div>
            {next ? <div className="mt-5"><div className="mb-1.5 flex justify-between text-[13px] text-soft"><span>{money(next.min - pf.equity)} to reach {next.name}</span><span>{Math.round((pf.equity / next.min) * 100)}%</span></div><ProgressBar value={(pf.equity / next.min) * 100} /></div> : <p className="mt-4 text-[14px] text-soft">You have reached the highest tier.</p>}
          </Card>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{TIERS.map((t, i) => (
            <Card key={t.name} className={cx(i === idx && 'ring-2 ring-brand')}><div className="flex items-center justify-between"><p className="text-[17px] font-semibold text-fg">{t.name}</p>{i === idx && <Badge tone="green">Your tier</Badge>}</div><p className="mt-0.5 text-[13px] text-soft">{t.min ? `From ${money(t.min).replace('.00', '')}` : 'Everyone'}</p><ul className="mt-4 space-y-2">{t.perks.map((p) => <li key={p} className="flex gap-2 text-[13.5px] text-fg"><I.CheckI size={16} className="mt-0.5 shrink-0 text-brand" />{p}</li>)}</ul></Card>
          ))}</div>
        </>
      )}
    </>
  )
}

export function Pulse() {
  const { list, change, spark } = useMarket()
  const { open } = useTrade()
  const [kind, setKind] = useState('all')
  const rows = list.filter((i) => kind === 'all' || i.kind === kind)
  const sorted = [...rows].sort((a, b) => change(b.symbol) - change(a.symbol))
  const vol = (s) => {
    const a = spark[s] || []
    if (a.length < 3) return 0
    const m = a.reduce((x, y) => x + y, 0) / a.length
    return (Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / a.length) / m) * 100
  }
  const volatile = [...rows].sort((a, b) => vol(b.symbol) - vol(a.symbol)).slice(0, 5)
  const List = ({ title, items, render }) => (
    <Card pad={false}><div className="px-5 pt-5"><CardTitle title={title} /></div><ul className="pb-2">{items.map((i) => (
      <li key={i.symbol}><button onClick={() => open(i.symbol)} className="flex w-full items-center gap-3 px-5 py-2.5 text-left hover:bg-canvas"><InstrumentMark symbol={i.symbol} size={32} /><span className="flex-1"><span className="block text-[14px] font-semibold text-fg">{i.symbol}</span><span className="block text-[12px] text-soft">{i.name}</span></span>{render(i)}</button></li>
    ))}</ul></Card>
  )
  const heat = (c) => (c >= 0 ? `rgba(19,162,77,${Math.min(0.9, 0.25 + c / 3)})` : `rgba(229,72,77,${Math.min(0.9, 0.25 + -c / 3)})`)
  return (
    <>
      <PageHead title="Pulse" sub="A live view of where the market is moving." action={<Tabs tabs={[{ value: 'all', label: 'All' }, { value: 'stock', label: 'Stocks' }, { value: 'etf', label: 'ETFs' }, { value: 'crypto', label: 'Crypto' }]} value={kind} onChange={setKind} />} />
      <Card className="mb-5"><CardTitle title="Heat map" sub="Colour shows today’s change. Click a tile to trade." /><div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">{sorted.map((i) => <button key={i.symbol} onClick={() => open(i.symbol)} className="rounded-lg p-3 text-left text-white transition hover:scale-[1.03]" style={{ background: heat(change(i.symbol)) }}><p className="text-[15px] font-bold">{i.symbol}</p><p className="text-[13px] font-semibold">{pct(change(i.symbol))}</p></button>)}</div></Card>
      <div className="grid gap-5 lg:grid-cols-3">
        <List title="Top gainers" items={sorted.slice(0, 5)} render={(i) => <Chg value={change(i.symbol)} />} />
        <List title="Top decliners" items={sorted.slice(-5).reverse()} render={(i) => <Chg value={change(i.symbol)} />} />
        <List title="Most volatile (7 days)" items={volatile} render={(i) => <span className="text-[13px] font-semibold text-fg">{vol(i.symbol).toFixed(1)}%</span>} />
      </div>
    </>
  )
}
