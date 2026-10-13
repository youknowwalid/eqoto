import { useMemo } from 'react'
import { db } from '../lib/supabase'
import { useAuth, useMarket, useQuery } from '../lib/store'

/** Positions, active mirrors and totals for the selected account. */
export function usePortfolio(kindOverride) {
  const auth = useAuth()
  const { user } = auth
  const account = kindOverride ? auth.accounts.find((a) => a.kind === kindOverride) : auth.account
  const { by, loaded } = useMarket()
  const pos = useQuery(() => (account ? db.from('positions').select('*').eq('account_id', account.id).order('opened_at', { ascending: false }) : []), [account?.id])
  const cps = useQuery(
    () => (account ? db.from('copies').select('*,investors(id,name,handle,look,kind,index_value,return_24m,risk)').eq('account_id', account.id).eq('status', 'active').order('started_at', { ascending: false }) : []),
    [account?.id],
  )

  const data = useMemo(() => {
    const rows = (pos.data || []).map((p) => {
      const ins = by[p.symbol]
      const price = Number(ins?.price ?? p.avg_price)
      const units = Number(p.units)
      const value = units * price
      const cost = units * Number(p.avg_price)
      const prev = Number(ins?.prev_close ?? price)
      return { ...p, ins, price, units, value, cost, pnl: value - cost, pnlPct: cost ? ((value - cost) / cost) * 100 : 0, today: units * (price - prev) }
    })
    const mirrors = (cps.data || []).map((c) => {
      const idx = Number(c.investors?.index_value ?? c.entry_index)
      const value = (Number(c.amount) * idx) / Number(c.entry_index)
      return { ...c, value, pnl: value - Number(c.amount), pnlPct: ((value - Number(c.amount)) / Number(c.amount)) * 100 }
    })
    const invested = rows.reduce((s, r) => s + r.value, 0)
    const mirrored = mirrors.reduce((s, r) => s + r.value, 0)
    const cash = Number(account?.balance || 0)
    return {
      rows,
      mirrors,
      invested,
      mirrored,
      cash,
      equity: cash + invested + mirrored,
      pnl: rows.reduce((s, r) => s + r.pnl, 0) + mirrors.reduce((s, r) => s + r.pnl, 0),
      today: rows.reduce((s, r) => s + r.today, 0),
    }
  }, [pos.data, cps.data, by, account?.balance])

  return { ...data, loading: pos.loading || cps.loading || !loaded, reload: () => { pos.reload(); cps.reload() }, user }
}
