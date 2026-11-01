-- EQOTO core schema (reconstructed from the application's data contracts).
-- Idempotent: safe to run on an empty project AND on an existing EQOTO project
-- (create ... if not exists / add column if not exists / create or replace). No destructive statements.

create extension if not exists pgcrypto;

-- ───────────── platform settings (singleton) ─────────────
create table if not exists public.platform_settings (
  id int primary key default 1 check (id = 1),
  announcement text not null default '',
  announcement_active boolean not null default false,
  min_deposit numeric(14,2) not null default 10 check (min_deposit > 0),
  min_withdrawal numeric(14,2) not null default 20 check (min_withdrawal > 0),
  withdrawal_fee_pct numeric(6,3) not null default 0.5 check (withdrawal_fee_pct >= 0 and withdrawal_fee_pct < 100),
  trade_fee numeric(10,2) not null default 0.99 check (trade_fee >= 0),
  min_copy numeric(14,2) not null default 200 check (min_copy > 0),
  max_order numeric(14,2) not null default 250000 check (max_order > 0),
  demo_start_balance numeric(14,2) not null default 100000 check (demo_start_balance >= 0),
  trading_enabled boolean not null default true,
  signups_enabled boolean not null default true,
  last_tick_at timestamptz not null default 'epoch',
  updated_at timestamptz not null default now()
);
alter table public.platform_settings add column if not exists max_order numeric(14,2) not null default 250000;
alter table public.platform_settings add column if not exists demo_start_balance numeric(14,2) not null default 100000;
alter table public.platform_settings add column if not exists last_tick_at timestamptz not null default 'epoch';
insert into public.platform_settings (id) values (1) on conflict do nothing;

-- ───────────── profiles / accounts ─────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text not null default '',
  username text,
  country text,
  city text,
  address text,
  phone text,
  dob date,
  currency text not null default 'USD',
  language text not null default 'en',
  role text not null default 'user' check (role in ('user','admin')),
  status text not null default 'active' check (status in ('active','suspended')),
  kyc_status text not null default 'unverified' check (kyc_status in ('unverified','pending','verified','rejected')),
  questionnaire jsonb,
  settings jsonb not null default '{}'::jsonb,
  referral_code text unique,
  referred_by uuid references public.profiles(id) on delete set null,
  last_seen_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists profiles_username_key on public.profiles (lower(username)) where username is not null;
create index if not exists profiles_created_idx on public.profiles (created_at desc);
create index if not exists profiles_referred_idx on public.profiles (referred_by);

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('real','demo')),   -- 'real' = main account (simulated funds), 'demo' = practice account
  balance numeric(18,2) not null default 0 check (balance >= 0),
  currency text not null default 'USD',
  created_at timestamptz not null default now(),
  unique (user_id, kind)
);

-- ───────────── helpers (needs profiles) ─────────────
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' and status = 'active' from public.profiles where id = auth.uid()), false)
$$;

-- Protect privileged profile columns from client writes (admin RPCs set eqoto.bypass).
create or replace function public.profiles_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(current_setting('eqoto.bypass', true), '') = 'on' or session_user in ('postgres','supabase_admin') or auth.uid() is null then
    return new;
  end if;
  if new.role is distinct from old.role or new.status is distinct from old.status or new.kyc_status is distinct from old.kyc_status
     or new.referral_code is distinct from old.referral_code or new.referred_by is distinct from old.referred_by
     or new.email is distinct from old.email or new.id is distinct from old.id or new.created_at is distinct from old.created_at then
    raise exception 'Protected profile fields cannot be changed' using errcode = '42501';
  end if;
  return new;
