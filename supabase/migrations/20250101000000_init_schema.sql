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
