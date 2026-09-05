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
