-- ============================================================================
-- Oply — referral program
--
-- Wires up `referral_codes`, `referrals` and `referral_rewards`, which have
-- shipped since the initial schema and had no code behind them.
--
-- The shape follows what those tables already imply:
--   * rewards are credits (`referral_rewards.credits` is an integer), never
--     money — there is no payout rail anywhere in this project;
--   * a referral is created at signup and *qualifies* later
--     (`referrals.qualified_at` is nullable and separate from `created_at`);
--   * attribution is permanent and first-touch (`unique (referred_id)`).
--
-- RLS on all three tables is SELECT-only on own rows and stays that way. Every
-- write here goes through a SECURITY DEFINER function, exactly like the credit
-- ledger, so a user can never author their own reward.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Tunables. Read at runtime like signup_bonus_credits, so a rate change is an
-- admin edit rather than a deploy. referral_referred_bonus_credits = 0 makes
-- the program single-sided, which is the configured default.
-- ---------------------------------------------------------------------------
insert into public.site_settings (key, value) values
  ('referral_enabled',                 'true'::jsonb),
  ('referral_reward_credits',          '500'::jsonb),
  ('referral_referred_bonus_credits',  '0'::jsonb)
on conflict (key) do nothing;

create index if not exists referrals_referrer_idx
  on public.referrals(referrer_id, created_at desc);
create index if not exists referral_rewards_user_idx
  on public.referral_rewards(user_id, granted_at desc);

-- ---------------------------------------------------------------------------
-- normalise_email — collapses the aliasing tricks used to refer yourself.
--
-- Gmail ignores dots and everything after a '+', so alice@gmail.com,
-- a.l.i.c.e@gmail.com and alice+ref@gmail.com are one mailbox. Plus-addressing
-- is near-universal, so it is stripped for every domain; dot-stripping is
-- applied only to the Google domains where it is actually true.
--
-- This is deliberately a small, explainable rule rather than a fraud score.
-- ---------------------------------------------------------------------------
create or replace function public.normalise_email(p_email text)
returns text
language plpgsql
immutable
as $$
declare
  v_local  text;
  v_domain text;
begin
  if p_email is null then return null; end if;

  v_local  := lower(split_part(p_email, '@', 1));
  v_domain := lower(split_part(p_email, '@', 2));

  v_local := split_part(v_local, '+', 1);

  if v_domain in ('gmail.com', 'googlemail.com') then
    v_local := replace(v_local, '.', '');
  end if;

  return v_local || '@' || v_domain;
end;
$$;

