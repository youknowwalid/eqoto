-- EQOTO administration RPCs. Each one re-checks is_admin() server-side and writes the audit log.

create or replace function public.admin_stats() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare r jsonb;
begin
  if not public.is_admin() then raise exception 'Admin access required' using errcode = '42501'; end if;
  select jsonb_build_object(
    'users', (select count(*) from public.profiles),
    'new_7d', (select count(*) from public.profiles where created_at > now() - interval '7 days'),
    'verified', (select count(*) from public.profiles where kyc_status = 'verified'),
    'kyc_pending', (select count(*) from public.kyc_documents where status = 'pending'),
    'real_balance', coalesce((select sum(balance) from public.accounts where kind = 'real'), 0),
    'invested', coalesce((select sum(p.units * i.price) from public.positions p join public.instruments i using (symbol) join public.accounts a on a.id = p.account_id where a.kind = 'real'), 0),
    'copied', coalesce((select sum(c.amount * v.index_value / c.entry_index) from public.copies c join public.investors v on v.id = c.investor_id join public.accounts a on a.id = c.account_id where c.status = 'active' and a.kind = 'real'), 0),
    'volume_30d', coalesce((select sum(abs(amount)) from public.transactions where type in ('buy','sell') and created_at > now() - interval '30 days'), 0),
    'fees_30d', coalesce((select sum(fee) from public.transactions where status = 'completed' and created_at > now() - interval '30 days'), 0),
    'pending_deposits', (select jsonb_build_object('n', count(*), 'sum', coalesce(sum(amount), 0)) from public.transactions where type = 'deposit' and status = 'pending'),
    'pending_withdrawals', (select jsonb_build_object('n', count(*), 'sum', coalesce(sum(abs(amount)), 0)) from public.transactions where type = 'withdrawal' and status = 'pending'),
    'open_tickets', (select count(*) from public.tickets where status <> 'closed'),
    'signups', (select coalesce(jsonb_agg(jsonb_build_object('d', d::date, 'n', (select count(*) from public.profiles where created_at::date = d::date)) order by d), '[]'::jsonb)
                from generate_series(current_date - 13, current_date, interval '1 day') d),
    'volume', (select coalesce(jsonb_agg(jsonb_build_object('d', d::date, 'n', (select coalesce(sum(abs(amount)), 0) from public.transactions where type in ('buy','sell') and created_at::date = d::date)) order by d), '[]'::jsonb)
                from generate_series(current_date - 13, current_date, interval '1 day') d),
    'top_symbols', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (
        select symbol, count(*) as trades, sum(abs(amount)) as volume from public.transactions
        where type in ('buy','sell') and created_at > now() - interval '30 days' group by symbol order by sum(abs(amount)) desc limit 6) x)
  ) into r;
  return r;
end $$;

create or replace function public.admin_update_user(p_user uuid, p_role text default null, p_status text default null, p_kyc text default null) returns void
language plpgsql security definer set search_path = public as $$
declare before public.profiles;
begin
  if not public.is_admin() then raise exception 'Admin access required' using errcode = '42501'; end if;
  select * into before from public.profiles where id = p_user for update;
  if not found then raise exception 'User not found'; end if;
  if p_user = auth.uid() and (p_role is not null or p_status is not null) then raise exception 'You cannot change your own role or status'; end if;
  if p_role is not null and p_role not in ('user','admin') then raise exception 'Invalid role'; end if;
  if p_status is not null and p_status not in ('active','suspended') then raise exception 'Invalid status'; end if;
  if p_kyc is not null and p_kyc not in ('unverified','pending','verified','rejected') then raise exception 'Invalid verification status'; end if;
  perform public._bypass();
  update public.profiles set role = coalesce(p_role, role), status = coalesce(p_status, status), kyc_status = coalesce(p_kyc, kyc_status) where id = p_user;
  perform public.audit('user.update', p_user::text, jsonb_build_object('role', jsonb_build_array(before.role, coalesce(p_role, before.role)),
    'status', jsonb_build_array(before.status, coalesce(p_status, before.status)), 'kyc', jsonb_build_array(before.kyc_status, coalesce(p_kyc, before.kyc_status))));
end $$;

create or replace function public.admin_adjust_balance(p_account uuid, p_amount numeric, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare acc public.accounts; v numeric := round(p_amount, 2); bal numeric;
begin
  if not public.is_admin() then raise exception 'Admin access required' using errcode = '42501'; end if;
  if v is null or v = 0 then raise exception 'Enter a non-zero amount'; end if;
  if abs(v) > 1000000 then raise exception 'Adjustment exceeds the $1,000,000 limit'; end if;
  if coalesce(trim(p_reason), '') = '' or char_length(trim(p_reason)) < 3 then raise exception 'A reason is required'; end if;
  select * into acc from public.accounts where id = p_account for update;
  if not found then raise exception 'Account not found'; end if;
  if acc.balance + v < 0 then raise exception 'Adjustment would make the balance negative'; end if;
  update public.accounts set balance = balance + v where id = acc.id returning balance into bal;
  insert into public.transactions (user_id, account_id, type, amount, note, balance_after, reviewed_by, reviewed_at)
  values (acc.user_id, acc.id, 'adjustment', v, trim(p_reason), bal, auth.uid(), now());
  perform public.notify(acc.user_id, 'Balance adjusted', trim(p_reason), 'wallet');
  perform public.audit('balance.adjust', acc.id::text, jsonb_build_object('user', acc.user_id, 'kind', acc.kind, 'amount', v, 'reason', trim(p_reason)));
end $$;

create or replace function public.admin_broadcast(p_title text, p_body text default '', p_user uuid default null) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not public.is_admin() then raise exception 'Admin access required' using errcode = '42501'; end if;
  if coalesce(trim(p_title), '') = '' then raise exception 'A title is required'; end if;
  insert into public.notifications (user_id, title, body, icon)
  select id, left(trim(p_title), 120), left(coalesce(p_body, ''), 1000), 'bell' from public.profiles where status = 'active' and (p_user is null or id = p_user);
  get diagnostics n = row_count;
  perform public.audit('notification.send', coalesce(p_user::text, 'all'), jsonb_build_object('title', p_title, 'recipients', n));
  return n;
end $$;

-- audit instrument edits made through direct admin table writes
create or replace function public.instrument_audit() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and (tg_op = 'INSERT' or new.trading_enabled is distinct from old.trading_enabled or new.price is distinct from old.price) then
    perform public.audit('instrument.' || lower(tg_op), new.symbol, jsonb_build_object('price', new.price, 'trading_enabled', new.trading_enabled));
  end if;
  return new;
end $$;
drop trigger if exists instrument_audit on public.instruments;
create trigger instrument_audit after insert or update on public.instruments for each row execute function public.instrument_audit();

create or replace function public.settings_audit() returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  if auth.uid() is not null and (to_jsonb(new) - 'last_tick_at' - 'updated_at') is distinct from (to_jsonb(old) - 'last_tick_at' - 'updated_at') then
    perform public.audit('settings.update', 'platform_settings', to_jsonb(new) - 'last_tick_at');
  end if;
  return new;
end $$;
drop trigger if exists settings_audit on public.platform_settings;
create trigger settings_audit before update on public.platform_settings for each row execute function public.settings_audit();

do $$ declare f text; begin
  foreach f in array array['admin_stats()','admin_update_user(uuid,text,text,text)','admin_adjust_balance(uuid,numeric,text)','admin_broadcast(text,text,uuid)']
  loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
