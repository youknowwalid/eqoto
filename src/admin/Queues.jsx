import { useState } from 'react'
import { db, rpc, storage } from '../lib/supabase'
import { useQuery, useUi } from '../lib/store'
import { cx, date, dateTime, download, money, price, signedMoney, timeAgo, toCsv, units } from '../lib/format'
import { Avatar, Badge, Btn, Card, CardTitle, Empty, Field, Input, Loading, Modal, PageHead, Select, Tabs, Textarea, th, td, statusTone } from '../app/ui'
import * as I from '../app/icons'

/* ───────────── Verification queue ───────────── */
export function VerificationQueue() {
  const ui = useUi()
  const [tab, setTab] = useState('pending')
  const [note, setNote] = useState({ doc: null, text: '' })
  const [busy, setBusy] = useState('')
  const [view, setView] = useState(null)
  const q = useQuery(() => db.from('kyc_documents').select('*,owner:profiles!kyc_documents_user_id_fkey(full_name,email,kyc_status,country,dob)').eq('status', tab).order('created_at', { ascending: tab === 'pending' }).limit(100), [tab])
  const rows = q.data || []
  const open = async (d) => {
    try {
      const url = await storage.signedUrl('kyc', d.file_path, 300)
      setView({ d, url, pdf: /\.pdf$/i.test(d.file_name) })
    } catch (e) {
      ui.err(e)
    }
  }
  const review = async (d, approve, text) => {
    setBusy(d.id)
    try {
      await rpc('admin_review_doc', { p_doc: d.id, p_approve: approve, p_note: text || null })
      ui.ok(approve ? 'Document approved' : 'Document declined')
      setNote({ doc: null, text: '' })
      setView(null)
      q.reload()
    } catch (e) {
      ui.err(e)
    } finally {
      setBusy('')
    }
  }
  return (
    <>
      <PageHead title="Verification" sub="Review identity and address documents. A member is verified once both are approved." action={<Tabs tabs={[{ value: 'pending', label: 'Pending' }, { value: 'approved', label: 'Approved' }, { value: 'rejected', label: 'Declined' }]} value={tab} onChange={setTab} />} />
      <Card pad={false} className="overflow-hidden">
        {q.loading && !q.data ? <Loading /> : rows.length === 0 ? <Empty icon={I.ShieldI} title={tab === 'pending' ? 'Queue is empty' : 'Nothing here'} text={tab === 'pending' ? 'New documents appear here as soon as members upload them.' : undefined} /> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[760px]"><thead className="border-b border-line bg-canvas/60"><tr><th className={th}>Member</th><th className={th}>Document</th><th className={th}>File</th><th className={th}>Uploaded</th><th className={th}>{tab === 'pending' ? 'Decision' : 'Note'}</th></tr></thead>
            <tbody className="divide-y divide-line">{rows.map((d) => (
              <tr key={d.id}>
                <td className={td}><div className="flex items-center gap-3"><Avatar name={d.owner?.full_name || d.owner?.email} size={32} /><div><p className="font-semibold">{d.owner?.full_name || '—'}</p><p className="text-[12.5px] text-soft">{d.owner?.email}</p></div></div></td>
                <td className={td}><Badge tone={d.doc_type === 'id' ? 'blue' : 'violet'}>{d.doc_type === 'id' ? 'Identity' : 'Address'}</Badge></td>
                <td className={td}><button className="max-w-[200px] truncate font-semibold text-azure hover:underline" onClick={() => open(d)}>{d.file_name}</button></td>
                <td className={cx(td, 'text-soft')}>{timeAgo(d.created_at)}</td>
                <td className={td}>{tab === 'pending' ? <div className="flex gap-2"><Btn size="sm" loading={busy === d.id} onClick={() => review(d, true)}>Approve</Btn><Btn size="sm" variant="secondary" onClick={() => setNote({ doc: d, text: '' })}>Decline</Btn></div> : <span className="text-soft">{d.note || '—'}</span>}</td>
              </tr>
            ))}</tbody></table></div>
        )}
      </Card>
      <Modal open={!!view} onClose={() => setView(null)} wide title={view?.d.file_name} sub={`${view?.d.owner?.full_name || ''} · ${view?.d.doc_type === 'id' ? 'Proof of identity' : 'Proof of address'}`}
        footer={view?.d.status === 'pending' ? <><Btn variant="secondary" onClick={() => { setNote({ doc: view.d, text: '' }); setView(null) }}>Decline…</Btn><Btn loading={busy === view?.d.id} onClick={() => review(view.d, true)}>Approve</Btn></> : null}>
        {view && (view.pdf ? <iframe title="Document" src={view.url} className="h-[60vh] w-full rounded-lg border border-line" /> : <img src={view.url} alt="Uploaded document" className="mx-auto max-h-[60vh] rounded-lg border border-line object-contain" />)}
        {view && <dl className="mt-4 grid grid-cols-3 gap-3 text-[13px]"><div><dt className="text-soft">Country</dt><dd className="font-medium">{view.d.owner?.country || '—'}</dd></div><div><dt className="text-soft">Date of birth</dt><dd className="font-medium">{view.d.owner?.dob ? date(view.d.owner.dob) : '—'}</dd></div><div><dt className="text-soft">Account status</dt><dd className="font-medium capitalize">{view.d.owner?.kyc_status}</dd></div></dl>}
      </Modal>
      <Modal open={!!note.doc} onClose={() => setNote({ doc: null, text: '' })} title="Decline document" sub="The member sees this reason and can upload a new file."
        footer={<><Btn variant="secondary" onClick={() => setNote({ doc: null, text: '' })}>Cancel</Btn><Btn variant="danger" disabled={note.text.trim().length < 3} loading={busy === note.doc?.id} onClick={() => review(note.doc, false, note.text.trim())}>Decline</Btn></>}>
        <Field label="Reason"><Textarea value={note.text} onChange={(e) => setNote({ ...note, text: e.target.value })} placeholder="e.g. The photo is blurry. Please upload a clearer copy." /></Field>
        <div className="mt-3 flex flex-wrap gap-2">{['The image is blurry or cut off.', 'The document has expired.', 'Name does not match your profile.', 'Address document is older than 3 months.'].map((r) => <button key={r} className="rounded-full bg-canvas px-3 py-1 text-[12.5px] font-medium text-fg hover:bg-line" onClick={() => setNote({ ...note, text: r })}>{r}</button>)}</div>
      </Modal>
    </>
  )
}

