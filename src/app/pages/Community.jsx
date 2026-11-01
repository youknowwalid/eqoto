import { useCallback, useEffect, useState } from 'react'
import { db, rpc } from '../../lib/supabase'
import { useAuth, useMarket, useQuery, useUi } from '../../lib/store'
import { cx, timeAgo } from '../../lib/format'
import { Avatar, Badge, Btn, Card, CardTitle, Empty, Loading, PageHead, Select, Tabs, Textarea } from '../ui'
import { useTrade } from '../Trade'
import * as I from '../icons'

const MAX = 1000

function Composer({ onPosted, defaultSymbol = '' }) {
  const { user, profile } = useAuth()
  const { list } = useMarket()
  const ui = useUi()
  const [body, setBody] = useState('')
  const [symbol, setSymbol] = useState(defaultSymbol)
  const [sentiment, setSentiment] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async () => {
    setBusy(true)
    try {
      await db.from('social_posts').insert({ author_id: user.id, body: body.trim(), symbol: symbol || null, sentiment: sentiment || null })
      setBody('')
      setSentiment('')
      onPosted()
    } catch (e) {
      ui.err(e)
    } finally {
      setBusy(false)
    }
  }
  return (
    <Card>
      <div className="flex gap-3">
        <Avatar name={profile?.full_name} size={40} />
        <div className="min-w-0 flex-1">
          <Textarea value={body} maxLength={MAX} rows={2} placeholder="Share an idea with the community. Remember: this is a practice platform, not financial advice." aria-label="Write a post" onChange={(e) => setBody(e.target.value)} className="!min-h-[64px]" />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Select className="!h-9 !w-[150px] !text-[13px]" value={symbol} onChange={(e) => setSymbol(e.target.value)} aria-label="Tag an instrument">
              <option value="">No instrument</option>
              {list.map((i) => <option key={i.symbol} value={i.symbol}>{i.symbol}</option>)}
            </Select>
            {['bullish', 'bearish'].map((s) => (
              <button key={s} type="button" aria-pressed={sentiment === s} onClick={() => setSentiment(sentiment === s ? '' : s)} className={cx('h-9 rounded-full border px-3 text-[13px] font-semibold capitalize', sentiment === s ? (s === 'bullish' ? 'border-[#13a24d] bg-[#dff6e8] text-[#0c7a39]' : 'border-[#e5484d] bg-[#fde4e4] text-[#b63232]') : 'border-line text-soft hover:bg-canvas')}>{s}</button>
            ))}
            <span className="ml-auto text-[12px] text-soft">{body.length}/{MAX}</span>
            <Btn size="sm" loading={busy} disabled={!body.trim()} onClick={submit}><I.SendI size={15} />Post</Btn>
          </div>
        </div>
      </div>
    </Card>
  )
}

function Comments({ post, onChange }) {
  const { user } = useAuth()
  const ui = useUi()
  const q = useQuery(() => rpc('social_comments_for', { p_post: post.id }), [post.id])
  const [text, setText] = useState('')
  const send = async () => {
    try {
      await db.from('social_comments').insert({ post_id: post.id, author_id: user.id, body: text.trim() })
      setText('')
      q.reload()
      onChange()
    } catch (e) {
      ui.err(e)
    }
  }
  const del = async (c) => {
    try {
      await db.from('social_comments').remove().eq('id', c.id)
      q.reload()
      onChange()
    } catch (e) {
      ui.err(e)
    }
  }
  return (
    <div className="mt-3 border-t border-line pt-3">
      {(q.data || []).map((c) => (
        <div key={c.id} className="flex gap-2 py-1.5">
          <Avatar name={c.author} size={28} />
          <div className="min-w-0 flex-1 rounded-lg bg-canvas px-3 py-2 text-[13.5px]"><span className="font-semibold text-fg">{c.author}</span> <span className="text-[12px] text-soft">{timeAgo(c.created_at)}</span><p className="whitespace-pre-wrap break-words text-fg">{c.body}</p></div>
          {c.mine && <button className="text-soft hover:text-[#e5484d]" aria-label="Delete comment" onClick={() => del(c)}><I.TrashI size={15} /></button>}
        </div>
      ))}
      <div className="mt-2 flex gap-2">
        <input value={text} maxLength={500} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && text.trim() && send()} placeholder="Write a comment" aria-label="Write a comment" className="h-9 min-w-0 flex-1 rounded-full border border-line bg-card px-4 text-[13.5px] outline-none focus:border-brand" />
        <Btn size="sm" variant="secondary" disabled={!text.trim()} onClick={send}>Reply</Btn>
      </div>
    </div>
  )
}

