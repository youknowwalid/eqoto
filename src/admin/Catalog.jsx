import { useMemo, useState } from 'react'
import { db, rpc } from '../lib/supabase'
import { useMarket, useQuery, useUi } from '../lib/store'
import { cx, num, pct, price } from '../lib/format'
import { Badge, Btn, Card, CardTitle, Chg, Empty, Field, Input, Loading, Modal, PageHead, Select, Tabs, Textarea, Toggle, th, td } from '../app/ui'
import { InstrumentMark, InvestorFace } from '../app/shared'
import * as I from '../app/icons'

/* ───────────── Markets ───────────── */
export function MarketsAdmin() {
  const ui = useUi()
  const { refresh, change } = useMarket()
  const [kind, setKind] = useState('all')
  const [qs, setQs] = useState('')
  const [edit, setEdit] = useState(null)
  const [add, setAdd] = useState(false)
  const [shock, setShock] = useState('')
  const [busy, setBusy] = useState('')
  const q = useQuery(() => db.from('instruments').select('*').order('symbol'), [])
  const rows = (q.data || []).filter((i) => (kind === 'all' || i.kind === kind) && `${i.symbol} ${i.name}`.toLowerCase().includes(qs.toLowerCase()))
  const done = () => { q.reload(); refresh?.() }
  const flip = async (i, patch) => {
    try {
      await db.from('instruments').update(patch).eq('symbol', i.symbol)
      done()
    } catch (e) {
      ui.err(e)
    }
  }
  const runShock = async (p) => {
    if (!(await ui.confirm({ title: `Move every price ${p > 0 ? 'up' : 'down'} ${Math.abs(p)}%?`, message: 'This applies to all instruments immediately and changes every member’s portfolio value.', confirmText: 'Apply', danger: p < 0 }))) return
    setBusy('shock')
    try {
      await rpc('admin_market_shock', { p_pct: p })
      ui.ok(`Market moved ${p > 0 ? '+' : ''}${p}%`)
      done()
    } catch (e) {
      ui.err(e)
    } finally {
      setBusy('')
    }
  }
  return (
    <>
      <PageHead title="Markets" sub="Prices on Finvero are simulated. You control them here." action={<Btn onClick={() => setAdd(true)}><I.PlusI size={16} />Add instrument</Btn>} />
      <Card className="mb-5">
        <CardTitle title="Market shock" sub="Move every instrument at once, useful for demos and stress tests." />
        <div className="flex flex-wrap items-center gap-2">{[-10, -5, -2, 2, 5, 10].map((p) => <Btn key={p} size="sm" variant={p < 0 ? 'secondary' : 'soft'} disabled={busy === 'shock'} onClick={() => runShock(p)}>{p > 0 ? '+' : ''}{p}%</Btn>)}
          <span className="mx-1 text-soft">or</span><Input className="!h-8 !w-[120px]" type="number" step="0.1" placeholder="Custom %" value={shock} onChange={(e) => setShock(e.target.value)} aria-label="Custom percent" /><Btn size="sm" disabled={!Number(shock) || Math.abs(Number(shock)) > 50} onClick={() => runShock(Number(shock))}>Apply</Btn></div>
      </Card>
      <Card pad={false} className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-4"><Input className="min-w-[200px] flex-1" placeholder="Search symbol or name" value={qs} onChange={(e) => setQs(e.target.value)} aria-label="Search" /><Tabs tabs={[{ value: 'all', label: 'All' }, { value: 'stock', label: 'Stocks' }, { value: 'etf', label: 'ETFs' }, { value: 'crypto', label: 'Crypto' }]} value={kind} onChange={setKind} /></div>
        {q.loading && !q.data ? <Loading /> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[820px]"><thead className="border-b border-line bg-canvas/60"><tr><th className={th}>Instrument</th><th className={th}>Type</th><th className={th}>Price</th><th className={th}>Today</th><th className={th}>Trading</th><th className={th}>Featured</th><th className={th} /></tr></thead>
            <tbody className="divide-y divide-line">{rows.map((i) => (
              <tr key={i.symbol}>
                <td className={td}><div className="flex items-center gap-3"><InstrumentMark symbol={i.symbol} size={32} /><div><p className="font-semibold">{i.symbol}</p><p className="text-[12.5px] text-soft">{i.name}</p></div></div></td>
                <td className={cx(td, 'capitalize')}>{i.kind}</td>
                <td className={cx(td, 'font-semibold tabular-nums')}>{price(i.price)}</td>
                <td className={td}><Chg value={Number(i.prev_close) ? ((i.price - i.prev_close) / i.prev_close) * 100 : 0} /></td>
                <td className={td}><Toggle checked={i.trading_enabled} onChange={(v) => flip(i, { trading_enabled: v })} label={`Trading ${i.symbol}`} /></td>
                <td className={td}><Toggle checked={i.featured} onChange={(v) => flip(i, { featured: v })} label={`Feature ${i.symbol}`} /></td>
                <td className={td}><Btn size="sm" variant="secondary" onClick={() => setEdit(i)}>Set price</Btn></td>
              </tr>
            ))}</tbody></table></div>
        )}
      </Card>
      <PriceModal ins={edit} onClose={() => setEdit(null)} onDone={done} />
      <AddInstrument open={add} onClose={() => setAdd(false)} onDone={done} />
    </>
  )
}

