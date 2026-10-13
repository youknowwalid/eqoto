import { useState } from 'react'
import { db } from '../lib/supabase'
import { useQuery, useUi } from '../lib/store'
import { cx, date, dateTime } from '../lib/format'
import { Badge, Btn, Card, Empty, Field, Input, Loading, Modal, PageHead, Select, Tabs, Textarea, Toggle, th, td, statusTone } from '../app/ui'
import * as I from '../app/icons'

export default function Content() {
  const [tab, setTab] = useState('articles')
  return (
    <>
      <PageHead title="Content" sub="Academy lessons and the economic calendar." action={<Tabs tabs={[{ value: 'articles', label: 'Academy lessons' }, { value: 'events', label: 'Calendar events' }]} value={tab} onChange={setTab} />} />
      {tab === 'articles' ? <Articles /> : <Events />}
    </>
  )
}

const BLANK_A = { title: '', category: 'Basics', summary: '', body: '', minutes: 5, published: true }
function Articles() {
  const ui = useUi()
  const [f, setF] = useState(null)
  const [busy, setBusy] = useState(false)
  const q = useQuery(() => db.from('articles').select('*').order('created_at', { ascending: false }), [])
  const save = async () => {
    if (f.title.trim().length < 3 || !f.body.trim()) return ui.err('A title and body are required')
    setBusy(true)
    const body = { title: f.title.trim(), category: f.category.trim() || 'Basics', summary: f.summary.trim(), body: f.body, minutes: Math.max(1, Number(f.minutes) || 5), published: f.published }
    try {
      if (f.id) await db.from('articles').update(body).eq('id', f.id)
      else await db.from('articles').insert(body)
      ui.ok('Lesson saved')
      setF(null)
      q.reload()
    } catch (e) {
      ui.err(e)
    } finally {
      setBusy(false)
    }
  }
  const del = async (a) => {
    if (!(await ui.confirm({ title: 'Delete this lesson?', message: a.title, confirmText: 'Delete', danger: true }))) return
    try {
      await db.from('articles').remove().eq('id', a.id)
      q.reload()
    } catch (e) {
      ui.err(e)
    }
  }
  return (
    <>
      <div className="mb-4 flex justify-end"><Btn onClick={() => setF(BLANK_A)}><I.PlusI size={16} />New lesson</Btn></div>
      <Card pad={false} className="overflow-hidden">
        {q.loading && !q.data ? <Loading /> : (q.data || []).length === 0 ? <Empty icon={I.BookI} title="No lessons yet" /> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[640px]"><thead className="border-b border-line bg-canvas/60"><tr><th className={th}>Title</th><th className={th}>Category</th><th className={th}>Length</th><th className={th}>Published</th><th className={th}>Created</th><th className={th} /></tr></thead>
            <tbody className="divide-y divide-line">{q.data.map((a) => (
              <tr key={a.id}><td className={cx(td, 'max-w-[320px] truncate font-semibold')}>{a.title}</td><td className={td}><Badge tone="blue">{a.category}</Badge></td><td className={td}>{a.minutes} min</td>
                <td className={td}><Toggle checked={a.published} label="Published" onChange={async (v) => { try { await db.from('articles').update({ published: v }).eq('id', a.id); q.reload() } catch (e) { ui.err(e) } }} /></td>
                <td className={cx(td, 'text-soft')}>{date(a.created_at)}</td>
                <td className={td}><div className="flex gap-2"><Btn size="sm" variant="secondary" onClick={() => setF(a)}>Edit</Btn><Btn size="sm" variant="secondary" aria-label="Delete" onClick={() => del(a)}><I.TrashI size={15} /></Btn></div></td></tr>
            ))}</tbody></table></div>
        )}
      </Card>
      <Modal open={!!f} onClose={() => setF(null)} wide title={f?.id ? 'Edit lesson' : 'New lesson'} footer={<><Btn variant="secondary" onClick={() => setF(null)}>Cancel</Btn><Btn loading={busy} onClick={save}>Save lesson</Btn></>}>
        {f && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title" className="sm:col-span-2"><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
            <Field label="Category"><Input value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} /></Field>
            <Field label="Minutes to read"><Input type="number" min="1" value={f.minutes} onChange={(e) => setF({ ...f, minutes: e.target.value })} /></Field>
            <Field label="Summary" className="sm:col-span-2"><Textarea className="!min-h-[70px]" value={f.summary} onChange={(e) => setF({ ...f, summary: e.target.value })} /></Field>
            <Field label="Body" hint="Separate paragraphs with a blank line. Start a line with ## for a heading." className="sm:col-span-2"><Textarea className="!min-h-[200px]" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} /></Field>
            <label className="flex items-center gap-3 text-[14px]"><Toggle checked={f.published} onChange={(v) => setF({ ...f, published: v })} label="Published" />Published</label>
          </div>
        )}
      </Modal>
    </>
  )
}