/* ───────────── Transactions ───────────── */
export function Transactions() {
  const ui = useUi()
  const [tab, setTab] = useState('queue')
  const [type, setType] = useState('')
  const [qs, setQs] = useState('')
  const [busy, setBusy] = useState('')
  const [decline, setDecline] = useState(null)
  const [reason, setReason] = useState('')
  const q = useQuery(() => {
    let r = db.from('transactions').select('*,user:profiles!transactions_user_id_fkey(full_name,email,kyc_status)')
    if (tab === 'queue') r = r.eq('status', 'pending').in('type', ['deposit', 'withdrawal']).order('created_at')
    else {
      if (type) r = r.eq('type', type)
      r = r.order('created_at', { ascending: false })
    }
    return r.limit(300)
  }, [tab, type])
  const rows = (q.data || []).filter((t) => !qs || `${t.user?.full_name} ${t.user?.email} ${t.symbol || ''}`.toLowerCase().includes(qs.toLowerCase()))
  const act = async (t, approve, note) => {
    setBusy(t.id)
    try {
      await rpc('admin_review_tx', { p_tx: t.id, p_approve: approve, p_note: note || null })
      ui.ok(`${t.type === 'deposit' ? 'Deposit' : 'Withdrawal'} ${approve ? 'approved' : 'declined'}`)
      setDecline(null)
      setReason('')
      q.reload()
    } catch (e) {
      ui.err(e)
    } finally {
      setBusy('')
    }
  }
  const exportCsv = () => download('eqoto-transactions.csv', toCsv(rows.map((t) => ({ date: t.created_at, member: t.user?.email, type: t.type, symbol: t.symbol || '', amount: t.amount, fee: t.fee, status: t.status, method: t.method || '', note: t.note || '' }))))
  return (
    <>
      <PageHead title="Transactions" sub="Approve money requests and review everything that moved." action={<Tabs tabs={[{ value: 'queue', label: 'Approval queue' }, { value: 'all', label: 'All activity' }]} value={tab} onChange={setTab} />} />
      <Card pad={false} className="overflow-hidden">
        <div className="flex flex-wrap gap-3 border-b border-line p-4">
          <Input className="min-w-[220px] flex-1" placeholder="Filter by member or symbol" value={qs} onChange={(e) => setQs(e.target.value)} aria-label="Filter" />
          {tab === 'all' && <Select className="!w-[170px]" value={type} onChange={(e) => setType(e.target.value)} aria-label="Type"><option value="">All types</option>{['deposit', 'withdrawal', 'buy', 'sell', 'copy_start', 'copy_stop', 'adjustment', 'bonus'].map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}</Select>}
          <Btn variant="secondary" size="sm" className="self-center" onClick={exportCsv} disabled={!rows.length}><I.DownloadI size={15} />Export CSV</Btn>
        </div>
        {q.loading && !q.data ? <Loading /> : rows.length === 0 ? <Empty icon={I.ArrowsI} title={tab === 'queue' ? 'No requests waiting' : 'No transactions'} text={tab === 'queue' ? 'Deposits and withdrawals members request will appear here.' : undefined} /> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[860px]"><thead className="border-b border-line bg-canvas/60"><tr><th className={th}>Date</th><th className={th}>Member</th><th className={th}>Type</th><th className={th}>Detail</th><th className={th}>Amount</th>{tab !== 'queue' && <th className={th}>Status</th>}{tab === 'queue' && <th className={th}>Decision</th>}</tr></thead>
            <tbody className="divide-y divide-line">{rows.map((t) => (
              <tr key={t.id}>
                <td className={cx(td, 'whitespace-nowrap text-soft')}>{dateTime(t.created_at)}</td>
                <td className={td}><p className="font-semibold">{t.user?.full_name || '—'}</p><p className="text-[12.5px] text-soft">{t.user?.email}</p></td>
                <td className={cx(td, 'capitalize')}>{t.type.replace('_', ' ')}</td>
                <td className={cx(td, 'max-w-[220px] truncate text-soft')}>{t.symbol ? `${t.symbol} · ${units(t.units)} @ ${price(t.price)}` : t.method || t.note || '—'}{t.type === 'withdrawal' && t.status === 'pending' && t.user?.kyc_status !== 'verified' && <Badge tone="red" className="ml-2">Not verified</Badge>}</td>
                <td className={cx(td, 'font-semibold tabular-nums', Number(t.amount) >= 0 ? 'text-[#13a24d]' : 'text-fg')}>{signedMoney(t.amount)}</td>
                {tab !== 'queue' && <td className={td}><Badge tone={statusTone(t.status)}>{t.status}</Badge></td>}
                {tab === 'queue' && <td className={td}><div className="flex gap-2"><Btn size="sm" loading={busy === t.id} onClick={() => act(t, true)}>Approve</Btn><Btn size="sm" variant="secondary" onClick={() => setDecline(t)}>Decline</Btn></div></td>}
              </tr>
            ))}</tbody></table></div>
        )}
      </Card>
      <Modal open={!!decline} onClose={() => setDecline(null)} title={`Decline ${decline?.type}`} sub={decline ? `${money(Math.abs(decline.amount))} · ${decline.user?.email}` : ''} footer={<><Btn variant="secondary" onClick={() => setDecline(null)}>Cancel</Btn><Btn variant="danger" loading={busy === decline?.id} onClick={() => act(decline, false, reason.trim())}>Decline request</Btn></>}>
        <Field label="Reason (optional)" hint={decline?.type === 'withdrawal' ? 'Held funds return to the member’s balance.' : undefined}><Textarea value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
      </Modal>
    </>
  )
}
