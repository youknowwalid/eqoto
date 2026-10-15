import { useState } from 'react'
import { db, rpc } from '../../lib/supabase'
import { useAuth, useQuery, useUi } from '../../lib/store'
import { Link, useNavigate, useSearchParams } from '../../lib/router'
import { cx, dateTime, download, money, signedMoney, toCsv, units, price } from '../../lib/format'
import { Badge, Btn, Card, CardTitle, Empty, Field, Input, Loading, PageHead, Select, Tabs, th, td, statusTone } from '../ui'
import * as I from '../icons'

const METHODS = ['Card', 'Bank transfer', 'Digital wallet']

export default function Wallet() {
  const { real, user, profile, refresh } = useAuth()
  const ui = useUi()
  const sp = useSearchParams()
  const nav = useNavigate()
  const tab = sp.get('tab') || 'deposit'
  const settings = useQuery(() => db.from('platform_settings').select('*').eq('id', 1).maybeSingle(), [])
  const tx = useQuery(() => db.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(200), [user.id])
  const [amount, setAmount] = useState('500')
  const [method, setMethod] = useState('Card')
  const [busy, setBusy] = useState(false)
  const [filter, setFilter] = useState('all')
  const st = settings.data || {}
  const verified = profile.kyc_status === 'verified'
  const pending = (tx.data || []).filter((t) => t.status === 'pending' && ['deposit', 'withdrawal'].includes(t.type))
  const amt = Number(amount) || 0
  const fee = tab === 'withdraw' ? Math.round(amt * Number(st.withdrawal_fee_pct || 0)) / 100 : 0

  const submit = async () => {
    setBusy(true)
    try {
      await rpc(tab === 'withdraw' ? 'request_withdrawal' : 'request_deposit', { p_amount: amt, p_method: method })
      ui.ok(tab === 'withdraw' ? 'Withdrawal requested. It is now awaiting review.' : 'Deposit requested. Funds are credited once it is reviewed.')
      await refresh()
      tx.reload()
    } catch (e) {
      ui.err(e)
    } finally {
      setBusy(false)
    }
  }
  const cancel = async (t) => {
    if (!(await ui.confirm({ title: 'Cancel this request?', message: t.type === 'withdrawal' ? 'The held funds return to your balance.' : 'No funds have moved yet.', confirmText: 'Cancel request', danger: true }))) return
    try {
      await rpc('cancel_request', { p_tx: t.id })
      ui.ok('Request cancelled')
      await refresh()
      tx.reload()
    } catch (e) {
      ui.err(e)
    }
  }
  const rows = (tx.data || []).filter((t) => filter === 'all' || t.type === filter || (filter === 'trades' && ['buy', 'sell'].includes(t.type)))
  const exportCsv = () =>
    download('finvero-transactions.csv', toCsv(rows.map((t) => ({ date: t.created_at, type: t.type, symbol: t.symbol || '', amount: t.amount, fee: t.fee, status: t.status, method: t.method || '', note: t.note || '' }))))

  return (
    <>
      <PageHead title="Wallet" sub="Move money in and out of your main account." />
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="sm:col-span-2 !bg-navy !text-white !border-navy"><p className="text-[13px] text-white/65">Available balance · Main account</p><p className="mt-1 text-[38px] font-semibold tracking-tight tabular-nums">{money(real?.balance)}</p><p className="mt-1 text-[13px] text-white/60">{pending.length} pending request{pending.length === 1 ? '' : 's'}</p></Card>
        <Card><p className="text-[13px] text-soft">Verification</p><p className="mt-1 flex items-center gap-2 text-[19px] font-semibold capitalize text-fg">{profile.kyc_status}<Badge tone={statusTone(profile.kyc_status)}>{verified ? 'Withdrawals on' : 'Withdrawals off'}</Badge></p>{!verified && <Link to="/app/verification" className="mt-2 inline-block text-[13.5px] font-semibold text-azure hover:underline">Complete verification</Link>}</Card>
      </div>
      <Tabs className="my-5" tabs={[{ value: 'deposit', label: 'Deposit' }, { value: 'withdraw', label: 'Withdraw' }, { value: 'history', label: 'History' }]} value={tab} onChange={(t) => nav(`/app/wallet?tab=${t}`, { replace: true })} />

      {tab !== 'history' && (
        <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <Card>
            <CardTitle title={tab === 'deposit' ? 'Deposit funds' : 'Withdraw funds'} sub={tab === 'deposit' ? `Minimum ${money(st.min_deposit || 10)}. Requests are reviewed before funds are credited.` : `Minimum ${money(st.min_withdrawal || 20)} · ${st.withdrawal_fee_pct ?? 0.5}% fee.`} />
            {tab === 'withdraw' && !verified ? (
              <Empty icon={I.LockEyeI} title="Verify your account first" text="Withdrawals unlock once your identity and address documents are approved." action={<Link to="/app/verification"><Btn>Open Verification Centre</Btn></Link>} />
            ) : (
              <div className="space-y-4">
                <Field label="Amount (USD)"><Input type="number" min="1" step="10" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
                <div className="flex flex-wrap gap-2">{[100, 250, 500, 1000, 5000].map((v) => <button key={v} className="rounded-full bg-canvas px-3 py-1 text-[12.5px] font-semibold text-fg hover:bg-line" onClick={() => setAmount(String(v))}>${v}</button>)}</div>
                <Field label={tab === 'deposit' ? 'Pay with' : 'Send to'}><Select value={method} onChange={(e) => setMethod(e.target.value)}>{METHODS.map((m) => <option key={m}>{m}</option>)}</Select></Field>
                <dl className="space-y-1.5 rounded-lg bg-canvas p-4 text-[13.5px]">
                  <div className="flex justify-between"><dt className="text-soft">Amount</dt><dd className="font-medium tabular-nums">{money(amt)}</dd></div>
                  <div className="flex justify-between"><dt className="text-soft">Fee</dt><dd className="font-medium tabular-nums">{fee ? money(fee) : 'Free'}</dd></div>
                  <div className="flex justify-between border-t border-line pt-1.5"><dt className="font-semibold">{tab === 'deposit' ? 'You will receive' : 'Total deducted'}</dt><dd className="font-semibold tabular-nums">{money(tab === 'deposit' ? amt : amt + fee)}</dd></div>
                </dl>
                <Btn size="lg" className="w-full" loading={busy} disabled={amt <= 0} onClick={submit}>{tab === 'deposit' ? 'Request deposit' : 'Request withdrawal'}</Btn>
              </div>
            )}
          </Card>
          <Card>
            <CardTitle title="Pending requests" />
            {pending.length === 0 ? <Empty title="Nothing pending" text="Requests you make show up here until they are reviewed." /> : (
              <ul className="divide-y divide-line">{pending.map((t) => (
                <li key={t.id} className="flex items-center gap-3 py-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#fff0d6] text-[#955f00]">{t.type === 'deposit' ? <I.DownloadI size={17} /> : <I.UploadI size={17} />}</span><div className="min-w-0 flex-1"><p className="text-[14px] font-semibold capitalize text-fg">{t.type} · {t.method}</p><p className="text-[12.5px] text-soft">{dateTime(t.created_at)}</p></div><p className="font-semibold tabular-nums">{money(Math.abs(t.amount))}</p><Btn size="sm" variant="secondary" onClick={() => cancel(t)}>Cancel</Btn></li>
              ))}</ul>
            )}
          </Card>
        </div>
      )}

      {tab === 'history' && (
        <Card pad={false} className="overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 border-b border-line p-4"><Select className="!w-[200px]" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter transactions"><option value="all">All transactions</option><option value="deposit">Deposits</option><option value="withdrawal">Withdrawals</option><option value="trades">Trades</option><option value="copy_start">Mirrors started</option><option value="copy_stop">Mirrors stopped</option><option value="adjustment">Adjustments</option></Select><Btn variant="secondary" size="sm" className="ml-auto" onClick={exportCsv} disabled={!rows.length}><I.DownloadI size={15} />Export CSV</Btn></div>
          {tx.loading && !tx.data ? <Loading /> : rows.length === 0 ? <Empty title="No transactions" /> : (
            <div className="overflow-x-auto"><table className="w-full min-w-[680px]"><thead className="border-b border-line bg-canvas/60"><tr><th className={th}>Date</th><th className={th}>Type</th><th className={th}>Detail</th><th className={th}>Amount</th><th className={th}>Fee</th><th className={th}>Status</th></tr></thead><tbody className="divide-y divide-line">{rows.map((t) => (
              <tr key={t.id}><td className={td}>{dateTime(t.created_at)}</td><td className={cx(td, 'capitalize')}>{t.type.replace('_', ' ')}</td><td className={cx(td, 'max-w-[240px] truncate')}>{t.symbol ? `${t.symbol} · ${units(t.units)} @ ${price(t.price)}` : t.method || t.note || '—'}</td><td className={cx(td, 'font-semibold tabular-nums', Number(t.amount) >= 0 ? 'text-[#13a24d]' : 'text-fg')}>{signedMoney(t.amount)}</td><td className={cx(td, 'tabular-nums text-soft')}>{Number(t.fee) ? money(t.fee) : '—'}</td><td className={td}><Badge tone={statusTone(t.status)}>{t.status}</Badge></td></tr>
            ))}</tbody></table></div>
          )}
        </Card>
      )}
    </>
  )
}
