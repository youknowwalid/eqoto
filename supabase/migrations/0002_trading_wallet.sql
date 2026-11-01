-- EQOTO paper-trading lifecycle, simulated wallet and mirror allocation.
-- Every function validates the caller server-side; clients cannot write balances, orders, positions or ledger rows directly.
-- NOTE: all funds are SIMULATED. No real deposits, withdrawals or brokerage execution exist in this system.

create or replace function public._bypass() returns void language sql as $$ select set_config('eqoto.bypass', 'on', true) $$;

-- ───────────── place_order ─────────────
drop function if exists public.place_order(uuid, text, text, numeric);
create or replace function public.place_order(
  p_account uuid, p_symbol text, p_side text, p_amount numeric, p_idempotency_key text default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  acc public.accounts; prof public.profiles; ps public.platform_settings; ins public.instruments;
  pos public.positions; prev public.orders;
  v_amt numeric; v_units numeric; v_fee numeric := 0; v_reason text; v_oid uuid;
  v_hold numeric; v_proceeds numeric; v_pnl numeric; v_bal numeric;
begin
  if uid is null then raise exception 'Please sign in' using errcode = '28000'; end if;
  if p_side not in ('buy','sell') then raise exception 'Invalid order side'; end if;
  if p_amount is null or p_amount <> p_amount or p_amount < 1 then raise exception 'Minimum order is $1.00'; end if;
  v_amt := round(p_amount, 2);

  -- serialise all activity on this account (concurrency + duplicate-submission protection)
  select * into acc from public.accounts where id = p_account for update;
  if not found or acc.user_id <> uid then raise exception 'Account not found'; end if;

  if p_idempotency_key is not null then
    select * into prev from public.orders where account_id = acc.id and idempotency_key = p_idempotency_key;
    if found then
      return jsonb_build_object('status', prev.status, 'order_id', prev.id, 'units', prev.units, 'price', prev.price,
                                'fee', prev.fee, 'reason', prev.reject_reason, 'balance', acc.balance, 'duplicate', true);
    end if;
  end if;

  select * into prof from public.profiles where id = uid;
  select * into ps from public.platform_settings where id = 1;
  select * into ins from public.instruments where symbol = upper(p_symbol);
  if not found then raise exception 'Unknown instrument'; end if;

  if prof.status <> 'active' then v_reason := 'Your account is suspended';
  elsif not ps.trading_enabled then v_reason := 'Trading is paused platform-wide';
  elsif not ins.trading_enabled then v_reason := ins.symbol || ' is not currently tradable';
  elsif v_amt > ps.max_order then v_reason := 'Maximum order size is $' || ps.max_order;
  end if;

  if ins.kind = 'stock' and acc.kind = 'real' then v_fee := ps.trade_fee; end if;

  if v_reason is null then
    select * into pos from public.positions where account_id = acc.id and symbol = ins.symbol for update;
    if p_side = 'buy' then
      if acc.balance < v_amt + v_fee then v_reason := 'Insufficient available balance'; end if;
    else
      if not found then v_reason := 'You do not hold ' || ins.symbol;
      else
        v_hold := pos.units * ins.price;
        if v_amt > v_hold + 0.005 then v_reason := 'You can sell at most $' || round(v_hold, 2) || ' of ' || ins.symbol; end if;
      end if;
    end if;
  end if;

  if v_reason is not null then
    insert into public.orders (user_id, account_id, symbol, side, amount, price, fee, status, reject_reason, idempotency_key)
    values (uid, acc.id, ins.symbol, p_side, v_amt, ins.price, 0, 'rejected', v_reason, p_idempotency_key) returning id into v_oid;
    return jsonb_build_object('status', 'rejected', 'order_id', v_oid, 'reason', v_reason, 'balance', acc.balance);
  end if;

  if p_side = 'buy' then
    v_units := round(v_amt / ins.price, 10);
    v_bal := acc.balance - v_amt - v_fee;
    insert into public.orders (user_id, account_id, symbol, side, amount, units, price, fee, status, idempotency_key)
    values (uid, acc.id, ins.symbol, 'buy', v_amt, v_units, ins.price, v_fee, 'filled', p_idempotency_key) returning id into v_oid;
    if pos.id is null then
      insert into public.positions (user_id, account_id, symbol, units, avg_price) values (uid, acc.id, ins.symbol, v_units, ins.price);
    else
      update public.positions set avg_price = round((units * avg_price + v_units * ins.price) / (units + v_units), 6),
        units = units + v_units, updated_at = now() where id = pos.id;
    end if;
    insert into public.transactions (user_id, account_id, type, amount, fee, symbol, units, price, order_id, balance_after)
    values (uid, acc.id, 'buy', -v_amt, v_fee, ins.symbol, v_units, ins.price, v_oid, v_bal);
  else
    if v_amt >= v_hold - 0.005 then v_units := pos.units; else v_units := round(v_amt / ins.price, 10); end if;
    v_proceeds := round(v_units * ins.price, 2);
    if acc.balance + v_proceeds - v_fee < 0 then
      insert into public.orders (user_id, account_id, symbol, side, amount, price, fee, status, reject_reason, idempotency_key)
      values (uid, acc.id, ins.symbol, 'sell', v_amt, ins.price, 0, 'rejected', 'Order too small to cover the trading fee', p_idempotency_key) returning id into v_oid;
      return jsonb_build_object('status', 'rejected', 'order_id', v_oid, 'reason', 'Order too small to cover the trading fee', 'balance', acc.balance);
    end if;
    v_bal := acc.balance + v_proceeds - v_fee;
    v_pnl := round(v_units * (ins.price - pos.avg_price), 2);
    insert into public.orders (user_id, account_id, symbol, side, amount, units, price, fee, status, idempotency_key)
    values (uid, acc.id, ins.symbol, 'sell', v_proceeds, v_units, ins.price, v_fee, 'filled', p_idempotency_key) returning id into v_oid;
    if v_units >= pos.units then delete from public.positions where id = pos.id;
    else update public.positions set units = units - v_units, realized_pnl = realized_pnl + v_pnl, updated_at = now() where id = pos.id;
    end if;
    insert into public.transactions (user_id, account_id, type, amount, fee, symbol, units, price, pnl, order_id, balance_after)
    values (uid, acc.id, 'sell', v_proceeds, v_fee, ins.symbol, v_units, ins.price, v_pnl, v_oid, v_bal);
  end if;

  update public.accounts set balance = v_bal where id = acc.id;
  return jsonb_build_object('status', 'filled', 'order_id', v_oid, 'units', v_units, 'price', ins.price, 'fee', v_fee, 'balance', v_bal, 'source', ins.data_source);
end $$;

-- ───────────── simulated wallet requests ─────────────
create or replace function public._real_account(p_uid uuid) returns public.accounts
language sql stable security definer set search_path = public as $$ select * from public.accounts where user_id = p_uid and kind = 'real' $$;
revoke all on function public._real_account(uuid) from public, anon, authenticated;

create or replace function public.request_deposit(p_amount numeric, p_method text) returns uuid
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); ps public.platform_settings; acc public.accounts; v numeric := round(p_amount, 2); tid uuid; n int;
begin
  if uid is null then raise exception 'Please sign in' using errcode = '28000'; end if;
  if p_method not in ('Card','Bank transfer','Digital wallet') then raise exception 'Unsupported payment method'; end if;
  select * into ps from public.platform_settings where id = 1;
  if v is null or v < ps.min_deposit then raise exception 'Minimum deposit is $%', ps.min_deposit; end if;
  if v > 1000000 then raise exception 'Maximum single deposit is $1,000,000'; end if;
  if (select status from public.profiles where id = uid) <> 'active' then raise exception 'Your account is suspended'; end if;
  select * into acc from public.accounts where user_id = uid and kind = 'real' for update;
  select count(*) into n from public.transactions where user_id = uid and status = 'pending';
  if n >= 5 then raise exception 'You already have 5 pending requests'; end if;
  insert into public.transactions (user_id, account_id, type, amount, method, status) values (uid, acc.id, 'deposit', v, p_method, 'pending') returning id into tid;
  return tid;