function PriceModal({ ins, onClose, onDone }) {
  const ui = useUi()
  const [v, setV] = useState('')
  const [busy, setBusy] = useState(false)
  if (!ins) return null
  const save = async () => {
    setBusy(true)
    try {
      await rpc('admin_set_price', { p_symbol: ins.symbol, p_price: Number(v) })
      ui.ok(`${ins.symbol} price updated`)
      onDone()
      onClose()
      setV('')
    } catch (e) {
      ui.err(e)
    } finally {
      setBusy(false)
    }
  }
  return (
    <Modal open onClose={onClose} title={`Set price · ${ins.symbol}`} sub={`Current ${price(ins.price)}`} footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn loading={busy} disabled={!(Number(v) > 0)} onClick={save}>Update price</Btn></>}>
      <Field label="New price (USD)"><Input autoFocus type="number" step="0.0001" min="0" placeholder={`e.g. ${Number(ins.price).toFixed(2)}`} value={v} onChange={(e) => setV(e.target.value)} /></Field>
      {Number(v) > 0 && <p className="mt-2 text-[13px] text-soft">That is a change of {pct(((Number(v) - ins.price) / ins.price) * 100)}.</p>}
    </Modal>
  )
}

function AddInstrument({ open, onClose, onDone }) {
  const ui = useUi()
  const blank = { symbol: '', name: '', kind: 'stock', sector: 'General', price: '' }
  const [f, setF] = useState(blank)
  const [busy, setBusy] = useState(false)
  const save = async () => {
    const symbol = f.symbol.trim().toUpperCase()
    if (!/^[A-Z0-9.\-]{1,10}$/.test(symbol)) return ui.err('Symbol: 1–10 letters or digits')
    if (!f.name.trim()) return ui.err('Please enter a name')
    if (!(Number(f.price) > 0)) return ui.err('Enter a starting price')
    setBusy(true)
    try {
      await db.from('instruments').insert({ symbol, name: f.name.trim(), kind: f.kind, sector: f.sector.trim() || 'General', price: Number(f.price), prev_close: Number(f.price), trading_enabled: true })
      ui.ok(`${symbol} added`)
      setF(blank)
      onDone()
      onClose()
    } catch (e) {
      ui.err(/duplicate/i.test(e.message) ? 'That symbol already exists' : e)
    } finally {
      setBusy(false)
    }
  }
  return (
    <Modal open={open} onClose={onClose} title="Add instrument" footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn loading={busy} onClick={save}>Add</Btn></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Symbol"><Input value={f.symbol} onChange={(e) => setF({ ...f, symbol: e.target.value })} maxLength={10} /></Field>
        <Field label="Type"><Select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}><option value="stock">Stock</option><option value="etf">ETF</option><option value="crypto">Crypto</option></Select></Field>
        <Field label="Name" className="sm:col-span-2"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Sector"><Input value={f.sector} onChange={(e) => setF({ ...f, sector: e.target.value })} /></Field>
        <Field label="Starting price (USD)"><Input type="number" step="0.0001" min="0" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></Field>
      </div>
    </Modal>
  )
}

