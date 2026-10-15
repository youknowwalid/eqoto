import { useEffect, useState } from 'react'
import { db, rpc } from '../lib/supabase'
import { useQuery, useUi } from '../lib/store'
import { cx, dateTime, download, toCsv } from '../lib/format'
import { Badge, Btn, Card, CardTitle, Empty, ErrorBox, Field, Input, Loading, PageHead, Select, Textarea, Toggle, th, td } from '../app/ui'
import * as I from '../app/icons'

export function Broadcast() {
  const ui = useUi()
  const [f, setF] = useState({ title: '', body: '' })
  const [busy, setBusy] = useState(false)
  const users = useQuery(() => db.from('profiles').select('id', { count: true }).limit(1), [])
  const send = async () => {
    if (!(await ui.confirm({ title: 'Send to every member?', message: `“${f.title}” will appear in all ${users.data?.total ?? ''} members’ notification bells.`, confirmText: 'Send to everyone' }))) return
    setBusy(true)
    try {
      await rpc('admin_broadcast', { p_title: f.title.trim(), p_body: f.body.trim(), p_user: null })
      ui.ok('Broadcast sent')
      setF({ title: '', body: '' })
    } catch (e) {
      ui.err(e)
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <PageHead title="Notifications" sub="Send a message to every member. To message one person, open them in Users." />
      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardTitle title="New broadcast" />
          <div className="space-y-4"><Field label="Title"><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} maxLength={80} /></Field><Field label="Message"><Textarea value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} maxLength={400} /></Field><Btn loading={busy} disabled={f.title.trim().length < 3} onClick={send}><I.MegaphoneI size={16} />Send to all members</Btn></div>
        </Card>
        <Card>
          <CardTitle title="Preview" />
          <div className="rounded-xl border border-line bg-canvas p-4"><p className="text-[14px] font-semibold text-fg">{f.title || 'Your title'}</p><p className="mt-0.5 text-[13px] text-soft">{f.body || 'Your message appears here, exactly as members will see it.'}</p></div>
        </Card>
      </div>
    </>
  )
}

