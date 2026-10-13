import { rpc } from '../lib/supabase'
import { db } from '../lib/supabase'
import { useQuery } from '../lib/store'
import { Link } from '../lib/router'
import { cx, date, dateTime, money, moneyShort, num, timeAgo } from '../lib/format'
import { Avatar, Badge, Btn, Card, CardTitle, ErrorBox, Loading, PageHead, Stat, statusTone, th, td } from '../app/ui'
import { BarChart } from '../app/charts'
import * as I from '../app/icons'

export default function Overview() {
  const s = useQuery(() => rpc('admin_stats'), [])
  const users = useQuery(() => db.from('profiles').select('id,full_name,email,country,created_at,kyc_status').order('created_at', { ascending: false }).limit(6), [])
  const tx = useQuery(() => db.from('transactions').select('id,type,amount,status,created_at,symbol,user:profiles!transactions_user_id_fkey(full_name,email)').in('type', ['deposit', 'withdrawal']).eq('status', 'pending').order('created_at').limit(6), [])
  const d = s.data
  if (s.loading && !d) return <Loading />
  if (s.error && !d) return <ErrorBox error={s.error} retry={s.reload} />
  const bars = (arr) => arr.map((x) => ({ label: date(x.d, { day: 'numeric', month: 'short' }), short: new Date(x.d).getDate(), value: Number(x.n) }))
  return (
    <>
      <PageHead title="Overview" sub="How eqoto is doing right now." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={I.UsersI} label="Members" value={num(d.users)} sub={`${d.new_7d} joined in the last 7 days`} />
        <Stat icon={I.ShieldI} label="Verified" value={num(d.verified)} sub={`${d.kyc_pending} document${d.kyc_pending === 1 ? '' : 's'} awaiting review`} />
        <Stat icon={I.WalletI} label="Client cash" value={money(d.real_balance)} sub={`${money(d.invested)} invested · ${money(d.copied)} mirrored`} />
        <Stat icon={I.ActivityI} label="Trading volume (30d)" value={moneyShort(d.volume_30d)} sub={`${money(d.fees_30d)} in fees`} />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Link to="/admin/transactions"><Stat icon={I.DownloadI} label="Pending deposits" value={d.pending_deposits.n} sub={money(d.pending_deposits.sum)} tone={d.pending_deposits.n ? 'down' : undefined} /></Link>
        <Link to="/admin/transactions"><Stat icon={I.UploadI} label="Pending withdrawals" value={d.pending_withdrawals.n} sub={money(d.pending_withdrawals.sum)} tone={d.pending_withdrawals.n ? 'down' : undefined} /></Link>
        <Link to="/admin/support"><Stat icon={I.LifebuoyI} label="Open support requests" value={d.open_tickets} /></Link>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card><CardTitle title="New members" sub="Last 14 days" /><BarChart data={bars(d.signups)} color="#4f86e8" /></Card>
        <Card><CardTitle title="Trading volume" sub="Last 14 days, USD" /><BarChart data={bars(d.volume)} color="#13a24d" fmt={(v) => moneyShort(v)} /></Card>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <Card pad={false}>
          <div className="flex items-center justify-between px-5 pt-5"><CardTitle title="Needs your attention" /><Link to="/admin/transactions" className="text-[13.5px] font-semibold text-azure hover:underline">Open queue</Link></div>
          {(tx.data || []).length === 0 ? <p className="px-5 pb-6 text-[14px] text-soft">No pending money requests. Nice and tidy.</p> : (
            <ul className="divide-y divide-line pb-2">{tx.data.map((t) => <li key={t.id} className="flex items-center gap-3 px-5 py-3"><span className={cx('grid h-9 w-9 place-items-center rounded-full', t.type === 'deposit' ? 'bg-brand-soft text-brand-dark' : 'bg-[#fff0d6] text-[#955f00]')}>{t.type === 'deposit' ? <I.DownloadI size={17} /> : <I.UploadI size={17} />}</span><div className="min-w-0 flex-1"><p className="truncate text-[14px] font-semibold capitalize text-fg">{t.type} · {t.user?.full_name || t.user?.email}</p><p className="text-[12.5px] text-soft">{timeAgo(t.created_at)}</p></div><p className="font-semibold tabular-nums">{money(Math.abs(t.amount))}</p></li>)}</ul>
          )}
        </Card>
        <Card pad={false}>
          <div className="flex items-center justify-between px-5 pt-5"><CardTitle title="Newest members" /><Link to="/admin/users" className="text-[13.5px] font-semibold text-azure hover:underline">All users</Link></div>
          <ul className="divide-y divide-line pb-2">{(users.data || []).map((u) => <li key={u.id} className="flex items-center gap-3 px-5 py-3"><Avatar name={u.full_name || u.email} size={34} /><div className="min-w-0 flex-1"><p className="truncate text-[14px] font-semibold text-fg">{u.full_name || '—'}</p><p className="truncate text-[12.5px] text-soft">{u.email}</p></div><Badge tone={statusTone(u.kyc_status)}>{u.kyc_status}</Badge></li>)}</ul>
        </Card>
      </div>
      <Card className="mt-5">
        <CardTitle title="Most traded instruments" />
        {d.top_symbols.length === 0 ? <p className="text-[14px] text-soft">No trades yet.</p> : <div className="overflow-x-auto"><table className="w-full"><thead><tr><th className={th}>Symbol</th><th className={th}>Trades</th><th className={th}>Volume</th></tr></thead><tbody className="divide-y divide-line">{d.top_symbols.map((t) => <tr key={t.symbol}><td className={cx(td, 'font-semibold')}>{t.symbol}</td><td className={td}>{t.trades}</td><td className={cx(td, 'tabular-nums')}>{money(t.volume)}</td></tr>)}</tbody></table></div>}
      </Card>
    </>
  )
}
