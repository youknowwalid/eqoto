import { useEffect, useRef, useState } from 'react'
import { db } from '../../lib/supabase'
import { useAuth, useQuery, useUi } from '../../lib/store'
import { Link, useNavigate, useParams } from '../../lib/router'
import { cx, date, dateTime, timeAgo } from '../../lib/format'
import { Badge, Btn, Card, CardTitle, Empty, Field, Input, Loading, Modal, PageHead, Select, Textarea, statusTone } from '../ui'
import * as I from '../icons'

const FAQ = [
  ['How do I start trading?', 'Pick any instrument in Discover or your Watchlist, press Trade, enter an amount and confirm. You can practise first on the demo account, which comes with virtual funds.'],
  ['How long do deposits take?', 'Deposit requests are reviewed by our team. Once approved, funds appear in your Wallet and you will get a notification.'],
  ['Why can I not withdraw yet?', 'Withdrawals unlock after your identity and address documents are approved in the Verification Centre.'],
  ['What does Mirror Pro Investors do?', 'You allocate an amount to an investor and your allocation follows their performance. You can stop at any time and the current value returns to your balance.'],
  ['Are the prices real?', 'No. Finvero is a demonstration platform. Prices, investors and balances are simulated and nothing here is investment advice.'],
  ['How do I reset the demo account?', 'Open Portfolio, switch to the demo account and choose Reset demo account. Your virtual balance and positions are restored.'],
]

