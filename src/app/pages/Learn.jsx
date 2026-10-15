import { useMemo, useState } from 'react'
import { db } from '../../lib/supabase'
import { useAuth, useQuery, useUi } from '../../lib/store'
import { Link, useParams } from '../../lib/router'
import { cx, date, money } from '../../lib/format'
import { Badge, Btn, Card, CardTitle, Empty, Input, Loading, PageHead, Tabs } from '../ui'
import { InstrumentMark } from '../shared'
import * as I from '../icons'

export function Academy() {
  const [cat, setCat] = useState('All')
  const [qs, setQs] = useState('')
  const q = useQuery(() => db.from('articles').select('id,title,category,summary,minutes,created_at').eq('published', true).order('created_at', { ascending: false }), [])
  const cats = ['All', ...new Set((q.data || []).map((a) => a.category))]
  const rows = (q.data || []).filter((a) => (cat === 'All' || a.category === cat) && (a.title + a.summary).toLowerCase().includes(qs.toLowerCase()))
  return (
    <>
      <PageHead title="Academy" sub="Short lessons on markets, risk and how Finvero works." action={<Input className="!w-[240px]" placeholder="Search lessons" value={qs} onChange={(e) => setQs(e.target.value)} aria-label="Search lessons" />} />
      <Tabs className="mb-5" tabs={cats} value={cat} onChange={setCat} />
      {q.loading && !q.data ? <Loading /> : rows.length === 0 ? <Card><Empty icon={I.BookI} title="No lessons found" /></Card> : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{rows.map((a, i) => (
          <Link key={a.id} to={`/app/academy/${a.id}`} className="group flex flex-col overflow-hidden rounded-xl border border-line bg-card transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="grid h-32 place-items-center text-white" style={{ background: `linear-gradient(135deg,hsl(${(i * 47 + 150) % 360} 48% 32%),hsl(${(i * 47 + 190) % 360} 55% 22%))` }}><I.BookI size={38} className="opacity-90" /></div>
            <div className="flex flex-1 flex-col p-5"><div className="flex items-center gap-2"><Badge tone="blue">{a.category}</Badge><span className="text-[12.5px] text-soft">{a.minutes} min read</span></div><h3 className="mt-3 text-[16.5px] font-semibold leading-snug text-fg group-hover:text-azure">{a.title}</h3><p className="mt-1.5 line-clamp-3 text-[14px] text-soft">{a.summary}</p></div>
          </Link>
        ))}</div>
      )}
    </>
  )
}

export function Article() {
  const params = useParams()
  const q = useQuery(() => db.from('articles').select('*').eq('id', params.id).maybeSingle(), [params.id])
  const more = useQuery(() => db.from('articles').select('id,title,minutes').eq('published', true).neq('id', params.id).limit(4), [params.id])
  if (q.loading && !q.data) return <Loading />
  if (!q.data) return <Empty title="Lesson not found" action={<Link to="/app/academy"><Btn>Back to Academy</Btn></Link>} />
  const a = q.data
  const paras = (a.body || '').split(/\n{2,}/).filter(Boolean)
  return (
    <div className="mx-auto max-w-[760px]">
      <Link to="/app/academy" className="mb-4 inline-flex items-center gap-1 text-[14px] font-semibold text-azure hover:underline"><I.ChevLeftI size={17} />Academy</Link>
      <Card className="!p-7 sm:!p-10">
        <div className="flex items-center gap-2"><Badge tone="blue">{a.category}</Badge><span className="text-[13px] text-soft">{a.minutes} min read · {date(a.created_at)}</span></div>
        <h1 className="mt-3 text-[30px] font-semibold leading-tight tracking-tight text-fg">{a.title}</h1>
        <p className="mt-3 text-[17px] leading-relaxed text-soft">{a.summary}</p>
        <div className="mt-6 space-y-4 text-[16px] leading-[1.75] text-fg">{paras.map((p, i) => (p.startsWith('## ') ? <h2 key={i} className="pt-2 text-[21px] font-semibold">{p.slice(3)}</h2> : <p key={i}>{p}</p>))}</div>
        <p className="mt-8 border-t border-line pt-4 text-[13px] text-soft">Educational content only. It is not investment advice.</p>
      </Card>
      {(more.data || []).length > 0 && <div className="mt-6"><h2 className="mb-2 text-[15px] font-semibold text-fg">Keep learning</h2><div className="grid gap-3 sm:grid-cols-2">{more.data.map((m) => <Link key={m.id} to={`/app/academy/${m.id}`} className="rounded-xl border border-line bg-card p-4 text-[14.5px] font-semibold text-fg hover:shadow-md">{m.title}<span className="block text-[12.5px] font-normal text-soft">{m.minutes} min read</span></Link>)}</div></div>}
    </div>
  )
}

