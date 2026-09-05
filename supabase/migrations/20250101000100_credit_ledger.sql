-- ============================================================================
-- Oply — credit ledger, atomic deduction, order fulfilment
--
-- Every balance change goes through one of these SECURITY DEFINER functions
-- and always writes a matching ledger row. Nothing else is granted write
-- access to credit_balances.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- is_admin — used by RLS policies. SECURITY DEFINER so policies on profiles
-- cannot recurse into themselves.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin(p_user_id uuid default auth.uid())
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = p_user_id and role = 'admin' and disabled = false
  );
$$;

-- ---------------------------------------------------------------------------
-- New user provisioning: profile + balance row + signup bonus.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bonus integer;
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  select coalesce((value #>> '{}')::integer, 50)
    into v_bonus
    from public.site_settings
   where key = 'signup_bonus_credits';

  v_bonus := coalesce(v_bonus, 50);

  insert into public.credit_balances (user_id, balance)
  values (new.id, v_bonus)
  on conflict (user_id) do nothing;

  if v_bonus > 0 then
    insert into public.credit_transactions
      (user_id, type, amount, balance_after, reference_type, description)
    values
      (new.id, 'bonus', v_bonus, v_bonus, 'signup', 'Welcome credits');
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- consume_credits — atomic deduction.
--
-- Takes a row lock on the balance so two concurrent generations cannot both
-- read the same balance and both succeed. Raises 'insufficient_credits' when
-- the balance would go negative; the CHECK constraint is the second line of
-- defence.
-- ---------------------------------------------------------------------------
create or replace function public.consume_credits(
  p_user_id uuid,
  p_amount integer,
  p_description text default null,
  p_reference_type text default 'generation',
  p_reference_id uuid default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
  v_new_balance integer;
begin
  if p_amount is null or p_amount < 0 then
    raise exception 'invalid_amount' using errcode = '22023';
  end if;

  if p_amount = 0 then
    select balance into v_balance from public.credit_balances where user_id = p_user_id;
    return coalesce(v_balance, 0);
  end if;

  -- lock this user's balance row for the duration of the transaction
  select balance into v_balance
    from public.credit_balances
   where user_id = p_user_id
     for update;

  if v_balance is null then
    raise exception 'no_balance_record' using errcode = 'P0002';
  end if;

  if v_balance < p_amount then
    raise exception 'insufficient_credits' using errcode = 'P0001';
  end if;

  v_new_balance := v_balance - p_amount;

  update public.credit_balances
     set balance = v_new_balance,
         lifetime_used = lifetime_used + p_amount,
         updated_at = now()
   where user_id = p_user_id;

  insert into public.credit_transactions
    (user_id, type, amount, balance_after, reference_type, reference_id, description)
  values
    (p_user_id, 'usage', -p_amount, v_new_balance, p_reference_type, p_reference_id,
     coalesce(p_description, 'Tool usage'));

  return v_new_balance;
end;
$$;

-- ---------------------------------------------------------------------------
-- refund_credits — returns reserved credits after a failed generation.
-- ---------------------------------------------------------------------------
create or replace function public.refund_credits(
  p_user_id uuid,
  p_amount integer,
  p_description text default null,
  p_reference_type text default 'generation',
  p_reference_id uuid default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
  v_new_balance integer;
begin
  if p_amount is null or p_amount <= 0 then
    select balance into v_balance from public.credit_balances where user_id = p_user_id;
    return coalesce(v_balance, 0);
  end if;

  select balance into v_balance
    from public.credit_balances
   where user_id = p_user_id
     for update;

  if v_balance is null then
    raise exception 'no_balance_record' using errcode = 'P0002';
  end if;

  v_new_balance := v_balance + p_amount;

  update public.credit_balances
     set balance = v_new_balance,
         -- the usage never really happened, so unwind the lifetime counter too
         lifetime_used = greatest(0, lifetime_used - p_amount),
         updated_at = now()
   where user_id = p_user_id;

  insert into public.credit_transactions
    (user_id, type, amount, balance_after, reference_type, reference_id, description)
  values
    (p_user_id, 'refund', p_amount, v_new_balance, p_reference_type, p_reference_id,
     coalesce(p_description, 'Refund for failed generation'));

  return v_new_balance;
end;
$$;

-- ---------------------------------------------------------------------------
-- complete_order_and_credit — the only path that turns a payment into credits.
--
-- Idempotent by design:
--   * the order row is locked and its `credited` flag checked inside the lock
--   * a second call for an already-credited order returns false and changes
--     nothing
--   * payment_events.provider_event_id carries a UNIQUE constraint, so a
--     replayed webhook cannot even reach this function twice
-- ---------------------------------------------------------------------------
create or replace function public.complete_order_and_credit(
  p_order_id uuid,
  p_provider_payment_id text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_balance integer;
  v_new_balance integer;
begin
  select * into v_order
    from public.orders
   where id = p_order_id
     for update;

  if not found then
    raise exception 'order_not_found' using errcode = 'P0002';
  end if;

  -- already fulfilled — do nothing, report "no work done"
  if v_order.credited then
    return false;
  end if;

  select balance into v_balance
    from public.credit_balances
   where user_id = v_order.user_id
     for update;

  if v_balance is null then
    insert into public.credit_balances (user_id, balance)
    values (v_order.user_id, 0)
    on conflict (user_id) do nothing;
    v_balance := 0;
  end if;

  v_new_balance := v_balance + v_order.credits;

  update public.credit_balances
     set balance = v_new_balance,
         lifetime_purchased = lifetime_purchased + v_order.credits,
         updated_at = now()
   where user_id = v_order.user_id;

  insert into public.credit_transactions
    (user_id, type, amount, balance_after, reference_type, reference_id, description)
  values
    (v_order.user_id, 'purchase', v_order.credits, v_new_balance, 'order', v_order.id,
     v_order.plan_name || ' — ' || v_order.credits || ' credits');

  update public.orders
     set status = 'completed',
         credited = true,
         completed_at = now(),
         provider_payment_id = coalesce(p_provider_payment_id, provider_payment_id),
         updated_at = now()
   where id = p_order_id;

  return true;
end;
$$;

-- ---------------------------------------------------------------------------
-- refund_order — marks an order refunded and claws back credits, but never
-- below zero. Credits already spent are not converted into debt.
-- ---------------------------------------------------------------------------
create or replace function public.refund_order(p_order_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_balance integer;
  v_reclaim integer;
  v_new_balance integer;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'order_not_found' using errcode = 'P0002';
  end if;

  if v_order.status = 'refunded' then
    return 0;
  end if;

  select balance into v_balance
    from public.credit_balances where user_id = v_order.user_id for update;

  v_reclaim := least(coalesce(v_balance, 0), case when v_order.credited then v_order.credits else 0 end);

  if v_reclaim > 0 then
    v_new_balance := v_balance - v_reclaim;
    update public.credit_balances
       set balance = v_new_balance, updated_at = now()
     where user_id = v_order.user_id;

    insert into public.credit_transactions
      (user_id, type, amount, balance_after, reference_type, reference_id, description)
    values
      (v_order.user_id, 'refund', -v_reclaim, v_new_balance, 'order', v_order.id,
       'Order refunded — ' || v_reclaim || ' credits reclaimed');
  end if;

  update public.orders
     set status = 'refunded', updated_at = now()
   where id = p_order_id;

  return v_reclaim;
end;
$$;

-- ---------------------------------------------------------------------------
-- admin_adjust_credits — manual grant or deduction from the admin panel.
-- Verifies the caller is an admin inside the function, so it is safe even if
-- someone reaches it directly through PostgREST.
-- ---------------------------------------------------------------------------
create or replace function public.admin_adjust_credits(
  p_user_id uuid,
  p_amount integer,
  p_description text default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
  v_new_balance integer;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  if p_amount is null or p_amount = 0 then
    raise exception 'invalid_amount' using errcode = '22023';
  end if;

  select balance into v_balance
    from public.credit_balances where user_id = p_user_id for update;

  if v_balance is null then
    insert into public.credit_balances (user_id, balance)
    values (p_user_id, 0) on conflict (user_id) do nothing;
    v_balance := 0;
  end if;

  v_new_balance := greatest(0, v_balance + p_amount);

  update public.credit_balances
     set balance = v_new_balance, updated_at = now()
   where user_id = p_user_id;

  insert into public.credit_transactions
    (user_id, type, amount, balance_after, reference_type, reference_id, description)
  values
    (p_user_id, 'admin_adjustment', v_new_balance - v_balance, v_new_balance,
     'admin', auth.uid(), coalesce(p_description, 'Manual adjustment'));

  return v_new_balance;
end;
$$;

-- ---------------------------------------------------------------------------
-- Execution grants. consume/refund/complete are called with the service role
-- from API routes only; admin_adjust_credits verifies its own caller.
-- ---------------------------------------------------------------------------
revoke all on function public.consume_credits(uuid, integer, text, text, uuid) from public, anon, authenticated;
revoke all on function public.refund_credits(uuid, integer, text, text, uuid) from public, anon, authenticated;
revoke all on function public.complete_order_and_credit(uuid, text) from public, anon, authenticated;
revoke all on function public.refund_order(uuid) from public, anon, authenticated;

grant execute on function public.consume_credits(uuid, integer, text, text, uuid) to service_role;
grant execute on function public.refund_credits(uuid, integer, text, text, uuid) to service_role;
grant execute on function public.complete_order_and_credit(uuid, text) to service_role;
grant execute on function public.refund_order(uuid) to service_role;
grant execute on function public.admin_adjust_credits(uuid, integer, text) to authenticated, service_role;
grant execute on function public.is_admin(uuid) to authenticated, anon, service_role;
