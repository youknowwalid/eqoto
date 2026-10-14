import { useEffect, useState } from 'react'
import { db, rpc } from '../lib/supabase'
import { useAuth, useQuery, useUi } from '../lib/store'
import { cx, date, dateTime, download, money, signedMoney, toCsv } from '../lib/format'
import { Avatar, Badge, Btn, Card, CardTitle, Drawer, Empty, Field, Input, Loading, Modal, PageHead, Select, Textarea, th, td, statusTone } from '../app/ui'
import * as I from '../app/icons'

const PAGE = 20

export default function Users() {
  const [qs, setQs] = useState('')
  const [term, setTerm] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [kyc, setKyc] = useState('')
  const [page, setPage] = useState(0)
  const [sel, setSel] = useState(null)
  useEffect(() => {
    const t = setTimeout(() => { setTerm(qs.trim().replace(/[,()*%]/g, '')); setPage(0) }, 300)
    return () => clearTimeout(t)
  }, [qs])
  const q = useQuery(async () => {
    let r = db.from('profiles').select('id,full_name,email,username,country,role,status,kyc_status,created_at,last_seen_at', { count: true })
    if (term) r = r.or(`full_name.ilike.*${term}*,email.ilike.*${term}*,username.ilike.*${term}*`)
    if (role) r = r.eq('role', role)
    if (status) r = r.eq('status', status)
    if (kyc) r = r.eq('kyc_status', kyc)
    return r.order('created_at', { ascending: false }).range(page * PAGE, page * PAGE + PAGE - 1)
  }, [term, role, status, kyc, page])
  const rows = q.data?.rows || []
  const total = q.data?.total || 0
  const exportAll = async () => {
    const all = await db.from('profiles').select('full_name,email,username,country,role,status,kyc_status,created_at').order('created_at', { ascending: false }).limit(5000)
    download('eqoto-users.csv', toCsv(all))
  }
  return (
    <>
      <PageHead title="Users" sub={`${total} member${total === 1 ? '' : 's'}`} action={<Btn variant="secondary" size="sm" onClick={exportAll}><I.DownloadI size={15} />Export CSV</Btn>} />
      <Card pad={false} className="overflow-hidden">
        <div className="flex flex-wrap gap-3 border-b border-line p-4">
          <div className="relative min-w-[220px] flex-1"><I.SearchI size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-soft" /><Input className="!pl-10" placeholder="Search name, email or username" value={qs} onChange={(e) => setQs(e.target.value)} aria-label="Search users" /></div>
          <Select className="!w-[130px]" value={role} onChange={(e) => { setRole(e.target.value); setPage(0) }} aria-label="Role"><option value="">All roles</option><option value="user">Members</option><option value="admin">Admins</option></Select>
          <Select className="!w-[140px]" value={status} onChange={(e) => { setStatus(e.target.value); setPage(0) }} aria-label="Status"><option value="">Any status</option><option value="active">Active</option><option value="suspended">Suspended</option></Select>
          <Select className="!w-[180px]" value={kyc} onChange={(e) => { setKyc(e.target.value); setPage(0) }} aria-label="Verification"><option value="">Any verification</option>{['unverified', 'pending', 'verified', 'rejected'].map((k) => <option key={k} value={k} className="capitalize">{k}</option>)}</Select>
        </div>
        {q.loading && !q.data ? <Loading /> : rows.length === 0 ? <Empty icon={I.UsersI} title="No users match" text="Try clearing a filter." /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]"><thead className="border-b border-line bg-canvas/60"><tr><th className={th}>Member</th><th className={th}>Country</th><th className={th}>Role</th><th className={th}>Status</th><th className={th}>Verification</th><th className={th}>Joined</th></tr></thead>
              <tbody className="divide-y divide-line">{rows.map((u) => (
                <tr key={u.id} className="cursor-pointer hover:bg-canvas" onClick={() => setSel(u.id)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setSel(u.id)}>
                  <td className={td}><div className="flex items-center gap-3"><Avatar name={u.full_name || u.email} size={34} /><div className="min-w-0"><p className="truncate font-semibold">{u.full_name || '—'}</p><p className="truncate text-[12.5px] text-soft">{u.email}</p></div></div></td>
                  <td className={td}>{u.country || '—'}</td><td className={td}><Badge tone={statusTone(u.role)}>{u.role}</Badge></td><td className={td}><Badge tone={statusTone(u.status)}>{u.status}</Badge></td><td className={td}><Badge tone={statusTone(u.kyc_status)}>{u.kyc_status}</Badge></td><td className={cx(td, 'text-soft')}>{date(u.created_at)}</td>
                </tr>
              ))}</tbody></table>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-line px-4 py-3 text-[13.5px] text-soft"><span>{total ? `${page * PAGE + 1}–${Math.min(total, (page + 1) * PAGE)} of ${total}` : ''}</span><div className="flex gap-2"><Btn size="sm" variant="secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Btn><Btn size="sm" variant="secondary" disabled={(page + 1) * PAGE >= total} onClick={() => setPage(page + 1)}>Next</Btn></div></div>
      </Card>
      <UserDrawer id={sel} onClose={() => setSel(null)} onChanged={q.reload} />
    </>
  )
}

