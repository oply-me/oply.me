-- ============================================================================
-- Oply — newsletter subscribers + notification read state
--
-- Two additions, both driven by features that had no table to stand on:
--   1. `newsletter_subscribers` — the footer signup form. Storing the address
--      is the honest minimum; nothing is sent until a provider is wired into
--      lib/email.ts, and the form's own copy says so.
--   2. `profiles.notifications_seen_at` — the dashboard bell needs to know
--      what a user has already looked at. Without it "unread" would have to
--      live in localStorage and would be wrong on a second device.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- profiles.notifications_seen_at
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists notifications_seen_at timestamptz;

comment on column public.profiles.notifications_seen_at is
  'Last time the user opened the dashboard notification bell. Null means never.';

-- ---------------------------------------------------------------------------
-- newsletter_subscribers
-- ---------------------------------------------------------------------------
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  -- Plain text with a lower(email) unique index below, rather than citext:
  -- the citext extension is not enabled on this project and the API
  -- normalises the address before insert anyway.
  email text not null,
  -- Null for a signed-out visitor; set when a signed-in user subscribes, so a
  -- future unsubscribe can be self-serve rather than a support email.
  user_id uuid references public.profiles(id) on delete set null,
  source text not null default 'footer',
  confirmed boolean not null default false,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists newsletter_subscribers_email_unique
  on public.newsletter_subscribers(lower(email));

create index if not exists newsletter_subscribers_created_idx
  on public.newsletter_subscribers(created_at desc);

alter table public.newsletter_subscribers enable row level security;

-- Same shape as contact_messages: anyone may submit, only admins may read.
-- A public select policy would turn the table into an email-harvesting
-- endpoint, so there deliberately isn't one.
drop policy if exists "newsletter_insert_any" on public.newsletter_subscribers;
create policy "newsletter_insert_any" on public.newsletter_subscribers
  for insert with check (true);

drop policy if exists "newsletter_admin_all" on public.newsletter_subscribers;
create policy "newsletter_admin_all" on public.newsletter_subscribers
  for all using (public.is_admin()) with check (public.is_admin());
