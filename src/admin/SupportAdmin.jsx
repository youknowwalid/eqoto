import { useEffect, useRef, useState } from 'react'
import { db } from '../lib/supabase'
import { useAuth, useQuery, useUi } from '../lib/store'
import { cx, dateTime, timeAgo } from '../lib/format'
import { Avatar, Badge, Btn, Card, Drawer, Empty, Loading, PageHead, Select, Tabs, Textarea, th, td, statusTone } from '../app/ui'
import * as I from '../app/icons'

const CANNED = ['Thanks for getting in touch. We are looking into this now.', 'Your request has been resolved. Please let us know if anything else comes up.', 'Could you share a screenshot or the exact time this happened?']

export default function SupportAdmin() {
  const [tab, setTab] = useState('open')
  const [sel, setSel] = useState(null)
  const q = useQuery(() => {
    let r = db.from('tickets').select('*,user:profiles!tickets_user_id_fkey(full_name,email)')
    if (tab !== 'all') r = r.eq('status', tab)
    return r.order('updated_at', { ascending: false }).limit(200)
  }, [tab])
  useEffect(() => {
    const t = setInterval(q.reload, 30000)
    return () => clearInterval(t)
  }, [q.reload])
  const rows = q.data || []
  const prio = { high: 0, normal: 1, low: 2 }
  const sorted = tab === 'open' ? [...rows].sort((a, b) => prio[a.priority] - prio[b.priority]) : rows
  return (
    <>
      <PageHead title="Support" sub="Reply to members and close requests when they are done." action={<Tabs tabs={[{ value: 'open', label: 'Open' }, { value: 'pending', label: 'Waiting' }, { value: 'closed', label: 'Closed' }, { value: 'all', label: 'All' }]} value={tab} onChange={setTab} />} />
      <Card pad={false} className="overflow-hidden">
        {q.loading && !q.data ? <Loading /> : sorted.length === 0 ? <Empty icon={I.LifebuoyI} title="No requests" text="Nothing in this view." /> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[720px]"><thead className="border-b border-line bg-canvas/60"><tr><th className={th}>Subject</th><th className={th}>Member</th><th className={th}>Topic</th><th className={th}>Priority</th><th className={th}>Status</th><th className={th}>Updated</th></tr></thead>
            <tbody className="divide-y divide-line">{sorted.map((t) => (
              <tr key={t.id} className="cursor-pointer hover:bg-canvas" onClick={() => setSel(t)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setSel(t)}>
                <td className={cx(td, 'max-w-[280px] truncate font-semibold')}>{t.subject}</td>
                <td className={td}><div className="flex items-center gap-2.5"><Avatar name={t.user?.full_name || t.user?.email} size={28} /><span className="truncate">{t.user?.full_name || t.user?.email}</span></div></td>
                <td className={td}>{t.category}</td><td className={td}><Badge tone={statusTone(t.priority)}>{t.priority}</Badge></td><td className={td}><Badge tone={statusTone(t.status)}>{t.status}</Badge></td><td className={cx(td, 'text-soft')}>{timeAgo(t.updated_at)}</td>
              </tr>
            ))}</tbody></table></div>
        )}
      </Card>
      <Thread ticket={sel} onClose={() => setSel(null)} onChanged={q.reload} />
    </>
  )
}

function Thread({ ticket, onClose, onChanged }) {
  const { user } = useAuth()
  const ui = useUi()
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState(ticket?.status)
  const end = useRef(null)
  const m = useQuery(() => (ticket ? db.from('ticket_messages').select('*').eq('ticket_id', ticket.id).order('created_at') : []), [ticket?.id])
  useEffect(() => setStatus(ticket?.status), [ticket])
  useEffect(() => end.current?.scrollIntoView({ block: 'end' }), [m.data?.length])
  const send = async () => {
    if (!text.trim()) return
    setBusy(true)
    try {
      await db.from('ticket_messages').insert({ ticket_id: ticket.id, sender_id: user.id, is_staff: true, body: text.trim() })
      setText('')
      m.reload()
      onChanged()
    } catch (e) {
      ui.err(e)
    } finally {
      setBusy(false)
    }
  }
  const changeStatus = async (s) => {
    try {
      await db.from('tickets').update({ status: s }).eq('id', ticket.id)
      setStatus(s)
      onChanged()
      ui.ok(`Marked ${s}`)
    } catch (e) {
      ui.err(e)
    }
  }
  return (
    <Drawer open={!!ticket} onClose={onClose} title={ticket?.subject} sub={ticket ? `${ticket.user?.full_name || ''} · ${ticket.user?.email}` : ''} width={620}>
      {ticket && (
        <div className="flex h-full flex-col">
          <div className="mb-4 flex items-center gap-3"><Badge tone={statusTone(ticket.priority)}>{ticket.priority} priority</Badge><span className="text-[13px] text-soft">{ticket.category}</span><Select className="!ml-auto !h-9 !w-[130px]" value={status} onChange={(e) => changeStatus(e.target.value)} aria-label="Status"><option value="open">Open</option><option value="pending">Waiting</option><option value="closed">Closed</option></Select></div>
          <div className="flex-1 space-y-3 overflow-y-auto pb-4">
            {m.loading && !m.data ? <Loading /> : (m.data || []).map((x) => (
              <div key={x.id} className={cx('flex', x.is_staff ? 'justify-end' : 'justify-start')}><div className={cx('max-w-[88%] rounded-2xl px-4 py-3 text-[14.5px] leading-relaxed', x.is_staff ? 'rounded-br-sm bg-azure text-white' : 'rounded-bl-sm bg-canvas text-fg')}><p className="whitespace-pre-wrap break-words">{x.body}</p><p className={cx('mt-1 text-[11.5px]', x.is_staff ? 'text-white/70' : 'text-soft')}>{x.is_staff ? 'Support' : ticket.user?.full_name || 'Member'} · {dateTime(x.created_at)}</p></div></div>
            ))}
            <div ref={end} />
          </div>
          <div className="border-t border-line pt-4">
            <div className="mb-2 flex flex-wrap gap-2">{CANNED.map((c) => <button key={c} className="rounded-full bg-canvas px-3 py-1 text-[12px] font-medium text-fg hover:bg-line" onClick={() => setText(c)}>{c.slice(0, 34)}…</button>)}</div>
            <Textarea className="!min-h-[90px]" value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a reply…" maxLength={4000} onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === 'Enter' && send()} />
            <div className="mt-3 flex justify-end"><Btn loading={busy} onClick={send}><I.SendI size={16} />Send reply</Btn></div>
          </div>
        </div>
      )}
    </Drawer>
  )
}