export default function Help() {
  const { user } = useAuth()
  const nav = useNavigate()
  const ui = useUi()
  const [open, setOpen] = useState(0)
  const [modal, setModal] = useState(false)
  const [f, setF] = useState({ subject: '', category: 'General', priority: 'normal', body: '' })
  const [busy, setBusy] = useState(false)
  const q = useQuery(() => db.from('tickets').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }), [user.id])
  const create = async () => {
    if (f.subject.trim().length < 3) return ui.err('Please add a short subject')
    if (!f.body.trim()) return ui.err('Please describe the problem')
    setBusy(true)
    try {
      const [t] = await db.from('tickets').insert({ user_id: user.id, subject: f.subject.trim(), category: f.category, priority: f.priority }).select()
      await db.from('ticket_messages').insert({ ticket_id: t.id, sender_id: user.id, is_staff: false, body: f.body.trim() })
      setModal(false)
      setF({ subject: '', category: 'General', priority: 'normal', body: '' })
      ui.ok('Request sent. We will reply here.')
      nav(`/app/help/${t.id}`)
    } catch (e) {
      ui.err(e)
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <PageHead title="Help & Resources" sub="Answers to common questions, or talk to our team." action={<Btn onClick={() => setModal(true)}><I.PlusI size={16} />New request</Btn>} />
      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardTitle title="Frequently asked" />
          <ul className="divide-y divide-line">{FAQ.map(([qq, a], i) => (
            <li key={qq}><button className="flex w-full items-center justify-between gap-3 py-4 text-left text-[15px] font-semibold text-fg" aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)}>{qq}<I.ChevDownI size={18} className={cx('shrink-0 text-soft transition', open === i && 'rotate-180')} /></button>{open === i && <p className="pb-4 text-[14.5px] leading-relaxed text-soft">{a}</p>}</li>
          ))}</ul>
          <div className="mt-4 flex flex-wrap gap-3 border-t border-line pt-4 text-[14px]"><Link to="/app/academy" className="font-semibold text-azure hover:underline">Browse the Academy</Link><Link to="/app/verification" className="font-semibold text-azure hover:underline">Verification Centre</Link></div>
        </Card>
        <Card pad={false}>
          <div className="px-5 pt-5"><CardTitle title="Your requests" /></div>
          {q.loading && !q.data ? <Loading /> : (q.data || []).length === 0 ? <Empty icon={I.LifebuoyI} title="No requests yet" text="When you contact us, the conversation appears here." /> : (
            <ul className="divide-y divide-line pb-2">{q.data.map((t) => (
              <li key={t.id}><Link to={`/app/help/${t.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-canvas"><div className="min-w-0 flex-1"><p className="truncate text-[14.5px] font-semibold text-fg">{t.subject}</p><p className="text-[12.5px] text-soft">{t.category} · updated {timeAgo(t.updated_at)}</p></div><Badge tone={statusTone(t.status)}>{t.status}</Badge></Link></li>
            ))}</ul>
          )}
        </Card>
      </div>
      <Modal open={modal} onClose={() => setModal(false)} title="Contact support" footer={<><Btn variant="secondary" onClick={() => setModal(false)}>Cancel</Btn><Btn loading={busy} onClick={create}>Send request</Btn></>}>
        <div className="space-y-4">
          <Field label="Subject"><Input value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} maxLength={140} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Topic"><Select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{['General', 'Deposits & withdrawals', 'Trading', 'Verification', 'Mirror investing', 'Technical problem'].map((c) => <option key={c}>{c}</option>)}</Select></Field>
            <Field label="Priority"><Select value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option></Select></Field>
          </div>
          <Field label="How can we help?"><Textarea value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} maxLength={4000} /></Field>
        </div>
      </Modal>
    </>
  )
}

export function TicketThread() {
  const params = useParams()
  const { user } = useAuth()
  const ui = useUi()
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const end = useRef(null)
  const t = useQuery(() => db.from('tickets').select('*').eq('id', params.id).maybeSingle(), [params.id])
  const m = useQuery(() => db.from('ticket_messages').select('*').eq('ticket_id', params.id).order('created_at'), [params.id])
  useEffect(() => {
    const i = setInterval(m.reload, 15000)
    return () => clearInterval(i)
  }, [m.reload])
  useEffect(() => end.current?.scrollIntoView({ block: 'end' }), [m.data?.length])
  if (t.loading && !t.data) return <Loading />
  if (!t.data) return <Empty title="Request not found" action={<Link to="/app/help"><Btn>Back to Help</Btn></Link>} />
  const closed = t.data.status === 'closed'
  const send = async () => {
    if (!text.trim()) return
    setBusy(true)
    try {
      await db.from('ticket_messages').insert({ ticket_id: t.data.id, sender_id: user.id, is_staff: false, body: text.trim() })
      setText('')
      m.reload()
    } catch (e) {
      ui.err(e)
    } finally {
      setBusy(false)
    }
  }
  const setStatus = async (status) => {
    try {
      await db.from('tickets').update({ status }).eq('id', t.data.id)
      t.reload()
    } catch (e) {
      ui.err(e)
    }
  }
  return (
    <>
      <Link to="/app/help" className="mb-3 inline-flex items-center gap-1 text-[14px] font-semibold text-azure hover:underline"><I.ChevLeftI size={17} />Help & Resources</Link>
      <PageHead title={t.data.subject} sub={`${t.data.category} · opened ${date(t.data.created_at)}`} action={<div className="flex items-center gap-2"><Badge tone={statusTone(t.data.status)}>{t.data.status}</Badge>{closed ? <Btn size="sm" variant="secondary" onClick={() => setStatus('open')}>Reopen</Btn> : <Btn size="sm" variant="secondary" onClick={() => setStatus('closed')}>Close request</Btn>}</div>} />
      <Card pad={false}>
        <div className="max-h-[52vh] min-h-[220px] space-y-4 overflow-y-auto p-5">
          {(m.data || []).map((x) => (
            <div key={x.id} className={cx('flex', x.is_staff ? 'justify-start' : 'justify-end')}><div className={cx('max-w-[85%] rounded-2xl px-4 py-3 text-[14.5px] leading-relaxed', x.is_staff ? 'rounded-bl-sm bg-canvas text-fg' : 'rounded-br-sm bg-navy text-white')}><p className="whitespace-pre-wrap break-words">{x.body}</p><p className={cx('mt-1 text-[11.5px]', x.is_staff ? 'text-soft' : 'text-white/60')}>{x.is_staff ? 'Finvero support' : 'You'} · {dateTime(x.created_at)}</p></div></div>
          ))}
          <div ref={end} />
        </div>
        {closed ? <p className="border-t border-line p-4 text-center text-[14px] text-soft">This request is closed. Reopen it to reply.</p> : (
          <div className="flex gap-3 border-t border-line p-4"><Textarea className="!min-h-[56px] flex-1" rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a reply…" maxLength={4000} onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === 'Enter' && send()} /><Btn loading={busy} onClick={send} className="self-end"><I.SendI size={16} />Send</Btn></div>
        )}
      </Card>
    </>
  )
}
