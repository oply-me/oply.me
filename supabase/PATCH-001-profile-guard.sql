-- ============================================================================
-- Oply — PATCH 001: scope the profile guard trigger to client sessions
--
-- The original trigger pinned role/disabled for EVERY caller, including the
-- service role and the SQL editor. Effects:
--   * the admin panel could not disable an account or change a role
--   * promoting your first admin via SQL silently did nothing
--
-- Both UPDATEs reported success while changing nothing, which is the worst
-- kind of failure. This scopes the guard to ordinary client sessions only.
-- Safe to re-run.
-- ============================================================================

create or replace function public.guard_profile_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_user = 'authenticated' and not public.is_admin(auth.uid()) then
    new.role     := old.role;
    new.disabled := old.disabled;
    new.id       := old.id;
    new.email    := old.email;
  end if;
  return new;
end;
$$;