-- ---------------------------------------------------------------------------
-- attach_referral — records who referred a new account.
--
-- Called server-side once a session exists, never from the signup trigger:
-- that trigger can only see `raw_user_meta_data`, which is whatever the client
-- sent to signUp. A *code* arriving from the client is fine, because it is
-- only ever a lookup key resolved against `referral_codes` here — but a
-- referrer id from the client would be an identity claim, and is never
-- accepted.
--
-- Returns true only when a new referral row was created. Every rejection is a
-- silent false: an unknown code, a disabled code, a self-referral, an account
-- that already has a referrer, or an aliased duplicate of the referrer's own
-- email. None of them should tell the caller which case it hit.
-- ---------------------------------------------------------------------------
create or replace function public.attach_referral(
  p_referred_id uuid,
  p_code        text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_referrer_id    uuid;
  v_referred_email text;
  v_referrer_email text;
  v_enabled        boolean;
begin
  if p_referred_id is null or nullif(btrim(coalesce(p_code, '')), '') is null then
    return false;
  end if;

  select coalesce((value #>> '{}')::boolean, true)
    into v_enabled
    from public.site_settings
   where key = 'referral_enabled';

  if coalesce(v_enabled, true) is not true then
    return false;
  end if;

  select user_id into v_referrer_id
    from public.referral_codes
   where code = btrim(p_code)
     and enabled = true;

  if v_referrer_id is null then
    return false;
  end if;

  -- Self-referral, by id.
  if v_referrer_id = p_referred_id then
    return false;
  end if;

  select email into v_referred_email from public.profiles where id = p_referred_id;
  select email into v_referrer_email from public.profiles where id = v_referrer_id;

  -- Self-referral, by aliased mailbox.
  if v_referred_email is not null
     and v_referrer_email is not null
     and public.normalise_email(v_referred_email)
         = public.normalise_email(v_referrer_email)
  then
    return false;
  end if;

  -- `unique (referred_id)` makes first-touch permanent; a second link never
  -- overwrites the first.
  insert into public.referrals (referrer_id, referred_id, referral_code)
  values (v_referrer_id, p_referred_id, btrim(p_code))
  on conflict (referred_id) do nothing;

  return found;
end;
$$;

-- ---------------------------------------------------------------------------
-- grant_referral_reward — qualification, called from complete_order_and_credit.
--
-- The qualifying event is the referred user's *first* completed order. Signup
-- alone would make the program a faucet on top of the welcome bonus, and any
-- later order is guarded by `qualified_at` so a referrer is paid once per
-- referred account, not once per purchase.
--
-- Assumes the caller already holds the order row lock.
-- ---------------------------------------------------------------------------
create or replace function public.grant_referral_reward(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order        public.orders%rowtype;
  v_referral     public.referrals%rowtype;
  v_reward       integer;
  v_bonus        integer;
  v_enabled      boolean;
  v_balance      integer;
  v_new_balance  integer;
begin
  select * into v_order from public.orders where id = p_order_id;
  if not found then return; end if;

  select coalesce((value #>> '{}')::boolean, true) into v_enabled
    from public.site_settings where key = 'referral_enabled';
  if coalesce(v_enabled, true) is not true then return; end if;

  -- Unqualified referral for this buyer, locked so two concurrent order
  -- completions cannot both pay out.
  select * into v_referral
    from public.referrals
   where referred_id = v_order.user_id
     and qualified_at is null
     for update;
  if not found then return; end if;

  select coalesce((value #>> '{}')::integer, 0) into v_reward
    from public.site_settings where key = 'referral_reward_credits';
  select coalesce((value #>> '{}')::integer, 0) into v_bonus
    from public.site_settings where key = 'referral_referred_bonus_credits';

  v_reward := coalesce(v_reward, 0);
  v_bonus  := coalesce(v_bonus, 0);

  update public.referrals
     set qualified_at = now()
   where id = v_referral.id;

  -- Referrer.
  if v_reward > 0 then
    select balance into v_balance
      from public.credit_balances where user_id = v_referral.referrer_id for update;

    if v_balance is null then
      insert into public.credit_balances (user_id, balance) values (v_referral.referrer_id, 0)
      on conflict (user_id) do nothing;
      v_balance := 0;
    end if;

    v_new_balance := v_balance + v_reward;
    update public.credit_balances
       set balance = v_new_balance, updated_at = now()
     where user_id = v_referral.referrer_id;

    -- reference_id is the referral, which is what the clawback looks up.
    insert into public.credit_transactions
      (user_id, type, amount, balance_after, reference_type, reference_id, description)
    values
      (v_referral.referrer_id, 'bonus', v_reward, v_new_balance, 'referral', v_referral.id,
       'Referral reward — ' || v_reward || ' credits');

    insert into public.referral_rewards (referral_id, user_id, credits)
    values (v_referral.id, v_referral.referrer_id, v_reward);
  end if;

  -- Referred side, when configured above zero.
  if v_bonus > 0 then
    select balance into v_balance
      from public.credit_balances where user_id = v_referral.referred_id for update;
    v_new_balance := coalesce(v_balance, 0) + v_bonus;

    update public.credit_balances
       set balance = v_new_balance, updated_at = now()
     where user_id = v_referral.referred_id;

    insert into public.credit_transactions
      (user_id, type, amount, balance_after, reference_type, reference_id, description)
    values
      (v_referral.referred_id, 'bonus', v_bonus, v_new_balance, 'referral', v_referral.id,
       'Referral bonus — ' || v_bonus || ' credits');

    insert into public.referral_rewards (referral_id, user_id, credits)
    values (v_referral.id, v_referral.referred_id, v_bonus);
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- reverse_referral_reward — clawback when the qualifying order is reversed.
--
-- Mirrors refund_order's own rule: reclaim what is there, never push a balance
-- negative, and never turn spent credits into debt. The referral returns to
-- unqualified so a genuine later purchase can still earn once — the reward
-- cannot be double-collected, because the credits were taken back first.
-- ---------------------------------------------------------------------------
create or replace function public.reverse_referral_reward(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_referral    public.referrals%rowtype;
  v_reward      public.referral_rewards%rowtype;
  v_balance     integer;
  v_reclaim     integer;
  v_new_balance integer;
  v_total       integer := 0;
begin
  select * into v_referral
    from public.referrals
   where referred_id = p_user_id
     and qualified_at is not null
     for update;
  if not found then return 0; end if;

  for v_reward in
    select * from public.referral_rewards where referral_id = v_referral.id
  loop
    select balance into v_balance
      from public.credit_balances where user_id = v_reward.user_id for update;

    v_reclaim := least(coalesce(v_balance, 0), v_reward.credits);

    if v_reclaim > 0 then
      v_new_balance := v_balance - v_reclaim;
      update public.credit_balances
         set balance = v_new_balance, updated_at = now()
       where user_id = v_reward.user_id;

      insert into public.credit_transactions
        (user_id, type, amount, balance_after, reference_type, reference_id, description)
      values
        (v_reward.user_id, 'refund', -v_reclaim, v_new_balance, 'referral', v_referral.id,
         'Referral reward reversed — ' || v_reclaim || ' credits reclaimed');

      v_total := v_total + v_reclaim;
    end if;
  end loop;

  delete from public.referral_rewards where referral_id = v_referral.id;

  update public.referrals set qualified_at = null where id = v_referral.id;

  return v_total;
end;
$$;

-- ---------------------------------------------------------------------------
-- Hook qualification into order completion.
--
-- Same body as 20250101000100_credit_ledger.sql, with the reward call added at
-- the end so it runs inside the same transaction and inherits its rollback.
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

  -- Qualification. Guarded by `qualified_at`, so only the first completed
  -- order for this buyer ever pays out.
  perform public.grant_referral_reward(p_order_id);

  return true;
end;
$$;

-- ---------------------------------------------------------------------------
-- Hook clawback into order reversal.
--
-- Same body as the credit ledger's version, with the referral reversal added.
-- It runs before the order is marked refunded so the balance locks are taken
-- in a consistent order with grant_referral_reward.
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

  -- Reverse any referral reward this buyer's purchase triggered, before the
  -- buyer's own credits are reclaimed below.
  perform public.reverse_referral_reward(v_order.user_id);

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
-- Execution grants.
--
-- Same shape as the credit ledger: withdraw the default PUBLIC execute, then
-- grant back only to service_role. Revoking alone is not enough — a bare
-- revoke would also strip the service role and every RPC call here would fail
-- with "permission denied for function".
--
-- normalise_email is only ever called from inside attach_referral, which runs
-- as the definer, so it needs no grant of its own.
-- ---------------------------------------------------------------------------
revoke all on function public.normalise_email(text) from public, anon, authenticated;
revoke all on function public.attach_referral(uuid, text) from public, anon, authenticated;
revoke all on function public.grant_referral_reward(uuid) from public, anon, authenticated;
revoke all on function public.reverse_referral_reward(uuid) from public, anon, authenticated;

grant execute on function public.attach_referral(uuid, text) to service_role;
grant execute on function public.grant_referral_reward(uuid) to service_role;
grant execute on function public.reverse_referral_reward(uuid) to service_role;