function UserDrawer({ id, onClose, onChanged }) {
  const me = useAuth()
  const ui = useUi()
  const u = useQuery(() => (id ? db.from('profiles').select('*').eq('id', id).maybeSingle() : null), [id])
  const acc = useQuery(() => (id ? db.from('accounts').select('*').eq('user_id', id).order('kind') : []), [id])
  const tx = useQuery(() => (id ? db.from('transactions').select('*').eq('user_id', id).order('created_at', { ascending: false }).limit(12) : []), [id])
  const pos = useQuery(() => (id ? db.from('positions').select('*,ins:instruments(price)').eq('user_id', id) : []), [id])
  const [adj, setAdj] = useState({ account: '', amount: '', reason: '' })
  const [msg, setMsg] = useState({ title: '', body: '' })
  const [busy, setBusy] = useState('')
  useEffect(() => { setAdj({ account: '', amount: '', reason: '' }); setMsg({ title: '', body: '' }) }, [id])
  const p = u.data
  const self = p?.id === me.user?.id
  const run = async (key, fn, ok) => {
    setBusy(key)
    try {
      await fn()
      ui.ok(ok)
      u.reload(); acc.reload(); tx.reload(); onChanged()
    } catch (e) {
      ui.err(e)
    } finally {
      setBusy('')
    }
  }
  const upd = (patch, ok) => run('u', () => rpc('admin_update_user', { p_user: id, p_role: null, p_status: null, p_kyc: null, ...patch }), ok)
  const accounts = acc.data || []
  const adjAcc = adj.account || accounts.find((a) => a.kind === 'real')?.id || ''
  return (
    <Drawer open={!!id} onClose={onClose} title={p?.full_name || 'User'} sub={p?.email} width={600}>
      {!p ? <Loading /> : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2"><Badge tone={statusTone(p.role)}>{p.role}</Badge><Badge tone={statusTone(p.status)}>{p.status}</Badge><Badge tone={statusTone(p.kyc_status)}>KYC {p.kyc_status}</Badge><span className="text-[12.5px] text-soft">Joined {date(p.created_at)}</span></div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg bg-canvas p-4 text-[13.5px]">
            {[['Username', p.username], ['Phone', p.phone], ['Country', p.country], ['City', p.city], ['Date of birth', p.dob && date(p.dob)], ['Address', p.address], ['Referral code', p.referral_code], ['Last seen', p.last_seen_at && dateTime(p.last_seen_at)]].map(([k, v]) => <div key={k}><dt className="text-soft">{k}</dt><dd className="font-medium text-fg">{v || '—'}</dd></div>)}
          </dl>
          <section>
            <h3 className="mb-2 text-[14px] font-semibold text-fg">Accounts</h3>
            <div className="grid grid-cols-2 gap-3">{accounts.map((a) => <div key={a.id} className="rounded-lg border border-line p-3"><p className="text-[12.5px] capitalize text-soft">{a.kind === 'real' ? 'Main' : 'Demo'}</p><p className="text-[18px] font-semibold tabular-nums">{money(a.balance)}</p></div>)}</div>
            <p className="mt-2 text-[13px] text-soft">{(pos.data || []).length} open position{(pos.data || []).length === 1 ? '' : 's'} · invested value {money((pos.data || []).reduce((s, x) => s + Number(x.units) * Number(x.ins?.price || 0), 0))}</p>
          </section>
          <section className="space-y-3">
            <h3 className="text-[14px] font-semibold text-fg">Account controls</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Role"><Select value={p.role} disabled={self || busy === 'u'} onChange={(e) => upd({ p_role: e.target.value }, 'Role updated')}><option value="user">Member</option><option value="admin">Admin</option></Select></Field>
              <Field label="Status"><Select value={p.status} disabled={self || busy === 'u'} onChange={(e) => upd({ p_status: e.target.value }, e.target.value === 'suspended' ? 'User suspended' : 'User reactivated')}><option value="active">Active</option><option value="suspended">Suspended</option></Select></Field>
              <Field label="Verification"><Select value={p.kyc_status} disabled={busy === 'u'} onChange={(e) => upd({ p_kyc: e.target.value }, 'Verification updated')}>{['unverified', 'pending', 'verified', 'rejected'].map((k) => <option key={k}>{k}</option>)}</Select></Field>
            </div>
            {self && <p className="text-[12.5px] text-soft">You cannot change your own role or status.</p>}
          </section>
          <section className="space-y-3 rounded-lg border border-line p-4">
            <h3 className="text-[14px] font-semibold text-fg">Adjust balance</h3>
            <div className="grid gap-3 sm:grid-cols-[1fr_130px]"><Field label="Account"><Select value={adjAcc} onChange={(e) => setAdj({ ...adj, account: e.target.value })}>{accounts.map((a) => <option key={a.id} value={a.id}>{a.kind === 'real' ? 'Main' : 'Demo'} · {money(a.balance)}</option>)}</Select></Field><Field label="Amount (+/−)"><Input type="number" step="0.01" value={adj.amount} onChange={(e) => setAdj({ ...adj, amount: e.target.value })} placeholder="-50" /></Field></div>
            <Field label="Reason (shown to the member)"><Input value={adj.reason} onChange={(e) => setAdj({ ...adj, reason: e.target.value })} /></Field>
            <Btn size="sm" loading={busy === 'adj'} disabled={!Number(adj.amount) || adj.reason.trim().length < 3} onClick={async () => { if (await ui.confirm({ title: 'Adjust balance?', message: `${signedMoney(adj.amount)} will be applied immediately and recorded in the audit log.`, confirmText: 'Apply' })) run('adj', async () => { await rpc('admin_adjust_balance', { p_account: adjAcc, p_amount: Number(adj.amount), p_reason: adj.reason.trim() }); setAdj({ account: '', amount: '', reason: '' }) }, 'Balance adjusted') }}>Apply adjustment</Btn>
          </section>
          <section className="space-y-3 rounded-lg border border-line p-4">
            <h3 className="text-[14px] font-semibold text-fg">Send a notification</h3>
            <Field label="Title"><Input value={msg.title} onChange={(e) => setMsg({ ...msg, title: e.target.value })} /></Field>
            <Field label="Message"><Textarea className="!min-h-[80px]" value={msg.body} onChange={(e) => setMsg({ ...msg, body: e.target.value })} /></Field>
            <Btn size="sm" variant="secondary" loading={busy === 'msg'} disabled={!msg.title.trim()} onClick={() => run('msg', async () => { await rpc('admin_broadcast', { p_title: msg.title.trim(), p_body: msg.body.trim(), p_user: id }); setMsg({ title: '', body: '' }) }, 'Notification sent')}>Send</Btn>
          </section>
          <section>
            <h3 className="mb-2 text-[14px] font-semibold text-fg">Recent activity</h3>
            {(tx.data || []).length === 0 ? <p className="text-[14px] text-soft">No transactions yet.</p> : <ul className="divide-y divide-line">{tx.data.map((t) => <li key={t.id} className="flex items-center gap-3 py-2.5 text-[13.5px]"><span className="w-[88px] shrink-0 text-soft">{dateTime(t.created_at)}</span><span className="flex-1 capitalize">{t.type.replace('_', ' ')}{t.symbol ? ` · ${t.symbol}` : ''}</span><span className={cx('font-semibold tabular-nums', Number(t.amount) >= 0 ? 'text-[#13a24d]' : 'text-fg')}>{signedMoney(t.amount)}</span><Badge tone={statusTone(t.status)}>{t.status}</Badge></li>)}</ul>}
          </section>
        </div>
      )}
    </Drawer>
  )
}
