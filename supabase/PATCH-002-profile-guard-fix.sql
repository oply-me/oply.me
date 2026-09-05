-- ============================================================================
-- Oply — PATCH 002: identify the caller correctly in the profile guard
--
-- PATCH 001 was wrong, in the opposite direction to the original bug.
--
-- The trigger is SECURITY DEFINER, so `current_user` is the function OWNER
-- (postgres), never the caller. The condition `current_user = 'authenticated'`
-- was therefore never true, and the guard stopped pinning anything at all —
-- letting a signed-in user promote themselves to admin.
--
-- The PostgREST JWT role claim is the reliable caller signal and is unaffected
-- by SECURITY DEFINER:
--     'authenticated' -> a signed-in browser session   (must be constrained)
--     'service_role'  -> trusted server code           (already gated by
--                        getApiAdmin before it ever reaches the database)
--     NULL            -> direct SQL: migrations, SQL editor
--
-- Apply this even if you already ran PATCH 001. Safe to re-run.
-- ============================================================================

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