end $$;

create or replace function public.request_withdrawal(p_amount numeric, p_method text) returns uuid
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); ps public.platform_settings; prof public.profiles; acc public.accounts; v numeric := round(p_amount, 2); fee numeric; tid uuid; n int;
begin
  if uid is null then raise exception 'Please sign in' using errcode = '28000'; end if;
  if p_method not in ('Card','Bank transfer','Digital wallet') then raise exception 'Unsupported payout method'; end if;
  select * into prof from public.profiles where id = uid;
  if prof.status <> 'active' then raise exception 'Your account is suspended'; end if;
  if prof.kyc_status <> 'verified' then raise exception 'Verify your account before withdrawing'; end if;
  select * into ps from public.platform_settings where id = 1;
  if v is null or v < ps.min_withdrawal then raise exception 'Minimum withdrawal is $%', ps.min_withdrawal; end if;
  fee := round(v * ps.withdrawal_fee_pct / 100, 2);
  select * into acc from public.accounts where user_id = uid and kind = 'real' for update;
  select count(*) into n from public.transactions where user_id = uid and status = 'pending';
  if n >= 5 then raise exception 'You already have 5 pending requests'; end if;
  if acc.balance < v + fee then raise exception 'Insufficient available balance'; end if;
  update public.accounts set balance = balance - v - fee where id = acc.id;       -- funds held until reviewed
  insert into public.transactions (user_id, account_id, type, amount, fee, method, status, balance_after)
  values (uid, acc.id, 'withdrawal', -v, fee, p_method, 'pending', acc.balance - v - fee) returning id into tid;
  return tid;
