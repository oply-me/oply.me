-- ============================================================================
-- Oply — harden the signup path against unvalidated user metadata
--
-- `handle_new_user()` copied `full_name` and `avatar_url` straight out of
-- `new.raw_user_meta_data` into `public.profiles`. That object is whatever the
-- client sent to `supabase.auth.signUp({ options: { data } })`, and the anon
-- key is public and shipped in the browser bundle — so anyone can sign up with
-- arbitrary keys and arbitrary lengths, not just the two fields the sign-up
-- form happens to submit.
--
-- Verified against the live database before writing this: a signup carrying
-- `full_name` of 5,000 characters, `avatar_url` of "javascript:alert(1)", and
-- an `avatar_url` of 5,000 characters were all stored verbatim.
--
-- The signup path is not the only hole. `profiles_update_own` lets a user
-- UPDATE their own row through PostgREST with the public anon key, and
-- `guard_profile_privileged_columns()` only pins `role` and `disabled`. So
-- `full_name`, `avatar_url` and `primary_use_case` were writable directly,
-- with any value, never touching `app/api/profile/route.ts`. That route runs
-- `profileSchema` — 120 characters, a real URL, 500 characters — which made
-- the validation effectively decorative: it constrained the polite client and
-- nothing else. Confirmed the same way: an authenticated user wrote a
-- 5,000-character name and a `javascript:` avatar straight into their row.
--
-- What this is NOT: `role` and `disabled` were never exposed — the insert
-- takes their column defaults and the guard trigger covers updates, so there
-- is no privilege escalation, and an `<img src>` cannot execute a
-- `javascript:` URL so this is not stored XSS. It is a validation bypass and
-- an unbounded write on a self-serve, public endpoint.
--
-- Two layers, and the second is the one that actually closes it:
--   1. the trigger sanitises what signup metadata it accepts;
--   2. CHECK constraints bind every writer — the trigger, the API route, and
--      a direct PostgREST call alike. Application-level validation cannot,
--      because the client can simply not use the application.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Sanitise metadata at the point it enters profiles
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bonus      integer;
  v_full_name  text;
  v_avatar_url text;
begin
  -- `name` stays as a fallback: an OAuth provider populates that key rather
  -- than `full_name`, and this project may add one later.
  v_full_name := nullif(
    btrim(
      coalesce(
        new.raw_user_meta_data ->> 'full_name',
        new.raw_user_meta_data ->> 'name'
      )
    ),
    ''
  );

  if v_full_name is not null then
    -- Newlines and tabs would let a display name forge extra lines wherever
    -- it is rendered.
    v_full_name := regexp_replace(v_full_name, '[[:cntrl:]]', ' ', 'g');
    -- Truncated, not rejected. A trigger that raises here would fail the whole
    -- signup; the caller is a person creating an account, not an API client
    -- that can read an error. 120 matches profileSchema.
    v_full_name := left(v_full_name, 120);
    v_full_name := nullif(btrim(v_full_name), '');
  end if;

  v_avatar_url := nullif(btrim(new.raw_user_meta_data ->> 'avatar_url'), '');

  -- Dropped rather than truncated: half a URL is not a smaller URL, it is
  -- rubbish. Anything that is not a plain http(s) URL within the same 500
  -- character cap profileSchema enforces is discarded.
  if v_avatar_url is not null
     and (
       length(v_avatar_url) > 500
       or v_avatar_url !~ '^https?://[^[:space:]]+$'
     )
  then
    v_avatar_url := null;
  end if;

  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, v_full_name, v_avatar_url)
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

-- ---------------------------------------------------------------------------
-- 2. Backstop the columns themselves
--
-- `not valid` so the migration cannot fail on a pre-existing row in someone's
-- local or staging database. New and updated rows are still checked, which is
-- the point — this is a guard against a future writer, not a data cleanup.
-- ---------------------------------------------------------------------------
alter table public.profiles
  drop constraint if exists profiles_full_name_length;
alter table public.profiles
  add constraint profiles_full_name_length
  check (full_name is null or length(full_name) <= 120) not valid;

alter table public.profiles
  drop constraint if exists profiles_avatar_url_valid;
alter table public.profiles
  add constraint profiles_avatar_url_valid
  check (
    avatar_url is null
    or (length(avatar_url) <= 500 and avatar_url ~ '^https?://[^[:space:]]+$')
  ) not valid;

alter table public.profiles
  drop constraint if exists profiles_primary_use_case_length;
alter table public.profiles
  add constraint profiles_primary_use_case_length
  check (primary_use_case is null or length(primary_use_case) <= 60) not valid;