end $$;
drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard before update on public.profiles for each row execute function public.profiles_guard();

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare ps public.platform_settings; code text; refp uuid; demo_bal numeric;
begin
  select * into ps from public.platform_settings where id = 1;
  if ps.id is not null and not ps.signups_enabled then
    raise exception 'Sign-ups are closed';
  end if;
  code := upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8));
  select id into refp from public.profiles where referral_code = upper(nullif(new.raw_user_meta_data->>'ref', ''));
  insert into public.profiles (id, email, full_name, country, referral_code, referred_by)
  values (new.id, new.email, left(coalesce(new.raw_user_meta_data->>'full_name', ''), 120), left(new.raw_user_meta_data->>'country', 80), code, refp);
  demo_bal := coalesce(ps.demo_start_balance, 100000);
  insert into public.accounts (user_id, kind, balance) values (new.id, 'real', 0), (new.id, 'demo', demo_bal);
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ───────────── market catalogue ─────────────
create table if not exists public.instruments (
  symbol text primary key check (symbol ~ '^[A-Z0-9.]{1,12}$'),
  name text not null,
  kind text not null check (kind in ('stock','etf','crypto')),
  sector text not null default 'General',
  exchange text not null default 'EQOTO Sim',
  price numeric(18,6) not null check (price > 0),
  prev_close numeric(18,6) not null check (prev_close > 0),
  volatility numeric(8,5) not null default 0.002,
  trading_enabled boolean not null default true,
  data_source text not null default 'simulated' check (data_source in ('simulated','licensed')),
  quote_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.instruments add column if not exists volatility numeric(8,5) not null default 0.002;
alter table public.instruments add column if not exists data_source text not null default 'simulated';
alter table public.instruments add column if not exists quote_at timestamptz not null default now();
alter table public.instruments add column if not exists exchange text not null default 'EQOTO Sim';

create table if not exists public.price_history (
  id bigint generated always as identity primary key,
  symbol text not null references public.instruments(symbol) on delete cascade on update cascade,
  price numeric(18,6) not null check (price > 0),
  ts timestamptz not null default now()
);
create index if not exists price_history_symbol_ts on public.price_history (symbol, ts desc);

create table if not exists public.watchlist (
  user_id uuid not null references public.profiles(id) on delete cascade,
  symbol text not null references public.instruments(symbol) on delete cascade on update cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, symbol)
);

-- ───────────── orders, executions, positions, ledger ─────────────
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  symbol text not null references public.instruments(symbol) on update cascade,
  side text not null check (side in ('buy','sell')),
  amount numeric(18,2) not null check (amount > 0),     -- requested notional
  units numeric(24,10),
  price numeric(18,6),
  fee numeric(12,2) not null default 0 check (fee >= 0),
  status text not null check (status in ('filled','rejected')),
  reject_reason text,
  idempotency_key text,
  created_at timestamptz not null default now()
);
create unique index if not exists orders_idem on public.orders (account_id, idempotency_key) where idempotency_key is not null;
create index if not exists orders_user_idx on public.orders (user_id, created_at desc);

create table if not exists public.positions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  symbol text not null references public.instruments(symbol) on update cascade,
  units numeric(24,10) not null check (units > 0),
  avg_price numeric(18,6) not null check (avg_price > 0),
  realized_pnl numeric(18,2) not null default 0,
  opened_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (account_id, symbol)
);
alter table public.positions add column if not exists realized_pnl numeric(18,2) not null default 0;
alter table public.positions add column if not exists updated_at timestamptz not null default now();

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  type text not null check (type in ('deposit','withdrawal','buy','sell','copy_start','copy_stop','adjustment','bonus','demo_reset')),
  amount numeric(18,2) not null,          -- signed effect on cash, excluding fee
  fee numeric(12,2) not null default 0 check (fee >= 0),
  symbol text,
  units numeric(24,10),
  price numeric(18,6),
  method text,
  note text,
  pnl numeric(18,2),
  status text not null default 'completed' check (status in ('pending','completed','declined','cancelled')),
  order_id uuid references public.orders(id) on delete set null,
  balance_after numeric(18,2),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.transactions add column if not exists pnl numeric(18,2);
alter table public.transactions add column if not exists order_id uuid;
alter table public.transactions add column if not exists balance_after numeric(18,2);
alter table public.transactions add column if not exists reviewed_by uuid;
alter table public.transactions add column if not exists reviewed_at timestamptz;
create index if not exists tx_user_idx on public.transactions (user_id, created_at desc);
create index if not exists tx_pending_idx on public.transactions (status, type) where status = 'pending';

-- ───────────── investors & mirroring (simulated allocation) ─────────────
create table if not exists public.investors (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'investor' check (kind in ('investor','agent')),
  name text not null,
  handle text not null unique,
  look int not null default 0,
  country text not null default '',
  bio text not null default '',
  risk int not null default 4 check (risk between 1 and 10),
  return_24m numeric(8,2) not null default 0,
  copiers int not null default 0 check (copiers >= 0),
  followers int not null default 0 check (followers >= 0),
  verified boolean not null default false,
  active boolean not null default true,
  featured boolean not null default false,
  index_value numeric(14,4) not null default 100 check (index_value > 0),
  volatility numeric(8,5) not null default 0.0015,
  created_at timestamptz not null default now()
);
alter table public.investors add column if not exists index_value numeric(14,4) not null default 100;
alter table public.investors add column if not exists volatility numeric(8,5) not null default 0.0015;