end $$;

create or replace function public.cancel_request(p_tx uuid) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); t public.transactions;
begin
  select * into t from public.transactions where id = p_tx for update;
  if not found or t.user_id <> uid then raise exception 'Request not found'; end if;
  if t.status <> 'pending' or t.type not in ('deposit','withdrawal') then raise exception 'Only pending deposits and withdrawals can be cancelled'; end if;
  perform 1 from public.accounts where id = t.account_id for update;
  if t.type = 'withdrawal' then update public.accounts set balance = balance + abs(t.amount) + t.fee where id = t.account_id; end if;
  update public.transactions set status = 'cancelled', reviewed_at = now() where id = t.id;
end $$;

create or replace function public.admin_review_tx(p_tx uuid, p_approve boolean, p_note text default null) returns void
language plpgsql security definer set search_path = public as $$
declare t public.transactions; bal numeric;
begin
  if not public.is_admin() then raise exception 'Admin access required' using errcode = '42501'; end if;
  select * into t from public.transactions where id = p_tx for update;
  if not found then raise exception 'Request not found'; end if;
  if t.status <> 'pending' or t.type not in ('deposit','withdrawal') then raise exception 'This request has already been handled'; end if;
  perform 1 from public.accounts where id = t.account_id for update;
  if t.type = 'deposit' and p_approve then
    update public.accounts set balance = balance + t.amount where id = t.account_id returning balance into bal;
    update public.transactions set status = 'completed', balance_after = bal where id = t.id;
  elsif t.type = 'withdrawal' and not p_approve then
    update public.accounts set balance = balance + abs(t.amount) + t.fee where id = t.account_id returning balance into bal;
    update public.transactions set status = 'declined', balance_after = bal where id = t.id;
  else
    update public.transactions set status = case when p_approve then 'completed' else 'declined' end where id = t.id;
  end if;
  update public.transactions set reviewed_by = auth.uid(), reviewed_at = now(), note = coalesce(nullif(p_note, ''), note) where id = t.id;
  perform public.notify(t.user_id, initcap(t.type) || case when p_approve then ' approved' else ' declined' end,
    coalesce(nullif(p_note, ''), 'Your simulated ' || t.type || ' of $' || abs(t.amount) || ' was ' || case when p_approve then 'approved.' else 'declined.' end), 'wallet');
  perform public.audit('transaction.' || case when p_approve then 'approve' else 'decline' end, t.id::text,
    jsonb_build_object('type', t.type, 'amount', t.amount, 'user', t.user_id, 'note', p_note));
