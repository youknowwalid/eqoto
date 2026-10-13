import { useEffect, useMemo, useState } from 'react'
import { db } from '../../lib/supabase'
import { useAuth, useMarket, useQuery } from '../../lib/store'
import { Link } from '../../lib/router'
import { cx, dateTime, money, pct, signedMoney } from '../../lib/format'
import { Badge, Btn, Card, CardTitle, Chg, Empty, Loading, PageHead, ProgressBar, Stat, statusTone } from '../ui'
import { LineChart } from '../charts'
import { InstrumentRow, useVerification } from '../shared'
import { useTrade } from '../Trade'
import { usePortfolio } from '../usePortfolio'
import * as I from '../icons'

export function VerificationBanner() {
  const { percent, status } = useVerification()
  if (percent >= 100) return null
  return (
    <Link to="/app/verification" className="mb-5 flex items-center gap-4 rounded-xl border border-line bg-card p-5 transition hover:shadow-md sm:p-6">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#e5484d] text-white"><I.AlertI size={22} /></span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-[17px] font-semibold text-fg">Verification Centre {status === 'pending' && <Badge tone="amber">Under review</Badge>}{status === 'rejected' && <Badge tone="red">Action needed</Badge>}</span>
        <ProgressBar value={percent} className="mt-3" />
        <span className="mt-1.5 block text-[13.5px] text-soft">{percent}% complete</span>
      </span>
      <I.ChevRightI size={22} className="text-soft" />
    </Link>
  )
}

/** Value of current holdings over the last 30 days, plus today's cash. */
function useEquitySeries(rows, cash, mirrored) {
  const syms = rows.map((r) => r.symbol)
  const q = useQuery(async () => {
    if (!syms.length) return []
    const since = new Date(Date.now() - 30 * 86400000).toISOString()
    return db.from('price_history').select('symbol,ts,price').in('symbol', syms).gte('ts', since).order('ts').limit(6000)
  }, [syms.join(',')])
  return useMemo(() => {
    if (!rows.length) return []
    const dayKey = (t) => new Date(t).toISOString().slice(0, 10)
    const days = []
    for (let i = 29; i >= 0; i--) days.push(dayKey(Date.now() - i * 86400000))
    const last = {}
    ;(q.data || []).forEach((r) => {
      ;(last[r.symbol] ||= {})[dayKey(r.ts)] = Number(r.price)
    })
    const carry = {}
    return days.map((d) => {
      let v = cash + mirrored
      rows.forEach((r) => {
        const p = last[r.symbol]?.[d]
        if (p != null) carry[r.symbol] = p
        v += r.units * (carry[r.symbol] ?? r.price)
      })
      return { t: new Date(d).getTime(), v }
    })
  }, [q.data, rows, cash, mirrored])
}