create table if not exists public.copies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  investor_id uuid not null references public.investors(id),
  amount numeric(18,2) not null check (amount > 0),
  entry_index numeric(14,4) not null check (entry_index > 0),
  status text not null default 'active' check (status in ('active','stopped')),
  exit_value numeric(18,2),
  started_at timestamptz not null default now(),
  ended_at timestamptz
);
alter table public.copies add column if not exists exit_value numeric(18,2);
create unique index if not exists copies_one_active on public.copies (account_id, investor_id) where status = 'active';
create index if not exists copies_account_idx on public.copies (account_id, status);

-- ───────────── notifications, verification, support, content, audit ─────────────
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null default '',
  icon text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

create table if not exists public.kyc_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  doc_type text not null check (doc_type in ('id','address')),
  file_path text not null,
  file_name text not null default '',
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  note text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists kyc_status_idx on public.kyc_documents (status, created_at);

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subject text not null check (char_length(subject) between 3 and 200),
  category text not null default 'General',
  priority text not null default 'normal' check (priority in ('low','normal','high')),
  status text not null default 'open' check (status in ('open','pending','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  is_staff boolean not null default false,
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);
create index if not exists ticket_msgs_idx on public.ticket_messages (ticket_id, created_at);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'Basics',
  summary text not null default '',
  body text not null default '',
  minutes int not null default 5 check (minutes > 0),
  published boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  region text not null default 'US',
  impact text not null default 'medium' check (impact in ('low','medium','high')),
  category text not null default 'economic' check (category in ('economic','earnings')),
  starts_at timestamptz not null,
  forecast text,
  previous text,
  created_at timestamptz not null default now()
);
alter table public.events add column if not exists category text not null default 'economic';

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_created_idx on public.audit_log (created_at desc);

create or replace function public.audit(p_action text, p_entity text, p_meta jsonb default '{}'::jsonb) returns void
language sql security definer set search_path = public as $$
  insert into public.audit_log (actor_id, action, entity, meta) values (auth.uid(), p_action, p_entity, coalesce(p_meta, '{}'::jsonb));
$$;
revoke all on function public.audit(text, text, jsonb) from public, anon, authenticated;

create or replace function public.notify(p_user uuid, p_title text, p_body text default '', p_icon text default null) returns void
language sql security definer set search_path = public as $$
  insert into public.notifications (user_id, title, body, icon) values (p_user, p_title, coalesce(p_body, ''), p_icon);
$$;
revoke all on function public.notify(uuid, text, text, text) from public, anon, authenticated;

-- ticket housekeeping
create or replace function public.ticket_msg_after() returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.tickets set updated_at = now(),
    status = case when new.is_staff and status = 'open' then 'pending' when not new.is_staff and status <> 'open' then 'open' else status end
  where id = new.ticket_id;
  if new.is_staff then
    perform public.notify((select user_id from public.tickets where id = new.ticket_id), 'New reply on your support request', left(new.body, 140), 'lifebuoy');
  end if;
  return new;
end $$;
drop trigger if exists ticket_msg_after on public.ticket_messages;
create trigger ticket_msg_after after insert on public.ticket_messages for each row execute function public.ticket_msg_after();

-- ───────────── row level security ─────────────
do $$ declare t text; begin
  foreach t in array array['platform_settings','profiles','accounts','instruments','price_history','watchlist','orders','positions','transactions','investors','copies','notifications','kyc_documents','tickets','ticket_messages','articles','events','audit_log']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;

-- grants (column-level where clients may write)
grant select on public.platform_settings, public.instruments, public.price_history, public.investors, public.articles, public.events to anon, authenticated;
grant select on public.profiles, public.accounts, public.orders, public.positions, public.transactions, public.copies, public.kyc_documents, public.audit_log to authenticated;
grant update (full_name, username, country, city, address, phone, dob, currency, language, questionnaire, settings, last_seen_at) on public.profiles to authenticated;
grant select, insert, delete on public.watchlist to authenticated;
grant select on public.notifications to authenticated;
grant update (read) on public.notifications to authenticated;
grant insert (user_id, doc_type, file_path, file_name) on public.kyc_documents to authenticated;
grant select, insert on public.tickets, public.ticket_messages to authenticated;
grant update (status) on public.tickets to authenticated;
-- admin-managed content/config (RLS limits writes to admins)
grant insert, update, delete on public.instruments, public.investors, public.articles, public.events to authenticated;
grant update on public.platform_settings to authenticated;

