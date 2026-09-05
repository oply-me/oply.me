-- ============================================================
-- Oply — complete database setup
-- Paste this whole file into the Supabase SQL editor and Run.
-- Safe to re-run: every statement is idempotent.
-- ============================================================


-- >>>> supabase/migrations/20250101000000_init_schema.sql

-- ============================================================================
-- Oply — core schema
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('user', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.credit_transaction_type as enum (
    'purchase', 'usage', 'refund', 'bonus', 'admin_adjustment'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_status as enum (
    'pending', 'processing', 'completed', 'failed', 'expired', 'refunded'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.generation_status as enum ('completed', 'failed');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  role public.user_role not null default 'user',
  -- onboarding answer, used to personalise recommended tools
  primary_use_case text,
  onboarded_at timestamptz,
  disabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_created_at_idx on public.profiles(created_at desc);

-- ---------------------------------------------------------------------------
-- credit_balances
-- One row per user. Never written to directly by clients — only by the
-- SECURITY DEFINER functions in the credit-ledger migration.
-- ---------------------------------------------------------------------------
create table if not exists public.credit_balances (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  lifetime_purchased integer not null default 0 check (lifetime_purchased >= 0),
  lifetime_used integer not null default 0 check (lifetime_used >= 0),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- credit_transactions — append-only ledger
-- ---------------------------------------------------------------------------
create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type public.credit_transaction_type not null,
  -- signed: positive adds credits, negative consumes them
  amount integer not null,
  balance_after integer not null,
  reference_type text,
  reference_id uuid,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists credit_transactions_user_created_idx
  on public.credit_transactions(user_id, created_at desc);
create index if not exists credit_transactions_type_idx
  on public.credit_transactions(type);
create index if not exists credit_transactions_reference_idx
  on public.credit_transactions(reference_type, reference_id);

-- ---------------------------------------------------------------------------
-- tool_categories
-- ---------------------------------------------------------------------------
create table if not exists public.tool_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  icon text,
  enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- tools — admin-controlled registry, mirrors config/tools.ts
-- ---------------------------------------------------------------------------
create table if not exists public.tools (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  tagline text,
  description text,
  category_id uuid references public.tool_categories(id) on delete set null,
  icon text,
  credit_cost integer not null default 10 check (credit_cost >= 0),
  -- server-authoritative prompt; never exposed through a public endpoint
  system_prompt text,
  -- which reusable workspace template renders this tool
  component text not null default 'standard-text',
  input_schema jsonb not null default '[]'::jsonb,
  output_type text not null default 'text',
  max_input_chars integer not null default 10000,
  seo_title text,
  seo_description text,
  featured boolean not null default false,
  enabled boolean not null default true,
  new_until timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tools_enabled_sort_idx on public.tools(enabled, sort_order);
create index if not exists tools_category_idx on public.tools(category_id);

-- Audit trail for admin edits to tool configuration.
create table if not exists public.tool_audit_log (
  id uuid primary key default gen_random_uuid(),
  tool_id uuid references public.tools(id) on delete set null,
  tool_slug text,
  admin_id uuid references public.profiles(id) on delete set null,
  action text not null,
  changes jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id text not null,
  plan_name text not null,
  -- authoritative values, resolved server-side from config/pricing.ts
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'USD',
  credits integer not null check (credits > 0),
  status public.order_status not null default 'pending',
  payment_provider text not null,
  provider_payment_id text,
  provider_checkout_url text,
  pay_currency text,
  pay_amount numeric(24, 8),
  pay_address text,
  expires_at timestamptz,
  completed_at timestamptz,
  credited boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_user_created_idx on public.orders(user_id, created_at desc);
create index if not exists orders_status_idx on public.orders(status);
create unique index if not exists orders_provider_payment_id_key
  on public.orders(payment_provider, provider_payment_id)
  where provider_payment_id is not null;

-- ---------------------------------------------------------------------------
-- payment_events — raw webhook log, the idempotency guard
-- ---------------------------------------------------------------------------
create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  event_type text,
  order_id uuid references public.orders(id) on delete set null,
  payload jsonb,
  processed boolean not null default false,
  processed_at timestamptz,
  error text,
  created_at timestamptz not null default now(),
  -- the constraint that makes webhook processing idempotent
  constraint payment_events_provider_event_unique unique (provider, provider_event_id)
);

create index if not exists payment_events_order_idx on public.payment_events(order_id);

-- ---------------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_user_idx on public.projects(user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- ai_generations
-- ---------------------------------------------------------------------------
create table if not exists public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tool_slug text not null,
  tool_name text not null,
  project_id uuid references public.projects(id) on delete set null,
  input jsonb not null default '{}'::jsonb,
  input_preview text,
  output_text text,
  output_json jsonb,
  credits_used integer not null default 0,
  model text,
  provider text,
  status public.generation_status not null default 'completed',
  error_message text,
  duration_ms integer,
  created_at timestamptz not null default now()
);

create index if not exists ai_generations_user_created_idx
  on public.ai_generations(user_id, created_at desc);
create index if not exists ai_generations_tool_idx on public.ai_generations(tool_slug);
create index if not exists ai_generations_project_idx on public.ai_generations(project_id);

-- ---------------------------------------------------------------------------
-- favorites — saved generations
-- ---------------------------------------------------------------------------
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  generation_id uuid not null references public.ai_generations(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint favorites_user_generation_unique unique (user_id, generation_id)
);

create index if not exists favorites_user_idx on public.favorites(user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- favorite_tools — users pinning a tool itself
-- ---------------------------------------------------------------------------
create table if not exists public.favorite_tools (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tool_slug text not null,
  created_at timestamptz not null default now(),
  constraint favorite_tools_user_tool_unique unique (user_id, tool_slug)
);

-- ---------------------------------------------------------------------------
-- project_items
-- ---------------------------------------------------------------------------
create table if not exists public.project_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  generation_id uuid not null references public.ai_generations(id) on delete cascade,
  note text,
  created_at timestamptz not null default now(),
  constraint project_items_unique unique (project_id, generation_id)
);

-- ---------------------------------------------------------------------------
-- ai_usage — per-request cost tracking for admin analytics
-- ---------------------------------------------------------------------------
create table if not exists public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  generation_id uuid references public.ai_generations(id) on delete set null,
  tool_slug text,
  provider text not null,
  model text not null,
  input_tokens integer,
  output_tokens integer,
  -- clearly an estimate: providers report usage, prices are from our own table
  estimated_cost_usd numeric(12, 6),
  credits_charged integer,
  success boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_created_idx on public.ai_usage(created_at desc);
create index if not exists ai_usage_tool_idx on public.ai_usage(tool_slug);
create index if not exists ai_usage_user_idx on public.ai_usage(user_id);

-- ---------------------------------------------------------------------------
-- contact_messages
-- ---------------------------------------------------------------------------
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  name text not null,
  email text not null,
  message text not null,
  handled boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- site_settings — editable operational configuration
-- ---------------------------------------------------------------------------
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- announcements — admin-controlled dashboard banner
-- ---------------------------------------------------------------------------
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  link_url text,
  link_label text,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Future architecture: referrals and coupons.
-- Tables exist so the credit ledger never needs reshaping later; no feature
-- code reads them yet.
-- ---------------------------------------------------------------------------
create table if not exists public.referral_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  code text not null unique,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  referred_id uuid not null references public.profiles(id) on delete cascade,
  referral_code text,
  qualified_at timestamptz,
  created_at timestamptz not null default now(),
  constraint referrals_unique unique (referred_id)
);

create table if not exists public.referral_rewards (
  id uuid primary key default gen_random_uuid(),
  referral_id uuid not null references public.referrals(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  credits integer not null,
  granted_at timestamptz not null default now()
);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null check (discount_type in ('percent', 'fixed', 'bonus_credits')),
  discount_value numeric(12, 2) not null,
  max_uses integer,
  used_count integer not null default 0,
  expires_at timestamptz,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['profiles', 'tools', 'orders', 'projects']
  loop
    execute format(
      'drop trigger if exists %I on public.%I', t || '_touch_updated_at', t
    );
    execute format(
      'create trigger %I before update on public.%I
       for each row execute function public.touch_updated_at()',
      t || '_touch_updated_at', t
    );
  end loop;
end $$;


-- >>>> supabase/migrations/20250101000100_credit_ledger.sql

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


-- >>>> supabase/migrations/20250101000200_rls.sql

-- ============================================================================
-- Oply — Row Level Security
--
-- Principle: a logged-in user can read and write only their own rows, and can
-- never touch credit balances, order status, roles, or anyone else's data.
-- Writes that must be trusted (credits, order fulfilment) happen through
-- SECURITY DEFINER functions called with the service role, which bypasses RLS.
-- ============================================================================

alter table public.profiles            enable row level security;
alter table public.credit_balances     enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.tool_categories     enable row level security;
alter table public.tools               enable row level security;
alter table public.tool_audit_log      enable row level security;
alter table public.orders              enable row level security;
alter table public.payment_events      enable row level security;
alter table public.projects            enable row level security;
alter table public.project_items       enable row level security;
alter table public.ai_generations      enable row level security;
alter table public.favorites           enable row level security;
alter table public.favorite_tools      enable row level security;
alter table public.ai_usage            enable row level security;
alter table public.contact_messages    enable row level security;
alter table public.site_settings       enable row level security;
alter table public.announcements       enable row level security;
alter table public.referral_codes      enable row level security;
alter table public.referrals           enable row level security;
alter table public.referral_rewards    enable row level security;
alter table public.coupons             enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

-- A user may edit their own profile, but role/disabled are protected by the
-- guard trigger below — a policy alone cannot pin individual columns.
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- Stops a user from promoting themselves or re-enabling a disabled account.
--
-- Only signed-in browser sessions are constrained. The trigger is SECURITY
-- DEFINER, so `current_user` is the owner rather than the caller — the JWT
-- role claim is the signal that actually identifies who is calling.
create or replace function public.guard_profile_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_jwt_role text;
begin
  begin
    v_jwt_role := nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role';
  exception when others then
    -- Malformed or absent claims: treat as direct SQL access.
    v_jwt_role := null;
  end;

  if v_jwt_role = 'authenticated' and not public.is_admin(auth.uid()) then
    new.role     := old.role;
    new.disabled := old.disabled;
    new.id       := old.id;
    new.email    := old.email;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_guard_privileged on public.profiles;
create trigger profiles_guard_privileged
  before update on public.profiles
  for each row execute function public.guard_profile_privileged_columns();

-- ---------------------------------------------------------------------------
-- credit_balances — readable by the owner, writable by nobody.
-- No INSERT/UPDATE/DELETE policy exists, so PostgREST rejects all writes for
-- both anon and authenticated roles.
-- ---------------------------------------------------------------------------
drop policy if exists "credit_balances_select_own" on public.credit_balances;
create policy "credit_balances_select_own" on public.credit_balances
  for select using (auth.uid() = user_id or public.is_admin());

-- ---------------------------------------------------------------------------
-- credit_transactions — read-only history for the owner.
-- ---------------------------------------------------------------------------
drop policy if exists "credit_transactions_select_own" on public.credit_transactions;
create policy "credit_transactions_select_own" on public.credit_transactions
  for select using (auth.uid() = user_id or public.is_admin());

-- ---------------------------------------------------------------------------
-- Public catalogue: tools and categories are world-readable when enabled.
-- system_prompt is never selected by public code paths; admin writes only.
-- ---------------------------------------------------------------------------
drop policy if exists "tool_categories_public_read" on public.tool_categories;
create policy "tool_categories_public_read" on public.tool_categories
  for select using (enabled or public.is_admin());

drop policy if exists "tool_categories_admin_write" on public.tool_categories;
create policy "tool_categories_admin_write" on public.tool_categories
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "tools_public_read" on public.tools;
create policy "tools_public_read" on public.tools
  for select using (enabled or public.is_admin());

drop policy if exists "tools_admin_write" on public.tools;
create policy "tools_admin_write" on public.tools
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "tool_audit_admin" on public.tool_audit_log;
create policy "tool_audit_admin" on public.tool_audit_log
  for select using (public.is_admin());

-- ---------------------------------------------------------------------------
-- orders — a user sees their own orders and can never change status.
-- Orders are created server-side by the service role.
-- ---------------------------------------------------------------------------
drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own" on public.orders
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "orders_admin_write" on public.orders;
create policy "orders_admin_write" on public.orders
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- payment_events — admin only. Raw provider payloads are never user-visible.
-- ---------------------------------------------------------------------------
drop policy if exists "payment_events_admin" on public.payment_events;
create policy "payment_events_admin" on public.payment_events
  for select using (public.is_admin());

-- ---------------------------------------------------------------------------
-- ai_generations
-- ---------------------------------------------------------------------------
drop policy if exists "generations_select_own" on public.ai_generations;
create policy "generations_select_own" on public.ai_generations
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "generations_update_own" on public.ai_generations;
create policy "generations_update_own" on public.ai_generations
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "generations_delete_own" on public.ai_generations;
create policy "generations_delete_own" on public.ai_generations
  for delete using (auth.uid() = user_id);

-- No INSERT policy: generations are written by the API route with the service
-- role, after credits have been reserved. A client cannot fabricate history.

-- ---------------------------------------------------------------------------
-- favorites
-- ---------------------------------------------------------------------------
drop policy if exists "favorites_own" on public.favorites;
create policy "favorites_own" on public.favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "favorite_tools_own" on public.favorite_tools;
create policy "favorite_tools_own" on public.favorite_tools
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- projects and project items
-- ---------------------------------------------------------------------------
drop policy if exists "projects_own" on public.projects;
create policy "projects_own" on public.projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "project_items_own" on public.project_items;
create policy "project_items_own" on public.project_items
  for all using (
    exists (select 1 from public.projects p
             where p.id = project_id and p.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.projects p
             where p.id = project_id and p.user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- ai_usage — cost data is operational, admin only.
-- ---------------------------------------------------------------------------
drop policy if exists "ai_usage_admin" on public.ai_usage;
create policy "ai_usage_admin" on public.ai_usage
  for select using (public.is_admin());

-- ---------------------------------------------------------------------------
-- contact_messages — anyone may submit, only admins may read.
-- ---------------------------------------------------------------------------
drop policy if exists "contact_insert_any" on public.contact_messages;
create policy "contact_insert_any" on public.contact_messages
  for insert with check (true);

drop policy if exists "contact_admin_read" on public.contact_messages;
create policy "contact_admin_read" on public.contact_messages
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- site_settings / announcements
-- ---------------------------------------------------------------------------
drop policy if exists "site_settings_read" on public.site_settings;
create policy "site_settings_read" on public.site_settings
  for select using (true);

drop policy if exists "site_settings_admin_write" on public.site_settings;
create policy "site_settings_admin_write" on public.site_settings
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "announcements_read" on public.announcements;
create policy "announcements_read" on public.announcements
  for select using (
    (enabled and starts_at <= now() and (ends_at is null or ends_at > now()))
    or public.is_admin()
  );

drop policy if exists "announcements_admin_write" on public.announcements;
create policy "announcements_admin_write" on public.announcements
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Future tables: locked down until the features exist.
-- ---------------------------------------------------------------------------
drop policy if exists "referral_codes_own" on public.referral_codes;
create policy "referral_codes_own" on public.referral_codes
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "referrals_own" on public.referrals;
create policy "referrals_own" on public.referrals
  for select using (
    auth.uid() = referrer_id or auth.uid() = referred_id or public.is_admin()
  );

drop policy if exists "referral_rewards_own" on public.referral_rewards;
create policy "referral_rewards_own" on public.referral_rewards
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "coupons_admin" on public.coupons;
create policy "coupons_admin" on public.coupons
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Column-level protection for tool system prompts.
--
-- RLS is row-level, so the public read policy above would otherwise expose
-- `system_prompt` to anyone. Withdraw the table-wide SELECT and grant back
-- only the columns the public catalogue needs. Admin screens read prompts
-- through the service role instead.
-- ---------------------------------------------------------------------------
revoke select on public.tools from anon, authenticated;

grant select (
  id, slug, name, tagline, description, category_id, icon, credit_cost,
  component, input_schema, output_type, max_input_chars, seo_title,
  seo_description, featured, enabled, new_until, sort_order,
  created_at, updated_at
) on public.tools to anon, authenticated;

grant insert, update, delete on public.tools to authenticated;


-- >>>> supabase/seed/seed.sql

-- ============================================================================
-- Oply — seed data
--
-- Categories and operational settings only. The 10 launch tools are seeded
-- from config/tools.ts by `npm run db:sync-tools`, so the registry stays the
-- single source of truth and DB rows act as admin-editable overrides.
--
-- No fake users, revenue or analytics are seeded.
-- ============================================================================

insert into public.tool_categories (slug, name, description, icon, enabled, sort_order) values
  ('ai',           'AI',           'General-purpose AI tools for writing, rewriting and summarizing everyday content.', 'Sparkles',     true, 1),
  ('seo',          'SEO',          'Generate titles, meta descriptions, structured data and outlines for pages you actually want to rank.', 'Search', true, 2),
  ('marketing',    'Marketing',    'Copy and messaging tools for campaigns, launches and landing pages.', 'Megaphone',    true, 3),
  ('business',     'Business',     'Day-to-day business communication — replies, briefs and documents.', 'Briefcase',    true, 4),
  ('ecommerce',    'E-commerce',   'Product copy, listings and store content for online sellers.', 'ShoppingBag',  true, 5),
  ('creator',      'Creator',      'Tools for creators publishing across blogs, video and social.', 'Clapperboard', true, 6),
  ('productivity', 'Productivity', 'Small utilities that remove busywork from your day.', 'Zap',          true, 7),
  ('developer',    'Developer',    'Generators and helpers for people who ship software.', 'Code2',        true, 8),
  ('utilities',    'Utilities',    'General helpers that do not fit anywhere else.', 'Wrench',       true, 9)
on conflict (slug) do update set
  name        = excluded.name,
  description = excluded.description,
  icon        = excluded.icon,
  sort_order  = excluded.sort_order;

insert into public.site_settings (key, value) values
  ('signup_bonus_credits',  '50'::jsonb),
  ('low_credit_threshold',  '100'::jsonb),
  ('anonymous_demo_enabled','false'::jsonb),
  ('ai_rate_limit_per_min', '10'::jsonb),
  ('support_email',         '"support@oply.me"'::jsonb),
  ('maintenance_mode',      'false'::jsonb)
on conflict (key) do nothing;
