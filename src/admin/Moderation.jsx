import { useState } from 'react'
import { db } from '../lib/supabase'
import { useQuery, useUi } from '../lib/store'
import { cx, dateTime } from '../lib/format'
import { Badge, Btn, Card, Empty, ErrorBox, Loading, PageHead, Tabs } from '../app/ui'

/** Community moderation: hide, restore or delete posts and comments. Enforced by RLS (admin only). */
export default function Moderation() {
  const ui = useUi()
  const [tab, setTab] = useState('posts')
  const table = tab === 'posts' ? 'social_posts' : 'social_comments'
  const sel = tab === 'posts' ? '*,author:profiles!social_posts_author_id_fkey(full_name,email)' : '*,author:profiles!social_comments_author_id_fkey(full_name,email)'
  const q = useQuery(() => db.from(table).select(sel).order('created_at', { ascending: false }).limit(100), [tab])
  const act = async (fn, ok) => {
    try {
      await fn()
      ui.ok(ok)
      q.reload()
    } catch (e) {
      ui.err(e)
    }
  }
  return (
    <>
      <PageHead title="Community" sub="Review member posts and comments. Hidden items disappear for everyone except their author." action={<Tabs tabs={[{ value: 'posts', label: 'Posts' }, { value: 'comments', label: 'Comments' }]} value={tab} onChange={setTab} />} />
      {q.loading && !q.data ? <Loading /> : q.error && !q.data ? <ErrorBox error={q.error} retry={q.reload} /> : (q.data || []).length === 0 ? <Card><Empty title={`No ${tab} yet`} /></Card> : (
        <div className="space-y-3">
          {q.data.map((r) => (
            <Card key={r.id}>
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-soft"><b className="text-fg">{r.author?.full_name || 'Member'}</b> · {r.author?.email} · {dateTime(r.created_at)} {r.symbol && <Badge tone="blue">{r.symbol}</Badge>} {r.hidden && <Badge tone="amber">Hidden</Badge>}</p>
                  <p className={cx('mt-1.5 whitespace-pre-wrap break-words text-[14.5px] text-fg', r.hidden && 'opacity-60')}>{r.body}</p>
                </div>
                <div className="flex gap-2">
                  <Btn size="sm" variant="secondary" onClick={() => act(() => db.from(table).update({ hidden: !r.hidden }).eq('id', r.id), r.hidden ? 'Restored' : 'Hidden')}>{r.hidden ? 'Restore' : 'Hide'}</Btn>
                  <Btn size="sm" variant="secondary" onClick={async () => { if (await ui.confirm({ title: 'Delete permanently?', message: 'This removes it for everyone and cannot be undone.', danger: true, confirmText: 'Delete' })) act(() => db.from(table).remove().eq('id', r.id), 'Deleted') }}>Delete</Btn>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