export function Invite() {
  const { profile } = useAuth()
  const ui = useUi()
  const link = `${window.location.origin}/signup?ref=${profile.referral_code}`
  const q = useQuery(() => import('../../lib/supabase').then((m) => m.rpc('my_referrals')), [])
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      ui.ok('Link copied')
    } catch {
      ui.info(link)
    }
  }
  const share = () => (navigator.share ? navigator.share({ title: 'Join me on Finvero', url: link }).catch(() => {}) : copy())
  return (
    <>
      <PageHead title="Invite Friends" sub="Share Finvero with people you know. They get a demo account with $100,000 to practise with." />
      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardTitle title="Your invite link" />
          <div className="flex flex-wrap gap-2"><Input readOnly value={link} onFocus={(e) => e.target.select()} className="min-w-0 flex-1" aria-label="Invite link" /><Btn onClick={copy}><I.CopyI size={16} />Copy</Btn><Btn variant="secondary" onClick={share}><I.SendI size={16} />Share</Btn></div>
          <p className="mt-3 text-[13.5px] text-soft">Your code: <b className="text-fg">{profile.referral_code}</b></p>
        </Card>
        <Card>
          <CardTitle title="Friends who joined" action={<Badge tone="green">{(q.data || []).length}</Badge>} />
          {(q.data || []).length === 0 ? <p className="text-[14px] text-soft">Nobody has used your link yet.</p> : <ul className="divide-y divide-line">{q.data.map((r, i) => <li key={i} className="flex justify-between py-2.5 text-[14.5px]"><span className="font-medium text-fg">{r.display}</span><span className="text-soft">{date(r.joined_at)}</span></li>)}</ul>}
        </Card>
      </div>
    </>
  )
}

const APPS = [
  { icon: I.PieI, title: 'Portfolio Insights', text: 'Allocation, best and worst holdings and risk at a glance.', to: '/app/portfolio', tag: 'Included' },
  { icon: I.CandlesI, title: 'Pulse', text: 'Market heat map, top movers and the most volatile assets.', to: '/app/pulse', tag: 'Included' },
  { icon: I.MirrorI, title: 'Mirror Pro Investors', text: 'Follow verified investors with a single allocation.', to: '/app/mirror', tag: 'Included' },
  { icon: I.SparkleI, title: 'Agent Portfolios', text: 'Rules-based portfolios that rebalance on their own.', to: '/app/agents', tag: 'Beta' },
  { icon: I.CalendarI, title: 'Economic Calendar', text: 'Data releases and central bank events that move markets.', to: '/app/calendar', tag: 'Included' },
  { icon: I.RefreshI, title: 'Recurring Orders', text: 'Save a plan and invest the same amount in one click.', to: '/app/settings/recurring', tag: 'Included' },
  { icon: I.BookI, title: 'Academy', text: 'Short lessons for every level.', to: '/app/academy', tag: 'Included' },
  { icon: I.AwardI, title: 'Finvero Club', text: 'Tiers with perks as your account grows.', to: '/app/club', tag: 'Included' },
]
export function Store() {
  return (
    <>
      <PageHead title="App Store" sub="Everything you can switch on in Finvero, all in one place." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{APPS.map((a) => (
        <Link key={a.title} to={a.to} className="flex flex-col rounded-xl border border-line bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-md"><span className="grid h-12 w-12 place-items-center rounded-xl bg-navy text-white"><a.icon size={24} /></span><h3 className="mt-4 text-[16px] font-semibold text-fg">{a.title}</h3><p className="mt-1 flex-1 text-[13.5px] text-soft">{a.text}</p><span className="mt-4"><Badge tone={a.tag === 'Beta' ? 'violet' : 'green'}>{a.tag}</Badge></span></Link>
      ))}</div>
    </>
  )
}