export function PlatformSettings() {
  const ui = useUi()
  const q = useQuery(() => db.from('platform_settings').select('*').eq('id', 1).maybeSingle(), [])
  const [f, setF] = useState(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => { if (q.data) setF(q.data) }, [q.data])
  if (q.loading && !f) return <Loading />
  if (q.error && !f) return <ErrorBox error={q.error} retry={q.reload} />
  if (!f) return null
  const num = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const save = async () => {
    setBusy(true)
    try {
      await db.from('platform_settings').update({ announcement: f.announcement, announcement_active: f.announcement_active, min_deposit: Number(f.min_deposit), min_withdrawal: Number(f.min_withdrawal), withdrawal_fee_pct: Number(f.withdrawal_fee_pct), trade_fee: Number(f.trade_fee), min_copy: Number(f.min_copy), trading_enabled: f.trading_enabled, signups_enabled: f.signups_enabled, updated_at: new Date().toISOString() }).eq('id', 1)
      ui.ok('Settings saved')
      q.reload()
    } catch (e) {
      ui.err(e)
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <PageHead title="Platform settings" sub="Fees, limits and switches that apply to everyone." action={<Btn loading={busy} onClick={save}>Save changes</Btn>} />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardTitle title="Switches" />
          {[['trading_enabled', 'Trading enabled', 'Turn off to pause all orders and mirroring. Useful during maintenance.'], ['signups_enabled', 'New sign-ups open', 'When off, new people cannot create an account.']].map(([k, t, d]) => (
            <div key={k} className="flex items-center gap-4 border-b border-line py-4 last:border-0"><div className="flex-1"><p className="text-[14.5px] font-semibold text-fg">{t}</p><p className="text-[13px] text-soft">{d}</p></div><Toggle checked={f[k]} onChange={(v) => setF({ ...f, [k]: v })} label={t} /></div>
          ))}
        </Card>
        <Card>
          <CardTitle title="Fees and limits" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Trade fee (USD)"><Input type="number" step="0.01" min="0" value={f.trade_fee} onChange={num('trade_fee')} /></Field>
            <Field label="Withdrawal fee (%)"><Input type="number" step="0.1" min="0" value={f.withdrawal_fee_pct} onChange={num('withdrawal_fee_pct')} /></Field>
            <Field label="Minimum deposit"><Input type="number" min="1" value={f.min_deposit} onChange={num('min_deposit')} /></Field>
            <Field label="Minimum withdrawal"><Input type="number" min="1" value={f.min_withdrawal} onChange={num('min_withdrawal')} /></Field>
            <Field label="Minimum mirror amount"><Input type="number" min="1" value={f.min_copy} onChange={num('min_copy')} /></Field>
          </div>
        </Card>
        <Card className="lg:col-span-2">
          <CardTitle title="Announcement banner" sub="Shown at the top of every member’s dashboard." />
          <div className="flex items-start gap-4"><Toggle checked={f.announcement_active} onChange={(v) => setF({ ...f, announcement_active: v })} label="Show banner" /><Textarea className="!min-h-[80px] flex-1" value={f.announcement || ''} onChange={(e) => setF({ ...f, announcement: e.target.value })} maxLength={300} /></div>
        </Card>
      </div>
      <p className="mt-4 text-[12.5px] text-soft">Last updated {dateTime(f.updated_at)}. Price simulation last ran {f.last_tick ? dateTime(f.last_tick) : 'never'}.</p>
    </>
  )
}

export function Audit() {
  const [action, setAction] = useState('')
  const [qs, setQs] = useState('')
  const q = useQuery(() => db.from('audit_log').select('*,actor:profiles!audit_log_actor_id_fkey(full_name,email)').order('created_at', { ascending: false }).limit(300), [])
  const rows = (q.data || []).filter((r) => (!action || r.action === action) && `${r.action} ${r.entity} ${r.entity_id} ${r.actor?.email} ${JSON.stringify(r.meta)}`.toLowerCase().includes(qs.toLowerCase()))
  const actions = [...new Set((q.data || []).map((r) => r.action))].sort()
  return (
    <>
      <PageHead title="Audit log" sub="Every admin action and sensitive change, newest first." action={<Btn variant="secondary" size="sm" disabled={!rows.length} onClick={() => download('finvero-audit.csv', toCsv(rows.map((r) => ({ time: r.created_at, actor: r.actor?.email || '', action: r.action, entity: r.entity, id: r.entity_id, meta: JSON.stringify(r.meta) }))))}><I.DownloadI size={15} />Export CSV</Btn>} />
      <Card pad={false} className="overflow-hidden">
        <div className="flex flex-wrap gap-3 border-b border-line p-4"><Input className="min-w-[220px] flex-1" placeholder="Search the log" value={qs} onChange={(e) => setQs(e.target.value)} aria-label="Search" /><Select className="!w-[220px]" value={action} onChange={(e) => setAction(e.target.value)} aria-label="Action"><option value="">All actions</option>{actions.map((a) => <option key={a}>{a}</option>)}</Select></div>
        {q.loading && !q.data ? <Loading /> : rows.length === 0 ? <Empty icon={I.ListI} title="Nothing logged yet" text="Admin actions will be recorded here." /> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[760px]"><thead className="border-b border-line bg-canvas/60"><tr><th className={th}>Time</th><th className={th}>Actor</th><th className={th}>Action</th><th className={th}>Entity</th><th className={th}>Details</th></tr></thead>
            <tbody className="divide-y divide-line">{rows.map((r) => (
              <tr key={r.id}><td className={cx(td, 'whitespace-nowrap text-soft')}>{dateTime(r.created_at)}</td><td className={td}>{r.actor?.email || 'system'}</td><td className={td}><Badge tone="violet">{r.action}</Badge></td><td className={cx(td, 'max-w-[180px] truncate text-soft')}>{r.entity}{r.entity_id ? ` · ${String(r.entity_id).slice(0, 8)}` : ''}</td><td className={cx(td, 'max-w-[320px] truncate font-mono text-[12px] text-soft')} title={JSON.stringify(r.meta)}>{JSON.stringify(r.meta)}</td></tr>
            ))}</tbody></table></div>
        )}
      </Card>
    </>
  )
}