/* ───────────── Investors ───────────── */
const BLANK_INV = { kind: 'investor', name: '', handle: '', country: '', bio: '', return_24m: 0, risk: 4, followers: 0, copiers: 0, look: 0, verified: true, active: true, featured: false }
export function InvestorsAdmin() {
  const ui = useUi()
  const [tab, setTab] = useState('investor')
  const [form, setForm] = useState(null)
  const [busy, setBusy] = useState(false)
  const q = useQuery(() => db.from('investors').select('*').order('return_24m', { ascending: false }), [])
  const rows = (q.data || []).filter((i) => i.kind === tab)
  const save = async () => {
    const f = form
    if (!f.name.trim() || !/^[a-z0-9_]{3,24}$/.test(f.handle)) return ui.err('Name and a handle of 3–24 lowercase letters, digits or underscores are required')
    setBusy(true)
    const body = { kind: f.kind, name: f.name.trim(), handle: f.handle, country: f.country.trim(), bio: f.bio.trim(), return_24m: Number(f.return_24m) || 0, risk: Math.min(10, Math.max(1, Number(f.risk) || 4)), followers: Number(f.followers) || 0, copiers: Number(f.copiers) || 0, look: Number(f.look) || 0, verified: !!f.verified, active: !!f.active, featured: !!f.featured }
    try {
      if (f.id) await db.from('investors').update(body).eq('id', f.id)
      else await db.from('investors').insert(body)
      ui.ok(f.id ? 'Saved' : 'Investor added')
      setForm(null)
      q.reload()
    } catch (e) {
      ui.err(/duplicate/i.test(e.message) ? 'That handle is already used' : e)
    } finally {
      setBusy(false)
    }
  }
  const toggle = async (i, patch) => {
    try {
      await db.from('investors').update(patch).eq('id', i.id)
      q.reload()
    } catch (e) {
      ui.err(e)
    }
  }
  const on = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  return (
    <>
      <PageHead title="Investors" sub="Manage the people and agents members can mirror." action={<div className="flex gap-2"><Tabs tabs={[{ value: 'investor', label: 'Investors' }, { value: 'agent', label: 'Agents' }]} value={tab} onChange={setTab} /><Btn onClick={() => setForm({ ...BLANK_INV, kind: tab })}><I.PlusI size={16} />Add</Btn></div>} />
      <Card pad={false} className="overflow-hidden">
        {q.loading && !q.data ? <Loading /> : rows.length === 0 ? <Empty title="Nobody here yet" /> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[860px]"><thead className="border-b border-line bg-canvas/60"><tr><th className={th}>Name</th><th className={th}>24M return</th><th className={th}>Risk</th><th className={th}>Followers</th><th className={th}>Mirroring</th><th className={th}>Featured</th><th className={th}>Visible</th><th className={th} /></tr></thead>
            <tbody className="divide-y divide-line">{rows.map((i) => (
              <tr key={i.id} className={cx(!i.active && 'opacity-60')}>
                <td className={td}><div className="flex items-center gap-3"><InvestorFace look={i.look} size={36} /><div><p className="font-semibold">{i.name}{i.verified && <I.CheckI size={14} className="ml-1 inline text-azure" />}</p><p className="text-[12.5px] text-soft">@{i.handle} · {i.country}</p></div></div></td>
                <td className={cx(td, 'font-semibold tabular-nums')}><Chg value={i.return_24m} /></td><td className={td}>{i.risk}</td><td className={cx(td, 'tabular-nums')}>{num(i.followers)}</td><td className={cx(td, 'tabular-nums')}>{num(i.copiers)}</td>
                <td className={td}><Toggle checked={i.featured} onChange={(v) => toggle(i, { featured: v })} label="Featured" /></td>
                <td className={td}><Toggle checked={i.active} onChange={(v) => toggle(i, { active: v })} label="Visible" /></td>
                <td className={td}><Btn size="sm" variant="secondary" onClick={() => setForm(i)}>Edit</Btn></td>
              </tr>
            ))}</tbody></table></div>
        )}
      </Card>
      <Modal open={!!form} onClose={() => setForm(null)} wide title={form?.id ? `Edit ${form.name}` : `Add ${form?.kind === 'agent' ? 'agent' : 'investor'}`} footer={<><Btn variant="secondary" onClick={() => setForm(null)}>Cancel</Btn><Btn loading={busy} onClick={save}>Save</Btn></>}>
        {form && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name"><Input value={form.name} onChange={on('name')} /></Field>
            <Field label="Handle"><Input value={form.handle} onChange={(e) => setForm({ ...form, handle: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })} maxLength={24} /></Field>
            <Field label="Country"><Input value={form.country} onChange={on('country')} /></Field>
            <Field label="Portrait (0–9)"><Select value={form.look} onChange={on('look')}>{Array.from({ length: 10 }, (_, n) => <option key={n} value={n}>Portrait {n + 1}</option>)}</Select></Field>
            <Field label="24-month return (%)"><Input type="number" step="0.1" value={form.return_24m} onChange={on('return_24m')} /></Field>
            <Field label="Risk score (1–10)"><Input type="number" min="1" max="10" value={form.risk} onChange={on('risk')} /></Field>
            <Field label="Followers"><Input type="number" min="0" value={form.followers} onChange={on('followers')} /></Field>
            <Field label="Mirroring members (display)"><Input type="number" min="0" value={form.copiers} onChange={on('copiers')} /></Field>
            <Field label="Bio" className="sm:col-span-2"><Textarea className="!min-h-[80px]" value={form.bio} onChange={on('bio')} /></Field>
            <label className="flex items-center gap-3 text-[14px]"><Toggle checked={form.verified} onChange={(v) => setForm({ ...form, verified: v })} label="Verified" />Verified badge</label>
            <label className="flex items-center gap-3 text-[14px]"><Toggle checked={form.active} onChange={(v) => setForm({ ...form, active: v })} label="Visible" />Visible to members</label>
          </div>
        )}
      </Modal>
    </>
  )
}