export default function Home() {
  const { profile, kind, account } = useAuth()
  const { list, change } = useMarket()
  const { open } = useTrade()
  const pf = usePortfolio()
  const series = useEquitySeries(pf.rows, pf.cash, pf.mirrored)
  const tx = useQuery(() => db.from('transactions').select('*').eq('user_id', profile.id).eq('account_id', account.id).order('created_at', { ascending: false }).limit(6), [account?.id])
  const wl = useQuery(() => db.from('watchlist').select('symbol').eq('user_id', profile.id), [profile.id])
  const hour = new Date().getHours()
  const movers = useMemo(() => [...list].sort((a, b) => Math.abs(change(b.symbol)) - Math.abs(change(a.symbol))).slice(0, 5), [list, change])
  const watch = (wl.data || []).map((w) => list.find((i) => i.symbol === w.symbol)).filter(Boolean).slice(0, 5)

  return (
    <>
      <PageHead title={`${hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'}, ${(profile.full_name || 'investor').split(' ')[0]}`} sub={kind === 'demo' ? 'You are viewing your demo account. Virtual funds only.' : 'Here is how your main account is doing today.'} action={<div className="flex gap-2"><Btn variant="secondary" onClick={() => open('NOVA')}>Trade</Btn><Link to="/app/wallet?tab=deposit"><Btn>Deposit</Btn></Link></div>} />
      <VerificationBanner />
      {pf.loading ? <Loading /> : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Total equity" value={money(pf.equity)} icon={I.PieI} sub={`${kind === 'demo' ? 'Demo' : 'Real'} account`} />
            <Stat label="Available to trade" value={money(pf.cash)} icon={I.WalletI} sub="Cash balance" />
            <Stat label="Invested" value={money(pf.invested + pf.mirrored)} icon={I.TrendUpI} sub={`${pf.rows.length} holdings · ${pf.mirrors.length} mirrors`} />
            <Stat label="Profit / loss" value={signedMoney(pf.pnl)} tone={pf.pnl >= 0 ? 'up' : 'down'} icon={I.ActivityI} sub={`Today ${signedMoney(pf.today)}`} />
          </div>

          <Card className="mt-5">
            <CardTitle title="Portfolio value" sub="Your current holdings priced over the last 30 days, plus cash" />
            {series.length > 1 ? <LineChart points={series} color="auto" height={230} fmt={money} label="Portfolio value" /> : <Empty icon={I.PieI} title="Nothing invested yet" text="Buy your first stock, ETF or crypto, or mirror an investor, and your value will chart here." action={<Link to="/app/discover"><Btn>Explore markets</Btn></Link>} />}
          </Card>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <Card pad={false}>
              <div className="px-5 pt-5 sm:px-6"><CardTitle title="Watchlist" action={<Link to="/app/watchlist" className="text-[13.5px] font-semibold text-azure hover:underline">View all</Link>} /></div>
              {watch.length ? <div className="pb-2">{watch.map((i) => <InstrumentRow key={i.symbol} ins={i} onOpen={open} />)}</div> : <Empty title="Your watchlist is empty" text="Tap the star on any instrument to follow it here." />}
            </Card>
            <Card pad={false}>
              <div className="px-5 pt-5 sm:px-6"><CardTitle title="Biggest movers" sub="Today across eqoto" action={<Link to="/app/pulse" className="text-[13.5px] font-semibold text-azure hover:underline">Market view</Link>} /></div>
              <div className="pb-2">{movers.map((i) => <InstrumentRow key={i.symbol} ins={i} onOpen={open} />)}</div>
            </Card>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[1.35fr_1fr]">
            <Card>
              <CardTitle title="Recent activity" action={<Link to="/app/wallet?tab=history" className="text-[13.5px] font-semibold text-azure hover:underline">All transactions</Link>} />
              {(tx.data || []).length === 0 ? <Empty title="No activity yet" text="Deposits, trades and mirrors will appear here." /> : (
                <ul className="divide-y divide-line">
                  {tx.data.map((t) => (
                    <li key={t.id} className="flex items-center gap-3 py-3">
                      <span className={cx('grid h-9 w-9 place-items-center rounded-full', Number(t.amount) >= 0 ? 'bg-[#dff6e8] text-[#0c7a39]' : 'bg-[#fde4e4] text-[#b63232]')}>{Number(t.amount) >= 0 ? <I.TrendUpI size={17} /> : <I.TrendDownI size={17} />}</span>
                      <div className="min-w-0 flex-1"><p className="truncate text-[14px] font-semibold capitalize text-fg">{t.type.replace('_', ' ')}{t.symbol ? ` · ${t.symbol}` : ''}</p><p className="text-[12.5px] text-soft">{dateTime(t.created_at)}</p></div>
                      <div className="text-right"><p className="text-[14px] font-semibold tabular-nums text-fg">{signedMoney(t.amount)}</p>{t.status !== 'completed' && <Badge tone={statusTone(t.status)}>{t.status}</Badge>}</div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card>
              <CardTitle title="Active mirrors" action={<Link to="/app/mirror" className="text-[13.5px] font-semibold text-azure hover:underline">Find investors</Link>} />
              {pf.mirrors.length === 0 ? <Empty title="Not mirroring anyone" text="Pick a verified investor and let their moves become yours." action={<Link to="/app/mirror"><Btn variant="secondary" size="sm">Browse investors</Btn></Link>} /> : (
                <ul className="divide-y divide-line">
                  {pf.mirrors.map((m) => (
                    <li key={m.id} className="flex items-center justify-between gap-3 py-3"><div><p className="text-[14px] font-semibold text-fg">{m.investors?.name}</p><p className="text-[12.5px] text-soft">{money(m.amount)} allocated</p></div><div className="text-right"><p className="text-[14px] font-semibold tabular-nums text-fg">{money(m.value)}</p><Chg value={m.pnlPct} /></div></li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}
    </>
  )
}
