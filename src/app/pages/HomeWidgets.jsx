import { useMemo } from 'react'
import { db } from '../../lib/supabase'
import { useAuth, useMarket, useQuery } from '../../lib/store'
import { Link } from '../../lib/router'
import { cx, dateTime, pct, price } from '../../lib/format'
import { Badge, Btn, Card, CardTitle, ProgressBar } from '../ui'
import { InstrumentMark, SourceBadge, useVerification } from '../shared'
import { useTrade } from '../Trade'
import * as I from '../icons'

/** Scrolling strip of every tradable instrument. Pauses on hover/focus; static under reduced motion. */
export function MarketTicker() {
  const { list, change } = useMarket()
  const { open } = useTrade()
  if (!list.length) return null
  const items = [...list, ...list]
  return (
    <div className="group relative mb-5 overflow-hidden rounded-xl border border-line bg-card" role="region" aria-label="Market ticker (simulated prices)">
      <div className="flex w-max animate-[ticker_70s_linear_infinite] gap-1 py-2.5 group-hover:[animation-play-state:paused] motion-reduce:animate-none" >
        {items.map((i, k) => {
          const c = change(i.symbol)
          return (
            <button key={`${i.symbol}-${k}`} onClick={() => open(i.symbol)} tabIndex={k < list.length ? 0 : -1} aria-hidden={k >= list.length} className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-1 text-[13px] hover:bg-canvas focus-visible:bg-canvas">
              <span className="font-semibold text-fg">{i.symbol}</span>
              <span className="tabular-nums text-soft">{price(i.price)}</span>
              <span className={cx('font-semibold tabular-nums', c >= 0 ? 'text-[#13a24d]' : 'text-[#e5484d]')}>{pct(c)}</span>
            </button>
          )
        })}
      </div>
      <style>{`@keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
    </div>
  )
}

/** Personalised onboarding: verification steps plus first deposit, first trade and first follow. */
export function GettingStarted() {
  const { user, real, kind } = useAuth()
  const v = useVerification()
  const act = useQuery(async () => {
    const [orders, follows, tx] = await Promise.all([
      db.from('orders').select('id').eq('user_id', user.id).eq('status', 'filled').limit(1),
      db.from('social_follows').select('following_id').eq('follower_id', user.id).limit(1),
      db.from('transactions').select('id').eq('user_id', user.id).eq('type', 'deposit').eq('status', 'completed').limit(1),
    ])
    return { traded: orders.length > 0, followed: follows.length > 0, deposited: tx.length > 0 }
  }, [user.id])
  const a = act.data || {}
  const steps = [
    { label: 'Complete verification', to: '/app/verification', done: v.percent >= 100, note: `${v.percent}%` },
    { label: 'Add simulated funds to your main account', to: '/app/wallet?tab=deposit', done: a.deposited || Number(real?.balance) > 0 },
    { label: 'Place your first practice trade', to: '/app/discover', done: a.traded },
    { label: 'Follow a member in the community', to: '/app/community', done: a.followed },
  ]
  const done = steps.filter((s) => s.done).length
  if (act.loading || done === steps.length) return null
  return (
    <Card className="mb-5">
      <CardTitle title="Get started" sub={`${done} of ${steps.length} complete${kind === 'demo' ? ' · you are on the demo account' : ''}`} />
      <ProgressBar value={(done / steps.length) * 100} className="mb-3" />
      <ul className="divide-y divide-line">
        {steps.map((s) => (
          <li key={s.label}>
            <Link to={s.to} className="flex items-center gap-3 py-2.5 hover:opacity-80">
              <span className={cx('grid h-6 w-6 place-items-center rounded-full border', s.done ? 'border-[#13a24d] bg-[#13a24d] text-white' : 'border-line text-transparent')}><I.CheckI size={14} /></span>
              <span className={cx('flex-1 text-[14.5px]', s.done ? 'text-soft line-through' : 'font-medium text-fg')}>{s.label}</span>
              {!s.done && s.note && <Badge tone="amber">{s.note}</Badge>}
              <I.ChevRightI size={18} className="text-soft" />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  )
}

export function EarningsCard() {
  const q = useQuery(() => db.from('events').select('*').eq('category', 'earnings').gte('starts_at', new Date().toISOString()).order('starts_at').limit(4), [])
  return (
    <Card>
      <CardTitle title="Upcoming earnings" sub="Sample company calendar" action={<Link to="/app/calendar" className="text-[13.5px] font-semibold text-azure hover:underline">Calendar</Link>} />
      {(q.data || []).length === 0 ? <p className="text-[13.5px] text-soft">No earnings scheduled.</p> : (
        <ul className="divide-y divide-line">{q.data.map((e) => (
          <li key={e.id} className="py-2.5"><p className="text-[14px] font-semibold text-fg">{e.title}</p><p className="text-[12.5px] text-soft">{dateTime(e.starts_at)} · Forecast {e.forecast || '—'} · Previous {e.previous || '—'}</p></li>
        ))}</ul>
      )}
    </Card>
  )
}

export function LearnCard() {
  const q = useQuery(() => db.from('articles').select('id,title,category,minutes').eq('published', true).order('created_at', { ascending: false }).limit(3), [])
  return (
    <Card>
      <CardTitle title="Recommended learning" action={<Link to="/app/academy" className="text-[13.5px] font-semibold text-azure hover:underline">Academy</Link>} />
      {(q.data || []).length === 0 ? <p className="text-[13.5px] text-soft">New lessons are on the way.</p> : (
        <ul className="divide-y divide-line">{q.data.map((a) => (
          <li key={a.id}><Link to={`/app/academy/${a.id}`} className="flex items-center gap-3 py-2.5 hover:opacity-80"><span className="grid h-9 w-9 place-items-center rounded-lg bg-canvas text-azure"><I.BookI size={18} /></span><span className="min-w-0 flex-1"><span className="block truncate text-[14px] font-semibold text-fg">{a.title}</span><span className="text-[12.5px] text-soft">{a.category} · {a.minutes} min</span></span></Link></li>
        ))}</ul>
      )}
    </Card>
  )
}

/** Illustrative ideas computed from simulated momentum and the investor list. Not personal advice. */
export function Suggestions() {
  const { list, change } = useMarket()
  const { open } = useTrade()
  const inv = useQuery(() => db.from('investors').select('id,name,handle,return_24m,risk').eq('active', true).eq('kind', 'investor').order('return_24m', { ascending: false }).limit(2), [])
  const top = useMemo(() => [...list].filter((i) => i.trading_enabled).sort((a, b) => change(b.symbol) - change(a.symbol)).slice(0, 3), [list, change])
  return (
    <Card>
      <CardTitle title="Ideas to explore" sub="Simulated data. Illustrative only, not advice." />
      <ul className="divide-y divide-line">
        {top.map((i) => (
          <li key={i.symbol}><button onClick={() => open(i.symbol)} className="flex w-full items-center gap-3 py-2.5 text-left hover:opacity-80"><InstrumentMark symbol={i.symbol} size={32} /><span className="min-w-0 flex-1"><span className="block text-[14px] font-semibold text-fg">{i.symbol} <SourceBadge ins={i} /></span><span className="block truncate text-[12.5px] text-soft">Strongest mover today · {pct(change(i.symbol))}</span></span></button></li>
        ))}
        {(inv.data || []).map((p) => (
          <li key={p.id}><Link to="/app/mirror" className="flex items-center gap-3 py-2.5 hover:opacity-80"><span className="grid h-8 w-8 place-items-center rounded-full bg-canvas text-azure"><I.MirrorI size={16} /></span><span className="min-w-0 flex-1"><span className="block text-[14px] font-semibold text-fg">{p.name}</span><span className="text-[12.5px] text-soft">Risk {p.risk}/10 · {pct(p.return_24m)} simulated 24M return</span></span></Link></li>
        ))}
      </ul>
      <Link to="/app/discover"><Btn variant="secondary" size="sm" className="mt-3 w-full">Discover more</Btn></Link>
    </Card>
  )
}