end $$;

create or replace function public.reset_demo() returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); acc public.accounts; start numeric;
begin
  if uid is null then raise exception 'Please sign in' using errcode = '28000'; end if;
  select demo_start_balance into start from public.platform_settings where id = 1;
  select * into acc from public.accounts where user_id = uid and kind = 'demo' for update;
  delete from public.positions where account_id = acc.id;
  update public.investors i set copiers = greatest(0, i.copiers - 1)
    where i.id in (select investor_id from public.copies where account_id = acc.id and status = 'active');
  update public.copies set status = 'stopped', ended_at = now(), exit_value = 0 where account_id = acc.id and status = 'active';
  update public.accounts set balance = start where id = acc.id;
  insert into public.transactions (user_id, account_id, type, amount, note, balance_after) values (uid, acc.id, 'demo_reset', 0, 'Demo account reset', start);
end $$;

-- ───────────── mirror (copy) allocation: simulated, index-based ─────────────
create or replace function public.start_copy(p_investor uuid, p_account uuid, p_amount numeric) returns uuid
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); acc public.accounts; inv public.investors; ps public.platform_settings; v numeric := round(p_amount, 2); cid uuid; bal numeric;
begin
  if uid is null then raise exception 'Please sign in' using errcode = '28000'; end if;
  select * into acc from public.accounts where id = p_account for update;
  if not found or acc.user_id <> uid then raise exception 'Account not found'; end if;
  if (select status from public.profiles where id = uid) <> 'active' then raise exception 'Your account is suspended'; end if;
  select * into ps from public.platform_settings where id = 1;
  if not ps.trading_enabled then raise exception 'Trading is paused platform-wide'; end if;
  select * into inv from public.investors where id = p_investor and active;
  if not found then raise exception 'Investor not available'; end if;
  if v is null or v < ps.min_copy then raise exception 'Minimum allocation is $%', ps.min_copy; end if;
  if v > ps.max_order then raise exception 'Maximum allocation is $%', ps.max_order; end if;
  if acc.balance < v then raise exception 'Insufficient available balance'; end if;
  if exists (select 1 from public.copies where account_id = acc.id and investor_id = inv.id and status = 'active') then raise exception 'You are already mirroring this investor'; end if;
  bal := acc.balance - v;
  update public.accounts set balance = bal where id = acc.id;
  insert into public.copies (user_id, account_id, investor_id, amount, entry_index) values (uid, acc.id, inv.id, v, inv.index_value) returning id into cid;
  update public.investors set copiers = copiers + 1 where id = inv.id;
  insert into public.transactions (user_id, account_id, type, amount, note, balance_after) values (uid, acc.id, 'copy_start', -v, 'Mirror ' || inv.name, bal);
  return cid;
end $$;

create or replace function public.stop_copy(p_copy uuid) returns numeric
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); c public.copies; inv public.investors; val numeric; bal numeric;
begin
  select * into c from public.copies where id = p_copy for update;
  if not found or c.user_id <> uid then raise exception 'Mirror not found'; end if;
  if c.status <> 'active' then raise exception 'This mirror is already stopped'; end if;
  perform 1 from public.accounts where id = c.account_id for update;
  select * into inv from public.investors where id = c.investor_id;
  val := round(c.amount * inv.index_value / c.entry_index, 2);
  update public.accounts set balance = balance + val where id = c.account_id returning balance into bal;
  update public.copies set status = 'stopped', ended_at = now(), exit_value = val where id = c.id;
  update public.investors set copiers = greatest(0, copiers - 1) where id = inv.id;
  insert into public.transactions (user_id, account_id, type, amount, pnl, note, balance_after)
  values (uid, c.account_id, 'copy_stop', val, val - c.amount, 'Stopped mirroring ' || inv.name, bal);
  return val;
end $$;