const toLocal = (d) => { const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 16) }
function Events() {
  const ui = useUi()
  const [f, setF] = useState(null)
  const [busy, setBusy] = useState(false)
  const q = useQuery(() => db.from('events').select('*').order('starts_at', { ascending: false }).limit(100), [])
  const save = async () => {
    if (f.title.trim().length < 3 || !f.starts_at) return ui.err('A title and date are required')
    setBusy(true)
    const body = { title: f.title.trim(), region: f.region.trim() || 'US', impact: f.impact, starts_at: new Date(f.starts_at).toISOString(), forecast: f.forecast || null, previous: f.previous || null }
    try {
      if (f.id) await db.from('events').update(body).eq('id', f.id)
      else await db.from('events').insert(body)
      ui.ok('Event saved')
      setF(null)
      q.reload()
    } catch (e) {
      ui.err(e)
    } finally {
      setBusy(false)
    }
  }
  const del = async (e) => {
    if (!(await ui.confirm({ title: 'Delete this event?', message: e.title, confirmText: 'Delete', danger: true }))) return
    try {
      await db.from('events').remove().eq('id', e.id)
      q.reload()
    } catch (er) {
      ui.err(er)
    }
  }
  return (
    <>
      <div className="mb-4 flex justify-end"><Btn onClick={() => setF({ title: '', region: 'US', impact: 'medium', starts_at: toLocal(Date.now() + 86400000), forecast: '', previous: '' })}><I.PlusI size={16} />New event</Btn></div>
      <Card pad={false} className="overflow-hidden">
        {q.loading && !q.data ? <Loading /> : (q.data || []).length === 0 ? <Empty icon={I.CalendarI} title="No events" /> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[720px]"><thead className="border-b border-line bg-canvas/60"><tr><th className={th}>When</th><th className={th}>Event</th><th className={th}>Region</th><th className={th}>Impact</th><th className={th}>Forecast</th><th className={th}>Previous</th><th className={th} /></tr></thead>
            <tbody className="divide-y divide-line">{q.data.map((e) => (
              <tr key={e.id}><td className={cx(td, 'whitespace-nowrap')}>{dateTime(e.starts_at)}</td><td className={cx(td, 'max-w-[280px] truncate font-semibold')}>{e.title}</td><td className={td}>{e.region}</td><td className={td}><Badge tone={statusTone(e.impact)}>{e.impact}</Badge></td><td className={td}>{e.forecast || '—'}</td><td className={td}>{e.previous || '—'}</td>
                <td className={td}><div className="flex gap-2"><Btn size="sm" variant="secondary" onClick={() => setF({ ...e, starts_at: toLocal(e.starts_at), forecast: e.forecast || '', previous: e.previous || '' })}>Edit</Btn><Btn size="sm" variant="secondary" aria-label="Delete" onClick={() => del(e)}><I.TrashI size={15} /></Btn></div></td></tr>
            ))}</tbody></table></div>
        )}
      </Card>
      <Modal open={!!f} onClose={() => setF(null)} title={f?.id ? 'Edit event' : 'New event'} footer={<><Btn variant="secondary" onClick={() => setF(null)}>Cancel</Btn><Btn loading={busy} onClick={save}>Save event</Btn></>}>
        {f && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title" className="sm:col-span-2"><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
            <Field label="Date and time"><Input type="datetime-local" value={f.starts_at} onChange={(e) => setF({ ...f, starts_at: e.target.value })} /></Field>
            <Field label="Region"><Input value={f.region} onChange={(e) => setF({ ...f, region: e.target.value })} maxLength={12} /></Field>
            <Field label="Impact"><Select value={f.impact} onChange={(e) => setF({ ...f, impact: e.target.value })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></Select></Field>
            <div />
            <Field label="Forecast"><Input value={f.forecast} onChange={(e) => setF({ ...f, forecast: e.target.value })} /></Field>
            <Field label="Previous"><Input value={f.previous} onChange={(e) => setF({ ...f, previous: e.target.value })} /></Field>
          </div>
        )}
      </Modal>
    </>
  )
}
