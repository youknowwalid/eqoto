import { useMemo, useState } from 'react'
import { db, rpc } from '../../lib/supabase'
import { useAuth, useMarket, useQuery, useUi } from '../../lib/store'
import { Link, useSearchParams, useNavigate } from '../../lib/router'
import { cx, dateTime, money, pct, price, signedMoney, units, num } from '../../lib/format'
import { Badge, Btn, Card, CardTitle, Chg, Empty, ErrorBox, Input, Loading, PageHead, Select, Tabs, th, td, statusTone } from '../ui'
import { Donut } from '../charts'
import { InstrumentMark, InstrumentRow, InvestorCard, MirrorModal } from '../shared'
import { useTrade } from '../Trade'
import { usePortfolio } from '../usePortfolio'
import * as I from '../icons'

export function Watchlist() {
  const { user } = useAuth()
  const { list } = useMarket()
  const { open } = useTrade()
  const ui = useUi()
  const q = useQuery(() => db.from('watchlist').select('symbol,added_at').eq('user_id', user.id).order('added_at', { ascending: false }), [user.id])
  const [search, setSearch] = useState('')
  const mine = new Set((q.data || []).map((w) => w.symbol))
  const items = (q.data || []).map((w) => list.find((i) => i.symbol === w.symbol)).filter(Boolean)
  const suggestions = useMemo(() => {
    const s = search.trim().toLowerCase()
    return list.filter((i) => !mine.has(i.symbol) && (!s || i.symbol.toLowerCase().includes(s) || i.name.toLowerCase().includes(s))).slice(0, 8)
  }, [list, search, q.data])
  const toggle = async (sym, on) => {
    try {
      if (on) await db.from('watchlist').remove().eq('user_id', user.id).eq('symbol', sym)
      else await db.from('watchlist').insert({ user_id: user.id, symbol: sym })
      q.reload()
    } catch (e) {
      ui.err(e)
    }
  }
  return (
    <>
      <PageHead title="Watchlist" sub="Follow the instruments you care about." />
      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Card pad={false}>
          {q.loading && !q.data ? <Loading /> : items.length === 0 ? <Empty icon={I.StarI} title="Nothing here yet" text="Add instruments from the list on the right, or tap the star on any instrument." /> : (
            <div className="py-2">{items.map((i) => <InstrumentRow key={i.symbol} ins={i} onOpen={open} right={<button aria-label={`Remove ${i.symbol}`} onClick={(e) => { e.stopPropagation(); toggle(i.symbol, true) }} className="grid h-8 w-8 place-items-center rounded-full text-[#d99a00] hover:bg-canvas"><I.StarI size={18} className="fill-current" /></button>} />)}</div>
          )}
        </Card>
        <Card>
          <CardTitle title="Add instruments" />
          <Input placeholder="Search by name or symbol" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search instruments to add" />
          <ul className="mt-3 divide-y divide-line">
            {suggestions.length === 0 && <li className="py-6 text-center text-[14px] text-soft">No more matches.</li>}
            {suggestions.map((i) => (
              <li key={i.symbol} className="flex items-center gap-3 py-2.5"><InstrumentMark symbol={i.symbol} size={32} /><div className="min-w-0 flex-1"><p className="text-[14px] font-semibold text-fg">{i.symbol}</p><p className="truncate text-[12.5px] text-soft">{i.name}</p></div><Btn size="sm" variant="soft" onClick={() => toggle(i.symbol, false)}><I.PlusI size={15} />Add</Btn></li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  )
}

export function Portfolio() {
  const pf = usePortfolio()
  const { account, kind, refresh } = useAuth()
  const { open } = useTrade()
  const ui = useUi()
  const sp = useSearchParams()
  const nav = useNavigate()
  const tab = sp.get('tab') || 'holdings'
  const hist = useQuery(() => db.from('transactions').select('*').eq('account_id', account.id).in('type', ['buy', 'sell', 'copy_start', 'copy_stop']).order('created_at', { ascending: false }).limit(60), [account?.id, tab === 'history'])
  const [busy, setBusy] = useState('')

  const stop = async (m) => {
    if (!(await ui.confirm({ title: `Stop mirroring ${m.investors?.name}?`, message: `${money(m.value)} will return to your available balance.`, confirmText: 'Stop mirroring', danger: true }))) return
    setBusy(m.id)
    try {
      const v = await rpc('stop_copy', { p_copy: m.id })
      ui.ok(`Mirror stopped. ${money(v)} returned to your balance.`)
      await refresh()
      pf.reload()
    } catch (e) {
      ui.err(e)
    } finally {
      setBusy('')
    }
  }
  const resetDemo = async () => {
    if (!(await ui.confirm({ title: 'Reset demo account?', message: 'All demo positions and mirrors are closed and your balance returns to $100,000.', confirmText: 'Reset', danger: true }))) return
    try {
      await rpc('reset_demo')
      await refresh()
      pf.reload()
      ui.ok('Demo account reset')
    } catch (e) {
      ui.err(e)
    }
  }
  const palette = ['#13a24d', '#4f86e8', '#e0a100', '#a56bf0', '#e5484d', '#14b8c4', '#8a93a8']
  const parts = [...pf.rows.map((r, i) => ({ label: r.symbol, value: r.value })), ...(pf.mirrored ? [{ label: 'Mirrors', value: pf.mirrored }] : []), { label: 'Cash', value: pf.cash }].filter((p) => p.value > 0).map((p, i) => ({ ...p, color: palette[i % palette.length] }))

  return (
    <>
      <PageHead title="Portfolio" sub={kind === 'demo' ? 'Demo account (virtual funds)' : 'Main account'} action={kind === 'demo' && <Btn variant="secondary" onClick={resetDemo}><I.RefreshI size={16} />Reset demo</Btn>} />
      {pf.loading ? <Loading /> : (
        <>
          <Card className="mb-5">
            <div className="grid items-center gap-6 sm:grid-cols-[auto_1fr]">
              <Donut parts={parts.length ? parts : [{ value: 1, color: '#c9cfdd' }]} center={<div><p className="text-[12px] text-soft">Equity</p><p className="text-[17px] font-semibold text-fg">{money(pf.equity)}</p></div>} />
              <div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {[['Cash', money(pf.cash)], ['Holdings', money(pf.invested)], ['Mirrors', money(pf.mirrored)], ['P/L', signedMoney(pf.pnl)]].map(([k, v]) => <div key={k}><p className="text-[12.5px] text-soft">{k}</p><p className={cx('text-[19px] font-semibold tabular-nums', k === 'P/L' ? (pf.pnl >= 0 ? 'text-[#13a24d]' : 'text-[#e5484d]') : 'text-fg')}>{v}</p></div>)}
                </div>
                <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">{parts.map((p) => <li key={p.label} className="flex items-center gap-1.5 text-[12.5px] text-soft"><span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />{p.label} {Math.round((p.value / pf.equity) * 100)}%</li>)}</ul>
              </div>
            </div>
          </Card>
          <Tabs className="mb-4" tabs={[{ value: 'holdings', label: 'Holdings', count: pf.rows.length }, { value: 'mirrors', label: 'Mirrors', count: pf.mirrors.length }, { value: 'history', label: 'History' }]} value={tab} onChange={(t) => nav(`/app/portfolio?tab=${t}`, { replace: true })} />
          <Card pad={false} className="overflow-hidden">
            {tab === 'holdings' && (pf.rows.length === 0 ? <Empty icon={I.PieI} title="No holdings yet" text="Buy something from Discover to get started." action={<Link to="/app/discover"><Btn>Discover</Btn></Link>} /> : (
              <div className="overflow-x-auto"><table className="w-full min-w-[640px]"><thead className="border-b border-line bg-canvas/60"><tr><th className={th}>Instrument</th><th className={th}>Units</th><th className={th}>Avg price</th><th className={th}>Value</th><th className={th}>P/L</th><th className={th} /></tr></thead>
                <tbody className="divide-y divide-line">{pf.rows.map((r) => (
                  <tr key={r.id} className="hover:bg-canvas/50"><td className={td}><button className="flex items-center gap-3 text-left" onClick={() => open(r.symbol)}><InstrumentMark symbol={r.symbol} size={32} /><span><span className="block font-semibold">{r.symbol}</span><span className="block text-[12px] text-soft">{r.ins?.name}</span></span></button></td><td className={cx(td, 'tabular-nums')}>{units(r.units)}</td><td className={cx(td, 'tabular-nums')}>{price(r.avg_price)}</td><td className={cx(td, 'font-semibold tabular-nums')}>{money(r.value)}</td><td className={td}><span className={cx('font-semibold tabular-nums', r.pnl >= 0 ? 'text-[#13a24d]' : 'text-[#e5484d]')}>{signedMoney(r.pnl)}</span><span className="block text-[12px] text-soft">{pct(r.pnlPct)}</span></td><td className={cx(td, 'text-right')}><Btn size="sm" variant="secondary" onClick={() => open(r.symbol)}>Trade</Btn></td></tr>
                ))}</tbody></table></div>
            ))}
            {tab === 'mirrors' && (pf.mirrors.length === 0 ? <Empty icon={I.MirrorI} title="Not mirroring anyone" text="Allocate to a verified investor and follow their moves automatically." action={<Link to="/app/mirror"><Btn>Find investors</Btn></Link>} /> : (
              <ul className="divide-y divide-line">{pf.mirrors.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center gap-4 px-5 py-4"><div className="min-w-[160px] flex-1"><p className="font-semibold text-fg">{m.investors?.name}</p><p className="text-[12.5px] text-soft">Since {dateTime(m.started_at)}</p></div><div className="text-right"><p className="text-[12px] text-soft">Allocated</p><p className="font-semibold tabular-nums">{money(m.amount)}</p></div><div className="text-right"><p className="text-[12px] text-soft">Value</p><p className="font-semibold tabular-nums">{money(m.value)}</p></div><div className="w-[84px] text-right"><Chg value={m.pnlPct} /></div><Btn size="sm" variant="secondary" loading={busy === m.id} onClick={() => stop(m)}>Stop</Btn></li>
              ))}</ul>
            ))}
            {tab === 'history' && (hist.loading && !hist.data ? <Loading /> : (hist.data || []).length === 0 ? <Empty title="No trades yet" /> : (
              <div className="overflow-x-auto"><table className="w-full min-w-[600px]"><thead className="border-b border-line bg-canvas/60"><tr><th className={th}>Date</th><th className={th}>Type</th><th className={th}>Detail</th><th className={th}>Amount</th><th className={th}>P/L</th></tr></thead><tbody className="divide-y divide-line">{hist.data.map((t) => (
                <tr key={t.id}><td className={td}>{dateTime(t.created_at)}</td><td className={cx(td, 'capitalize')}>{t.type.replace('_', ' ')}</td><td className={td}>{t.symbol ? `${t.symbol} · ${units(t.units)} @ ${price(t.price)}` : t.note}</td><td className={cx(td, 'tabular-nums')}>{signedMoney(t.amount)}</td><td className={cx(td, 'tabular-nums')}>{t.pnl != null ? signedMoney(t.pnl) : '—'}</td></tr>
              ))}</tbody></table></div>
            ))}
          </Card>
        </>
      )}
    </>
  )
}

export function Discover() {
  const { list, change } = useMarket()
  const { open } = useTrade()
  const { account } = useAuth()
  const [tab, setTab] = useState('stock')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('symbol')
  const [mirror, setMirror] = useState(null)
  const inv = useQuery(() => db.from('investors').select('*').eq('active', true).eq('kind', 'investor').order('return_24m', { ascending: false }), [])
  const mine = useQuery(() => (account ? db.from('copies').select('investor_id').eq('account_id', account.id).eq('status', 'active') : []), [account?.id])
  const mirrored = new Set((mine.data || []).map((c) => c.investor_id))
  const rows = useMemo(() => {
    const s = search.trim().toLowerCase()
    const r = list.filter((i) => i.kind === tab && (!s || i.symbol.toLowerCase().includes(s) || i.name.toLowerCase().includes(s)))
    const f = { symbol: (a, b) => a.symbol.localeCompare(b.symbol), gain: (a, b) => change(b.symbol) - change(a.symbol), loss: (a, b) => change(a.symbol) - change(b.symbol), price: (a, b) => Number(b.price) - Number(a.price) }[sort]
    return r.sort(f)
  }, [list, tab, search, sort, change])
  return (
    <>
      <PageHead title="Discover" sub="Find your next investment across stocks, ETFs, crypto and top investors." />
      <Tabs className="mb-4" tabs={[{ value: 'stock', label: 'Stocks' }, { value: 'etf', label: 'ETFs' }, { value: 'crypto', label: 'Crypto' }, { value: 'people', label: 'Investors' }]} value={tab} onChange={setTab} />
      {tab === 'people' ? (
        inv.loading && !inv.data ? <Loading /> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{(inv.data || []).map((i) => <InvestorCard key={i.id} inv={i} mirrored={mirrored.has(i.id)} onMirror={setMirror} />)}</div>
      ) : (
        <Card pad={false}>
          <div className="flex flex-wrap gap-3 border-b border-line p-4"><div className="min-w-[220px] flex-1"><Input placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search" /></div><Select className="!w-[190px]" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort by"><option value="symbol">Sort: A–Z</option><option value="gain">Sort: Top gainers</option><option value="loss">Sort: Top decliners</option><option value="price">Sort: Price</option></Select></div>
          <div className="py-1">{rows.length === 0 ? <Empty title="No matches" /> : rows.map((i) => <InstrumentRow key={i.symbol} ins={i} onOpen={open} right={<Btn size="sm" variant="soft" onClick={(e) => { e.stopPropagation(); open(i.symbol) }}>Trade</Btn>} />)}</div>
        </Card>
      )}
      <MirrorModal investor={mirror} onClose={() => setMirror(null)} onDone={mine.reload} />
    </>
  )
}