-- ───────────── verification workflow ─────────────
create or replace function public.submit_verification() returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); p public.profiles;
begin
  if uid is null then raise exception 'Please sign in' using errcode = '28000'; end if;
  select * into p from public.profiles where id = uid for update;
  if p.kyc_status = 'verified' then raise exception 'You are already verified'; end if;
  if coalesce(p.full_name,'') = '' or p.dob is null or coalesce(p.country,'') = '' or coalesce(p.address,'') = '' or coalesce(p.phone,'') = '' or p.questionnaire is null then
    raise exception 'Complete your personal details, contact number and questionnaire first';
  end if;
  if not exists (select 1 from public.kyc_documents where user_id = uid and doc_type = 'id' and status in ('pending','approved'))
     or not exists (select 1 from public.kyc_documents where user_id = uid and doc_type = 'address' and status in ('pending','approved')) then
    raise exception 'Upload both an identity document and an address document';
  end if;
  perform public._bypass();
  update public.profiles set kyc_status = 'pending' where id = uid;
end $$;

create or replace function public.admin_review_doc(p_doc uuid, p_approve boolean, p_note text default null) returns void
language plpgsql security definer set search_path = public as $$
declare d public.kyc_documents; ok_id boolean; ok_addr boolean; anyp boolean;
begin
  if not public.is_admin() then raise exception 'Admin access required' using errcode = '42501'; end if;
  select * into d from public.kyc_documents where id = p_doc for update;
  if not found then raise exception 'Document not found'; end if;
  if d.status <> 'pending' then raise exception 'This document has already been reviewed'; end if;
  if not p_approve and coalesce(trim(p_note), '') = '' then raise exception 'Add a note explaining the rejection'; end if;
  update public.kyc_documents set status = case when p_approve then 'approved' else 'rejected' end, note = p_note, reviewed_by = auth.uid(), reviewed_at = now() where id = d.id;
  perform public._bypass();
  select exists (select 1 from public.kyc_documents where user_id = d.user_id and doc_type = 'id' and status = 'approved'),
         exists (select 1 from public.kyc_documents where user_id = d.user_id and doc_type = 'address' and status = 'approved'),
         exists (select 1 from public.kyc_documents where user_id = d.user_id and status = 'pending')
    into ok_id, ok_addr, anyp;
  if ok_id and ok_addr then
    update public.profiles set kyc_status = 'verified' where id = d.user_id;
    perform public.notify(d.user_id, 'You are verified', 'Withdrawals are now unlocked on your main account.', 'shield');
  elsif not p_approve then
    update public.profiles set kyc_status = 'rejected' where id = d.user_id;
    perform public.notify(d.user_id, 'A document needs attention', coalesce(p_note, 'Please upload a clearer copy.'), 'shield');
  elsif not anyp then
    update public.profiles set kyc_status = 'pending' where id = d.user_id;
  end if;
  perform public.audit('verification.' || case when p_approve then 'approve' else 'reject' end, d.id::text, jsonb_build_object('user', d.user_id, 'doc_type', d.doc_type, 'note', p_note));
end $$;

-- ───────────── referrals ─────────────
create or replace function public.my_referrals() returns table (display text, joined_at timestamptz)
language sql stable security definer set search_path = public as $$
  select coalesce(nullif(split_part(p.full_name, ' ', 1), ''), 'Member') || ' ' || coalesce(left(nullif(split_part(p.full_name, ' ', 2), ''), 1) || '.', ''), p.created_at
  from public.profiles p where p.referred_by = auth.uid() order by p.created_at desc
$$;

-- permissions: only signed-in users run RPCs; helpers stay private
do $$ declare f text; begin
  foreach f in array array[
    'place_order(uuid,text,text,numeric,text)','request_deposit(numeric,text)','request_withdrawal(numeric,text)','cancel_request(uuid)',
    'admin_review_tx(uuid,boolean,text)','reset_demo()','start_copy(uuid,uuid,numeric)','stop_copy(uuid)','submit_verification()',
    'admin_review_doc(uuid,boolean,text)','my_referrals()']
  loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
revoke all on function public._bypass() from public, anon, authenticated;