drop policy if exists p_settings_read on public.platform_settings;
create policy p_settings_read on public.platform_settings for select using (true);
drop policy if exists p_settings_admin on public.platform_settings;
create policy p_settings_admin on public.platform_settings for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists p_profiles_read on public.profiles;
create policy p_profiles_read on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
drop policy if exists p_profiles_update on public.profiles;
create policy p_profiles_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists p_accounts_read on public.accounts;
create policy p_accounts_read on public.accounts for select to authenticated using (user_id = auth.uid() or public.is_admin());

drop policy if exists p_instruments_read on public.instruments;
create policy p_instruments_read on public.instruments for select using (true);
drop policy if exists p_instruments_admin on public.instruments;
create policy p_instruments_admin on public.instruments for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists p_hist_read on public.price_history;
create policy p_hist_read on public.price_history for select using (true);

drop policy if exists p_watch_own on public.watchlist;
create policy p_watch_own on public.watchlist for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists p_orders_read on public.orders;
create policy p_orders_read on public.orders for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists p_pos_read on public.positions;
create policy p_pos_read on public.positions for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists p_tx_read on public.transactions;
create policy p_tx_read on public.transactions for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists p_copies_read on public.copies;
create policy p_copies_read on public.copies for select to authenticated using (user_id = auth.uid() or public.is_admin());

drop policy if exists p_inv_read on public.investors;
create policy p_inv_read on public.investors for select using (active or public.is_admin());
drop policy if exists p_inv_admin on public.investors;
create policy p_inv_admin on public.investors for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists p_notif_read on public.notifications;
create policy p_notif_read on public.notifications for select to authenticated using (user_id = auth.uid());
drop policy if exists p_notif_update on public.notifications;
create policy p_notif_update on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists p_kyc_read on public.kyc_documents;
create policy p_kyc_read on public.kyc_documents for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists p_kyc_insert on public.kyc_documents;
create policy p_kyc_insert on public.kyc_documents for insert to authenticated
  with check (user_id = auth.uid() and file_path like auth.uid()::text || '/%');

drop policy if exists p_tickets_read on public.tickets;
create policy p_tickets_read on public.tickets for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists p_tickets_insert on public.tickets;
create policy p_tickets_insert on public.tickets for insert to authenticated with check (user_id = auth.uid());
drop policy if exists p_tickets_update on public.tickets;
create policy p_tickets_update on public.tickets for update to authenticated using (user_id = auth.uid() or public.is_admin())
  with check (public.is_admin() or (user_id = auth.uid() and status in ('open','closed')));
grant update (status) on public.tickets to authenticated;

drop policy if exists p_tmsg_read on public.ticket_messages;
create policy p_tmsg_read on public.ticket_messages for select to authenticated
  using (public.is_admin() or exists (select 1 from public.tickets t where t.id = ticket_id and t.user_id = auth.uid()));
drop policy if exists p_tmsg_insert on public.ticket_messages;
create policy p_tmsg_insert on public.ticket_messages for insert to authenticated with check (
  sender_id = auth.uid() and (
    (is_staff and public.is_admin()) or
    (not is_staff and exists (select 1 from public.tickets t where t.id = ticket_id and t.user_id = auth.uid() and t.status <> 'closed'))));

drop policy if exists p_articles_read on public.articles;
create policy p_articles_read on public.articles for select using (published or public.is_admin());
drop policy if exists p_articles_admin on public.articles;
create policy p_articles_admin on public.articles for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists p_events_read on public.events;
create policy p_events_read on public.events for select using (true);
drop policy if exists p_events_admin on public.events;
create policy p_events_admin on public.events for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists p_audit_read on public.audit_log;
create policy p_audit_read on public.audit_log for select to authenticated using (public.is_admin());

-- ───────────── private storage for verification documents ─────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('kyc', 'kyc', false, 10485760, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update set public = false, file_size_limit = 10485760, allowed_mime_types = array['image/jpeg','image/png','image/webp','application/pdf'];

drop policy if exists kyc_upload on storage.objects;
create policy kyc_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'kyc' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists kyc_read on storage.objects;
create policy kyc_read on storage.objects for select to authenticated
  using (bucket_id = 'kyc' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
