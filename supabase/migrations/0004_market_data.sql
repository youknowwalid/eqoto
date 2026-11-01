-- Market-data layer. Every instrument declares its data_source:
--   'simulated' : EQOTO's built-in random-walk generator (demo only; NOT a market quote)
--   'licensed'  : prices pushed by a licensed provider through the service-role ingest function (see docs/INTEGRATIONS.md)

create or replace function public.seed_price_history(p_symbol text, p_days int default 90) returns void
language plpgsql security definer set search_path = public as $$
declare i public.instruments; p numeric; n int; k int;
begin
  select * into i from public.instruments where symbol = p_symbol;
  if not found or exists (select 1 from public.price_history where symbol = p_symbol) then return; end if;
  p := i.price; n := p_days * 8;
  for k in 1..n loop
    insert into public.price_history (symbol, price, ts) values (p_symbol, p, now() - ((k - 1) * interval '3 hours'));
    p := greatest(0.01, round(p / (1 + i.volatility * 2.2 * ((random() * 2 - 1)::numeric + 0.02)), 6));
  end loop;
end $$;
revoke all on function public.seed_price_history(text, int) from public, anon, authenticated;

create or replace function public.instrument_seed_trg() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.data_source = 'simulated' then perform public.seed_price_history(new.symbol); end if;
  return new;
end $$;
drop trigger if exists instrument_seed on public.instruments;
create trigger instrument_seed after insert on public.instruments for each row execute function public.instrument_seed_trg();

-- throttled simulated tick (callable by any signed-in client, runs at most every 40s platform-wide)
create or replace function public.tick_prices() returns void
language plpgsql security definer set search_path = public as $$
declare got int;
begin
  if auth.uid() is null then return; end if;
  update public.platform_settings set last_tick = now() where id = 1 and last_tick < now() - interval '40 seconds';
  get diagnostics got = row_count;
  if got = 0 then return; end if;
  update public.instruments set
    prev_close = case when quote_at::date < now()::date then price else prev_close end,
    price = greatest(0.01, round(price * (1 + volatility * ((random() * 2 - 1)::numeric + 0.04)), 6)),
    quote_at = now()
  where data_source = 'simulated';
  insert into public.price_history (symbol, price)
    select symbol, price from public.instruments i where data_source = 'simulated'
      and not exists (select 1 from public.price_history h where h.symbol = i.symbol and h.ts > now() - interval '10 minutes');
  update public.investors set index_value = greatest(1, round(index_value * (1 + volatility * ((random() * 2 - 1)::numeric + 0.08)), 4)) where active;
  if random() < 0.01 then delete from public.price_history where ts < now() - interval '120 days'; end if;
end $$;

-- service-role ingest for a licensed provider (called by an Edge Function; never by browsers)
create or replace function public.ingest_quotes(p_quotes jsonb) returns int
language plpgsql security definer set search_path = public as $$
declare n int := 0; q jsonb; px numeric;
begin
  if coalesce(auth.role(), current_setting('role', true)) <> 'service_role' and session_user not in ('postgres','supabase_admin') then
    raise exception 'service role required' using errcode = '42501';
  end if;
  for q in select * from jsonb_array_elements(p_quotes) loop
    px := (q->>'price')::numeric;
    continue when px is null or px <= 0;
    update public.instruments set
      prev_close = coalesce(nullif((q->>'prev_close')::numeric, 0), prev_close),
      price = px, quote_at = coalesce((q->>'as_of')::timestamptz, now())
    where symbol = q->>'symbol' and data_source = 'licensed';
    if found then
      insert into public.price_history (symbol, price) values (q->>'symbol', px);
      n := n + 1;
    end if;
  end loop;
  return n;
end $$;
revoke all on function public.ingest_quotes(jsonb) from public, anon, authenticated;

create or replace function public.admin_set_price(p_symbol text, p_price numeric) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Admin access required' using errcode = '42501'; end if;
  if p_price is null or p_price <= 0 then raise exception 'Price must be positive'; end if;
  update public.instruments set price = round(p_price, 6), quote_at = now() where symbol = p_symbol and data_source = 'simulated';
  if not found then raise exception 'Only simulated instruments can be priced manually'; end if;
  insert into public.price_history (symbol, price) values (p_symbol, round(p_price, 6));
  perform public.audit('price.set', p_symbol, jsonb_build_object('price', p_price));
end $$;

create or replace function public.admin_market_shock(p_pct numeric) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Admin access required' using errcode = '42501'; end if;
  if p_pct is null or abs(p_pct) > 50 or p_pct = 0 then raise exception 'Shock must be between -50%% and +50%%'; end if;
  update public.instruments set price = greatest(0.01, round(price * (1 + p_pct / 100), 6)), quote_at = now() where data_source = 'simulated';
  insert into public.price_history (symbol, price) select symbol, price from public.instruments where data_source = 'simulated';
  perform public.audit('market.shock', 'all', jsonb_build_object('pct', p_pct));
end $$;

-- chart helpers (server-side down-sampling, so charts stay correct as history grows)
create or replace function public.price_series(p_symbol text, p_days int default 30, p_points int default 160) returns table (ts timestamptz, price numeric)
language sql stable security invoker set search_path = public as $$
  select ts, price from (
    select distinct on (b) ts, price, b from (
      select ts, price, date_bin(make_interval(secs => greatest(60, (least(p_days, 400) * 86400.0 / greatest(p_points, 10))::int)), ts, timestamptz 'epoch') b
      from public.price_history where symbol = p_symbol and ts >= now() - (least(p_days, 400) * interval '1 day')) s
    order by b, ts desc) d order by ts
$$;

create or replace function public.price_sparks() returns table (symbol text, prices numeric[])
language sql stable security invoker set search_path = public as $$
  select symbol, array_agg(price order by b) from (
    select distinct on (symbol, b) symbol, price, b from (
      select symbol, price, ts, date_bin(interval '4 hours', ts, timestamptz 'epoch') b from public.price_history where ts >= now() - interval '7 days') s
    order by symbol, b, ts desc) d group by symbol
$$;

create or replace function public.daily_closes(p_symbols text[], p_days int default 30) returns table (symbol text, day date, price numeric)
language sql stable security invoker set search_path = public as $$
  select distinct on (symbol, ts::date) symbol, ts::date, price from public.price_history
  where symbol = any(p_symbols) and ts >= now() - (least(p_days, 400) * interval '1 day') order by symbol, ts::date, ts desc
$$;

do $$ declare f text; begin
  foreach f in array array['tick_prices()','admin_set_price(text,numeric)','admin_market_shock(numeric)']
  loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
  foreach f in array array['price_series(text,int,int)','price_sparks()','daily_closes(text[],int)']
  loop
    execute format('grant execute on function public.%s to anon, authenticated', f);
  end loop;
end $$;
