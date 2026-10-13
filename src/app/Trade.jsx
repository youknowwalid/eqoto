import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { db, rpc } from '../lib/supabase'
import { loadHistory, useAuth, useMarket, useQuery, useUi } from '../lib/store'
import { cx, money, pct, price, units } from '../lib/format'
import { Badge, Btn, Drawer, Field, Input, Tabs } from './ui'
import { LineChart } from './charts'
import { InstrumentMark } from './shared'
import { StarI } from './icons'

const TradeCtx = createContext({ open: () => {} })
export const useTrade = () => useContext(TradeCtx)

export function TradeProvider({ children }) {
  const [symbol, setSymbol] = useState(null)
  const value = useMemo(() => ({ open: setSymbol }), [])
  return (
    <TradeCtx.Provider value={value}>
      {children}
      {symbol && <TradeDrawer symbol={symbol} onClose={() => setSymbol(null)} />}
    </TradeCtx.Provider>
  )
}

function TradeDrawer({ symbol, onClose }) {
  const { by, change, refresh: refreshMarket } = useMarket()
  const { account, kind, user, refresh } = useAuth()
  const ui = useUi()
  const ins = by[symbol]
  const [range, setRange] = useState('1M')
  const [side, setSide] = useState('buy')
  const [amount, setAmount] = useState('100')
  const [busy, setBusy] = useState(false)
  const [points, setPoints] = useState(null)

  useEffect(() => {
    let on = true
    setPoints(null)
    loadHistory(symbol, range).then((p) => on && setPoints(p)).catch(() => on && setPoints([]))
    return () => {
      on = false
    }
  }, [symbol, range, ins?.price])

  const pos = useQuery(() => (account ? db.from('positions').select('*').eq('account_id', account.id).eq('symbol', symbol).maybeSingle() : null), [account?.id, symbol])
  const wl = useQuery(() => db.from('watchlist').select('symbol').eq('user_id', user.id).eq('symbol', symbol).maybeSingle(), [symbol, user?.id])
  const set = useQuery(() => db.from('platform_settings').select('trade_fee').eq('id', 1).maybeSingle(), [])

  if (!ins) return null
  const c = change(symbol)
  const fee = kind === 'real' && ins.kind === 'stock' ? Number(set.data?.trade_fee ?? 0.99) : 0
  const amt = Number(amount) || 0
  const holding = pos.data ? Number(pos.data.units) * Number(ins.price) : 0
  const estUnits = amt / Number(ins.price)

  const submit = async () => {
    setBusy(true)
    try {
      await rpc('place_order', { p_account: account.id, p_symbol: symbol, p_side: side, p_amount: amt })
      ui.ok(`${side === 'buy' ? 'Bought' : 'Sold'} ${money(amt)} of ${symbol}`)
      await Promise.all([refresh(), pos.reload(), refreshMarket()])
    } catch (e) {
      ui.err(e)
    } finally {
      setBusy(false)
    }
  }
  const toggleWatch = async () => {
    try {
      if (wl.data) await db.from('watchlist').remove().eq('user_id', user.id).eq('symbol', symbol)
      else await db.from('watchlist').insert({ user_id: user.id, symbol })
      wl.reload()
    } catch (e) {
      ui.err(e)
    }
  }

  return (
    <Drawer open onClose={onClose} title={`${ins.symbol} · ${ins.name}`} sub={`${ins.kind.toUpperCase()} · ${ins.exchange} · ${ins.sector}`} width={520}>
      <div className="flex items-center gap-3">
        <InstrumentMark symbol={symbol} size={46} />
        <div>
          <p className="text-[28px] font-semibold tabular-nums text-fg">{price(ins.price)}</p>
          <p className={cx('text-[14px] font-semibold', c >= 0 ? 'text-[#13a24d]' : 'text-[#e5484d]')}>{pct(c)} today</p>
        </div>
        <button onClick={toggleWatch} aria-label={wl.data ? 'Remove from watchlist' : 'Add to watchlist'} className={cx('ml-auto grid h-10 w-10 place-items-center rounded-full border border-line', wl.data ? 'bg-[#fff4d6] text-[#d99a00]' : 'text-soft hover:bg-canvas')}>
          <StarI size={19} className={wl.data ? 'fill-current' : ''} />
        </button>
      </div>
      <Tabs className="mt-4" tabs={['1D', '1W', '1M', '3M']} value={range} onChange={setRange} />
      <div className="mt-3">{points ? <LineChart points={points} color="auto" height={210} fmt={price} label={`${symbol} price chart`} /> : <div className="grid h-[250px] place-items-center text-soft">Loading chart…</div>}</div>

      {pos.data && (
        <div className="mt-3 flex items-center justify-between rounded-lg bg-canvas px-4 py-3 text-[13.5px]">
          <span className="text-soft">Your position</span>
          <span className="font-semibold text-fg">{units(pos.data.units)} units · {money(holding)}</span>
        </div>
      )}

      <div className="mt-5 rounded-xl border border-line p-4">
        <div className="grid grid-cols-2 gap-1 rounded-full bg-canvas p-1">
          {['buy', 'sell'].map((s) => (
            <button key={s} onClick={() => setSide(s)} className={cx('h-9 rounded-full text-[14px] font-semibold capitalize transition', side === s ? (s === 'buy' ? 'bg-brand text-white' : 'bg-[#e5484d] text-white') : 'text-soft')}>{s}</button>
          ))}
        </div>
        <Field label="Amount (USD)" className="mt-4">
          <Input type="number" min="1" step="10" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <div className="mt-2 flex flex-wrap gap-2">
          {[50, 100, 250, 500].map((v) => <button key={v} className="rounded-full bg-canvas px-3 py-1 text-[12.5px] font-semibold text-fg hover:bg-line" onClick={() => setAmount(String(v))}>${v}</button>)}
          {side === 'sell' && holding > 0 && <button className="rounded-full bg-canvas px-3 py-1 text-[12.5px] font-semibold text-fg hover:bg-line" onClick={() => setAmount(holding.toFixed(2))}>All</button>}
        </div>
        <dl className="mt-4 space-y-1.5 text-[13.5px]">
          <div className="flex justify-between"><dt className="text-soft">Estimated units</dt><dd className="font-medium tabular-nums text-fg">{amt > 0 ? units(estUnits) : '—'}</dd></div>
          <div className="flex justify-between"><dt className="text-soft">Fee</dt><dd className="font-medium tabular-nums text-fg">{fee ? money(fee) : 'Free'}</dd></div>
          <div className="flex justify-between"><dt className="text-soft">Account</dt><dd><Badge tone={kind === 'demo' ? 'violet' : 'green'}>{kind === 'demo' ? 'Demo' : 'Real'} · {money(account?.balance)}</Badge></dd></div>
        </dl>
        <Btn className={cx('mt-4 w-full', side === 'sell' && '!bg-[#e5484d] hover:!bg-[#cc3e43]')} size="lg" loading={busy} disabled={!ins.trading_enabled || amt < 1} onClick={submit}>
          {ins.trading_enabled ? `${side === 'buy' ? 'Buy' : 'Sell'} ${symbol}` : 'Trading halted'}
        </Btn>
      </div>
    </Drawer>
  )
}
