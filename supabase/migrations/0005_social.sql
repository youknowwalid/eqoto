-- EQOTO community: posts, comments, likes, follows, feeds. Original content only, authored by EQOTO members.

create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  symbol text references public.instruments(symbol) on delete set null on update cascade,
  sentiment text check (sentiment in ('bullish','bearish')),
  like_count int not null default 0 check (like_count >= 0),
  comment_count int not null default 0 check (comment_count >= 0),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists social_posts_created on public.social_posts (created_at desc) where not hidden;
create index if not exists social_posts_symbol on public.social_posts (symbol, created_at desc);
create index if not exists social_posts_author on public.social_posts (author_id, created_at desc);

create table if not exists public.social_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.social_posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 500),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists social_comments_post on public.social_comments (post_id, created_at);

create table if not exists public.social_likes (
  post_id uuid not null references public.social_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create table if not exists public.social_follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
create index if not exists social_follows_following on public.social_follows (following_id);

-- public-safe member card (no email, no KYC data)
create or replace view public.public_profiles as
  select p.id,
         case when coalesce((p.settings->>'show_username')::boolean, true) and p.username is not null then p.username
              else coalesce(nullif(split_part(p.full_name, ' ', 1), ''), 'Member') || coalesce(' ' || left(nullif(split_part(p.full_name, ' ', 2), ''), 1) || '.', '') end as display,
         p.country, p.created_at
  from public.profiles p where p.status = 'active';
grant select on public.public_profiles to authenticated;

-- counters
create or replace function public.social_counters() returns trigger language plpgsql security definer set search_path = public as $$
declare pid uuid; d int := case when tg_op = 'INSERT' then 1 else -1 end;
begin
  pid := case when tg_op = 'INSERT' then new.post_id else old.post_id end;
  if tg_table_name = 'social_likes' then
    update public.social_posts set like_count = greatest(0, like_count + d) where id = pid;
  else
    update public.social_posts set comment_count = greatest(0, comment_count + d) where id = pid;
  end if;
  return null;
end $$;
drop trigger if exists social_likes_cnt on public.social_likes;
create trigger social_likes_cnt after insert or delete on public.social_likes for each row execute function public.social_counters();
drop trigger if exists social_comments_cnt on public.social_comments;
create trigger social_comments_cnt after insert or delete on public.social_comments for each row execute function public.social_counters();

-- anti-spam + account checks
create or replace function public.social_rate_limit() returns trigger language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if (select status from public.profiles where id = new.author_id) <> 'active' then raise exception 'Your account is suspended'; end if;
  if tg_table_name = 'social_posts' then
    select count(*) into n from public.social_posts where author_id = new.author_id and created_at > now() - interval '1 hour';
    if n >= 20 then raise exception 'You are posting too quickly. Try again later.'; end if;
  else
    select count(*) into n from public.social_comments where author_id = new.author_id and created_at > now() - interval '1 hour';
    if n >= 60 then raise exception 'You are commenting too quickly. Try again later.'; end if;
  end if;
  return new;
end $$;
drop trigger if exists social_posts_rl on public.social_posts;
create trigger social_posts_rl before insert on public.social_posts for each row execute function public.social_rate_limit();
drop trigger if exists social_comments_rl on public.social_comments;
create trigger social_comments_rl before insert on public.social_comments for each row execute function public.social_rate_limit();

alter table public.social_posts enable row level security;
alter table public.social_comments enable row level security;
alter table public.social_likes enable row level security;
alter table public.social_follows enable row level security;
revoke all on public.social_posts, public.social_comments, public.social_likes, public.social_follows from anon, authenticated;
grant select on public.social_posts, public.social_comments, public.social_likes, public.social_follows to authenticated;
grant insert (author_id, body, symbol, sentiment) on public.social_posts to authenticated;
grant insert (post_id, author_id, body) on public.social_comments to authenticated;
grant insert (post_id, user_id) on public.social_likes to authenticated;
grant insert (follower_id, following_id) on public.social_follows to authenticated;
grant delete on public.social_posts, public.social_comments, public.social_likes, public.social_follows to authenticated;
grant update (hidden) on public.social_posts, public.social_comments to authenticated;

drop policy if exists sp_read on public.social_posts;
create policy sp_read on public.social_posts for select to authenticated using (not hidden or author_id = auth.uid() or public.is_admin());
drop policy if exists sp_ins on public.social_posts;
create policy sp_ins on public.social_posts for insert to authenticated with check (author_id = auth.uid());
drop policy if exists sp_del on public.social_posts;
create policy sp_del on public.social_posts for delete to authenticated using (author_id = auth.uid() or public.is_admin());
drop policy if exists sp_mod on public.social_posts;
create policy sp_mod on public.social_posts for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists sc_read on public.social_comments;
create policy sc_read on public.social_comments for select to authenticated using (not hidden or author_id = auth.uid() or public.is_admin());
drop policy if exists sc_ins on public.social_comments;
create policy sc_ins on public.social_comments for insert to authenticated with check (author_id = auth.uid() and exists (select 1 from public.social_posts p where p.id = post_id and not p.hidden));
drop policy if exists sc_del on public.social_comments;
create policy sc_del on public.social_comments for delete to authenticated using (author_id = auth.uid() or public.is_admin());
drop policy if exists sc_mod on public.social_comments;
create policy sc_mod on public.social_comments for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists sl_read on public.social_likes;
create policy sl_read on public.social_likes for select to authenticated using (user_id = auth.uid());
drop policy if exists sl_ins on public.social_likes;
create policy sl_ins on public.social_likes for insert to authenticated with check (user_id = auth.uid());
drop policy if exists sl_del on public.social_likes;
create policy sl_del on public.social_likes for delete to authenticated using (user_id = auth.uid());

drop policy if exists sf_read on public.social_follows;
create policy sf_read on public.social_follows for select to authenticated using (follower_id = auth.uid() or following_id = auth.uid());
drop policy if exists sf_ins on public.social_follows;
create policy sf_ins on public.social_follows for insert to authenticated with check (follower_id = auth.uid());
drop policy if exists sf_del on public.social_follows;
create policy sf_del on public.social_follows for delete to authenticated using (follower_id = auth.uid());

-- feed: scope = all | following | mine ; optional symbol filter ; keyset pagination on created_at
create or replace function public.social_feed(p_scope text default 'all', p_symbol text default null, p_before timestamptz default null, p_limit int default 20)
returns table (id uuid, author_id uuid, author text, body text, symbol text, sentiment text, like_count int, comment_count int, created_at timestamptz, liked boolean, following boolean, mine boolean)
language sql stable security invoker set search_path = public as $$
  select p.id, p.author_id, coalesce(pp.display, 'Member'), p.body, p.symbol, p.sentiment, p.like_count, p.comment_count, p.created_at,
         exists (select 1 from public.social_likes l where l.post_id = p.id and l.user_id = auth.uid()),
         exists (select 1 from public.social_follows f where f.follower_id = auth.uid() and f.following_id = p.author_id),
         p.author_id = auth.uid()
  from public.social_posts p left join public.public_profiles pp on pp.id = p.author_id
  where not p.hidden
    and (p_symbol is null or p.symbol = upper(p_symbol))
    and (p_before is null or p.created_at < p_before)
    and (p_scope = 'all'
         or (p_scope = 'mine' and p.author_id = auth.uid())
         or (p_scope = 'following' and exists (select 1 from public.social_follows f where f.follower_id = auth.uid() and f.following_id = p.author_id)))
  order by p.created_at desc limit least(greatest(p_limit, 1), 50)
$$;

create or replace function public.social_comments_for(p_post uuid) returns table (id uuid, author text, body text, created_at timestamptz, mine boolean)
language sql stable security invoker set search_path = public as $$
  select c.id, coalesce(pp.display, 'Member'), c.body, c.created_at, c.author_id = auth.uid()
  from public.social_comments c left join public.public_profiles pp on pp.id = c.author_id
  where c.post_id = p_post and not c.hidden order by c.created_at limit 200
$$;

create or replace function public.social_trending() returns table (symbol text, posts bigint, bullish bigint, bearish bigint)
language sql stable security invoker set search_path = public as $$
  select p.symbol, count(*), count(*) filter (where sentiment = 'bullish'), count(*) filter (where sentiment = 'bearish')
  from public.social_posts p where p.symbol is not null and not p.hidden and p.created_at > now() - interval '7 days'
  group by p.symbol order by count(*) desc limit 6
$$;

create or replace function public.social_toggle_follow(p_user uuid) returns boolean
language plpgsql security invoker set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Please sign in'; end if;
  if p_user = auth.uid() then raise exception 'You cannot follow yourself'; end if;
  if exists (select 1 from public.social_follows where follower_id = auth.uid() and following_id = p_user) then
    delete from public.social_follows where follower_id = auth.uid() and following_id = p_user; return false;
  end if;
  insert into public.social_follows (follower_id, following_id) values (auth.uid(), p_user); return true;
end $$;

create or replace function public.social_toggle_like(p_post uuid) returns boolean
language plpgsql security invoker set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Please sign in'; end if;
  if exists (select 1 from public.social_likes where post_id = p_post and user_id = auth.uid()) then
    delete from public.social_likes where post_id = p_post and user_id = auth.uid(); return false;
  end if;
  insert into public.social_likes (post_id, user_id) values (p_post, auth.uid()); return true;
end $$;

do $$ declare f text; begin
  foreach f in array array['social_feed(text,text,timestamptz,int)','social_comments_for(uuid)','social_trending()','social_toggle_follow(uuid)','social_toggle_like(uuid)']
  loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