function Post({ p, onChange }) {
  const { by, change } = useMarket()
  const { open } = useTrade()
  const ui = useUi()
  const [showC, setShowC] = useState(false)
  const act = (fn) => async () => {
    try {
      await fn()
      onChange()
    } catch (e) {
      ui.err(e)
    }
  }
  const ins = p.symbol ? by[p.symbol] : null
  const c = ins ? change(p.symbol) : 0
  return (
    <Card>
      <div className="flex items-start gap-3">
        <Avatar name={p.author} size={40} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2">
            <span className="text-[14.5px] font-semibold text-fg">{p.author}</span>
            <span className="text-[12.5px] text-soft">{timeAgo(p.created_at)}</span>
            {p.sentiment && <Badge tone={p.sentiment === 'bullish' ? 'green' : 'red'}>{p.sentiment}</Badge>}
            {!p.mine && <button className="ml-auto text-[12.5px] font-semibold text-azure hover:underline" onClick={act(() => rpc('social_toggle_follow', { p_user: p.author_id }))}>{p.following ? 'Following' : 'Follow'}</button>}
            {p.mine && <button className="ml-auto text-soft hover:text-[#e5484d]" aria-label="Delete post" onClick={act(async () => { if (await ui.confirm({ title: 'Delete this post?', message: 'This cannot be undone.', danger: true, confirmText: 'Delete' })) await db.from('social_posts').remove().eq('id', p.id) })}><I.TrashI size={16} /></button>}
          </div>
          <p className="mt-1.5 whitespace-pre-wrap break-words text-[14.5px] leading-relaxed text-fg">{p.body}</p>
          {ins && (
            <button onClick={() => open(p.symbol)} className="mt-2 inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-[12.5px] font-semibold text-fg hover:bg-canvas">
              {p.symbol}<span className={c >= 0 ? 'text-[#13a24d]' : 'text-[#e5484d]'}>{c >= 0 ? '+' : ''}{c.toFixed(2)}%</span>
            </button>
          )}
          <div className="mt-3 flex items-center gap-5 text-[13px] text-soft">
            <button className={cx('inline-flex items-center gap-1.5 font-medium hover:text-fg', p.liked && 'text-[#e5484d]')} aria-pressed={p.liked} onClick={act(() => rpc('social_toggle_like', { p_post: p.id }))}><I.StarI size={16} className={p.liked ? 'fill-current' : ''} />{p.like_count}</button>
            <button className="inline-flex items-center gap-1.5 font-medium hover:text-fg" aria-expanded={showC} onClick={() => setShowC(!showC)}><I.MessageI size={16} />{p.comment_count}</button>
          </div>
          {showC && <Comments post={p} onChange={onChange} />}
        </div>
      </div>
    </Card>
  )
}

/** Feed with scope tabs, keyset pagination and an optional symbol filter. */
export function Feed({ compact = false, symbol = '' }) {
  const [scope, setScope] = useState('all')
  const [rows, setRows] = useState(null)
  const [more, setMore] = useState(false)
  const [err, setErr] = useState(null)
  const PAGE = compact ? 8 : 20
  const load = useCallback(async (append) => {
    try {
      const before = append && rows?.length ? rows[rows.length - 1].created_at : null
      const r = (await rpc('social_feed', { p_scope: scope, p_symbol: symbol || null, p_before: before, p_limit: PAGE })) || []
      setRows((prev) => (append ? [...(prev || []), ...r] : r))
      setMore(r.length === PAGE)
      setErr(null)
    } catch (e) {
      setErr(e)
      setRows((p) => p || [])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, symbol, PAGE, rows?.length])
  useEffect(() => {
    setRows(null)
    load(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, symbol])
  const refresh = () => load(false)
  return (
    <div className="space-y-4">
      <Composer onPosted={refresh} defaultSymbol={symbol} />
      <Tabs tabs={[{ value: 'all', label: 'Everyone' }, { value: 'following', label: 'Following' }, { value: 'mine', label: 'My posts' }]} value={scope} onChange={setScope} />
      {err && <p role="alert" className="rounded-lg bg-[#fde4e4] px-4 py-3 text-[13.5px] text-[#b63232]">Could not load the feed. {err.message}</p>}
      {rows === null ? <Loading /> : rows.length === 0 && !err ? (
        <Card><Empty icon={I.MessageI} title={scope === 'following' ? 'Nobody followed yet' : 'No posts yet'} text={scope === 'following' ? 'Follow members from the Everyone tab and their posts will appear here.' : 'Start the conversation: share what you are watching.'} /></Card>
      ) : rows.map((p) => <Post key={p.id} p={p} onChange={refresh} />)}
      {more && <div className="text-center"><Btn variant="secondary" onClick={() => load(true)}>Load more</Btn></div>}
    </div>
  )
}

export function TrendingCard() {
  const { open } = useTrade()
  const q = useQuery(() => rpc('social_trending'), [])
  return (
    <Card>
      <CardTitle title="Trending discussions" sub="Most-discussed instruments this week" />
      {(q.data || []).length === 0 ? <p className="text-[13.5px] text-soft">No tagged posts yet. Tag an instrument in your post to start a trend.</p> : (
        <ul className="divide-y divide-line">
          {q.data.map((t) => (
            <li key={t.symbol}><button onClick={() => open(t.symbol)} className="flex w-full items-center gap-3 py-2.5 text-left hover:opacity-80"><span className="text-[14.5px] font-semibold text-fg">{t.symbol}</span><span className="text-[12.5px] text-soft">{t.posts} post{t.posts === 1 ? '' : 's'}</span><span className="ml-auto text-[12.5px] font-semibold text-[#13a24d]">{t.bullish}↑</span><span className="text-[12.5px] font-semibold text-[#e5484d]">{t.bearish}↓</span></button></li>
          ))}
        </ul>
      )}
    </Card>
  )
}

export default function Community() {
  const { list } = useMarket()
  const [symbol, setSymbol] = useState('')
  return (
    <>
      <PageHead title="Community" sub="Ideas and discussion from EQOTO members. Not financial advice." action={<Select className="!w-[170px]" value={symbol} onChange={(e) => setSymbol(e.target.value)} aria-label="Filter by instrument"><option value="">All instruments</option>{list.map((i) => <option key={i.symbol} value={i.symbol}>{i.symbol}</option>)}</Select>} />
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <Feed symbol={symbol} key={symbol} />
        <div className="space-y-5"><TrendingCard /></div>
      </div>
    </>
  )
}
