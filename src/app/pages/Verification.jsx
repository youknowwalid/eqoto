import { useRef, useState } from 'react'
import { db, rpc, storage } from '../../lib/supabase'
import { useAuth, useUi } from '../../lib/store'
import { Link } from '../../lib/router'
import { cx, dateTime } from '../../lib/format'
import { Badge, Btn, Card, CardTitle, Check, Field, Input, Loading, PageHead, ProgressBar, Select, statusTone } from '../ui'
import { useVerification } from '../shared'
import { COUNTRIES } from './Settings'
import * as I from '../icons'

const Q = [
  ['experience', 'How much investing experience do you have?', ['None', 'Less than 1 year', '1–3 years', 'More than 3 years']],
  ['goal', 'What is your main goal?', ['Grow my savings', 'Regular income', 'Learn how markets work', 'Short-term trading']],
  ['horizon', 'How long do you plan to invest?', ['Under 1 year', '1–5 years', 'Over 5 years']],
  ['risk', 'How would you react to a 20% fall in value?', ['Sell everything', 'Sell some', 'Hold', 'Buy more']],
  ['funds', 'Where do your investing funds come from?', ['Salary', 'Savings', 'Business income', 'Inheritance or gift']],
]

export default function Verification() {
  const { profile, user, updateProfile, refresh } = useAuth()
  const ui = useUi()
  const v = useVerification()
  const [f, setF] = useState({ full_name: profile.full_name || '', dob: profile.dob || '', country: profile.country || '', city: profile.city || '', address: profile.address || '', phone: profile.phone || '' })
  const [q, setQ] = useState(profile.questionnaire || {})
  const [busy, setBusy] = useState('')
  const [upl, setUpl] = useState('')
  const idRef = useRef(null)
  const addrRef = useRef(null)
  const on = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const locked = profile.kyc_status === 'pending' || profile.kyc_status === 'verified'

  const savePersonal = async () => {
    if (!f.full_name.trim() || !f.dob || !f.country || !f.address.trim()) return ui.err('Please fill in name, date of birth, country and address')
    setBusy('personal')
    try {
      await updateProfile(f)
      ui.ok('Personal details saved')
    } catch (e) {
      ui.err(e)
    } finally {
      setBusy('')
    }
  }
  const saveQ = async () => {
    if (Q.some(([k]) => !q[k])) return ui.err('Please answer every question')
    setBusy('q')
    try {
      await updateProfile({ questionnaire: { ...q, answered_at: new Date().toISOString() } })
      ui.ok('Questionnaire saved')
    } catch (e) {
      ui.err(e)
    } finally {
      setBusy('')
    }
  }
  const upload = async (type, file) => {
    if (!file) return
    if (file.size > 8 * 1024 * 1024) return ui.err('Files must be under 8 MB')
    if (!/^(image\/(jpeg|png|webp)|application\/pdf)$/.test(file.type)) return ui.err('Please upload a JPG, PNG, WebP or PDF')
    setUpl(type)
    try {
      const safe = file.name.replace(/[^\w.\-]+/g, '_').slice(-60)
      const path = `${user.id}/${Date.now()}-${safe}`
      await storage.upload('kyc', path, file)
      await db.from('kyc_documents').insert({ user_id: user.id, doc_type: type, file_path: path, file_name: file.name })
      ui.ok('Document uploaded')
      v.reload()
    } catch (e) {
      ui.err(e)
    } finally {
      setUpl('')
    }
  }
  const submit = async () => {
    setBusy('submit')
    try {
      await rpc('submit_verification')
      await refresh()
      v.reload()
      ui.ok('Submitted. We will review your documents shortly.')
    } catch (e) {
      ui.err(e)
    } finally {
      setBusy('')
    }
  }
  const latest = (t) => v.docs.find((d) => d.doc_type === t)
  const allDone = v.steps.slice(0, 4).every((s) => s.done) && latest('id') && latest('address')
  const Doc = ({ type, title, text, inputRef }) => {
    const d = latest(type)
    return (
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-line p-4">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-canvas text-fg"><I.FileI size={21} /></span>
        <div className="min-w-[180px] flex-1"><p className="text-[14.5px] font-semibold text-fg">{title}</p><p className="text-[13px] text-soft">{d ? `${d.file_name} · ${dateTime(d.created_at)}` : text}</p>{d?.status === 'rejected' && d.note && <p className="mt-1 text-[13px] text-[#c0392b]">Reason: {d.note}</p>}</div>
        {d && <Badge tone={statusTone(d.status)}>{d.status}</Badge>}
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={(e) => { upload(type, e.target.files[0]); e.target.value = '' }} />
        {(!d || d.status === 'rejected') && !locked && <Btn size="sm" variant="secondary" loading={upl === type} onClick={() => inputRef.current.click()}><I.UploadI size={15} />{d ? 'Upload again' : 'Upload'}</Btn>}
      </div>
    )
  }
  return (
    <>
      <PageHead title="Verification Centre" sub="Verify your identity to unlock withdrawals. It usually takes a few minutes to review." />
      <Card className="mb-5">
        <div className="flex flex-wrap items-center gap-4"><div className="min-w-[220px] flex-1"><p className="flex items-center gap-2 text-[17px] font-semibold text-fg">Status <Badge tone={statusTone(profile.kyc_status)}>{profile.kyc_status}</Badge></p><ProgressBar value={v.percent} className="mt-3" /><p className="mt-1.5 text-[13px] text-soft">{v.percent}% complete</p></div>
          <ul className="grid gap-1.5 text-[14px]">{v.steps.map((s) => <li key={s.key} className="flex items-center gap-2.5 text-fg"><Check done={s.done} />{s.label}</li>)}</ul></div>
        {profile.kyc_status === 'rejected' && <p className="mt-4 rounded-lg bg-[#fdf0f0] p-3 text-[14px] text-[#b63232]">One or more documents were declined. Upload a clearer copy below and submit again.</p>}
        {profile.kyc_status === 'verified' && <p className="mt-4 rounded-lg bg-brand-soft p-3 text-[14px] text-brand-dark">You are fully verified. Withdrawals are enabled. <Link to="/app/wallet?tab=withdraw" className="font-semibold underline">Go to Wallet</Link></p>}
        {profile.kyc_status === 'pending' && <p className="mt-4 rounded-lg bg-[#fff6e0] p-3 text-[14px] text-[#8a5a00]">Your documents are being reviewed. We will notify you as soon as there is a decision.</p>}
      </Card>
      {v.loading && !v.docs.length ? <Loading /> : (
        <div className={cx('space-y-5', locked && 'pointer-events-none opacity-70')}>
          <Card>
            <CardTitle title="1 · Personal details" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name (as on your ID)"><Input value={f.full_name} onChange={on('full_name')} /></Field>
              <Field label="Date of birth"><Input type="date" value={f.dob} onChange={on('dob')} /></Field>
              <Field label="Country"><Select value={f.country} onChange={on('country')}><option value="">Select…</option>{COUNTRIES.map((c) => <option key={c}>{c}</option>)}</Select></Field>
              <Field label="City"><Input value={f.city} onChange={on('city')} /></Field>
              <Field label="Street address"><Input value={f.address} onChange={on('address')} /></Field>
              <Field label="Mobile number"><Input value={f.phone} onChange={on('phone')} placeholder="+44 7700 900123" /></Field>
            </div>
            <Btn className="mt-5" loading={busy === 'personal'} onClick={savePersonal}>Save details</Btn>
          </Card>
          <Card>
            <CardTitle title="2 · Investor questionnaire" sub="Helps us understand your experience. There are no wrong answers." />
            <div className="grid gap-4 sm:grid-cols-2">{Q.map(([k, label, opts]) => <Field key={k} label={label}><Select value={q[k] || ''} onChange={(e) => setQ({ ...q, [k]: e.target.value })}><option value="">Select…</option>{opts.map((o) => <option key={o}>{o}</option>)}</Select></Field>)}</div>
            <Btn className="mt-5" loading={busy === 'q'} onClick={saveQ}>Save answers</Btn>
          </Card>
          <Card>
            <CardTitle title="3 · Documents" sub="JPG, PNG, WebP or PDF up to 8 MB. Documents are private and visible only to our review team." />
            <div className="space-y-3"><Doc type="id" title="Proof of identity" text="Passport, driving licence or national ID card" inputRef={idRef} /><Doc type="address" title="Proof of address" text="Utility bill or bank statement from the last 3 months" inputRef={addrRef} /></div>
          </Card>
        </div>
      )}
      {!locked && <div className="mt-5 flex justify-end"><Btn size="lg" disabled={!allDone} loading={busy === 'submit'} onClick={submit}>Submit for review</Btn></div>}
    </>
  )
}
