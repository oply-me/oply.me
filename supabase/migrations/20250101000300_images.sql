-- ============================================================================
-- Oply — image tools: storage + generation columns
--
-- Image generations are rows in the existing ai_generations table (not a
-- parallel table), so favorites and project_items keep working against them
-- unchanged. Columns are nullable and additive — text-tool rows are
-- unaffected.
-- ============================================================================

alter table public.ai_generations
  add column if not exists output_image_url    text,
  add column if not exists output_image_mime    text,
  add column if not exists output_image_width   integer,
  add column if not exists output_image_height  integer,
  add column if not exists output_storage_path  text;

-- ---------------------------------------------------------------------------
-- Storage bucket
--
-- Private: a signed URL is minted on every read (lib/supabase/storage.ts), the
-- same "never expose more than the owner needs" posture as everything else in
-- this schema. 10MB covers a generated image comfortably; the mime allowlist
-- matches what the OpenAI image endpoints return and what browsers upload.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('oply-images', 'oply-images', false, 10485760,
        array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Storage RLS
--
-- Path convention: "{userId}/uploads/{file}" for a client-uploaded source
-- image (Product Photo, Background Remover inputs) and
-- "{userId}/generations/{file}" for an AI-produced result.
--
-- Users may read, write and delete their own "uploads/" files directly — the
-- same "own row" idiom as favorites_own/projects_own above. The
-- "generations/" prefix has no client INSERT policy, mirroring
-- ai_generations itself: only the service role (lib/supabase/storage.ts,
-- called from the generate route after credits are reserved) writes there, so
-- a client cannot fabricate or overwrite generation history.
-- ---------------------------------------------------------------------------
drop policy if exists "oply_images_select_own" on storage.objects;
create policy "oply_images_select_own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'oply-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "oply_images_insert_own_uploads" on storage.objects;
create policy "oply_images_insert_own_uploads" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'oply-images'
    and (storage.foldername(name))[1] = auth.uid()::text
    and (storage.foldername(name))[2] = 'uploads'
  );

drop policy if exists "oply_images_delete_own_uploads" on storage.objects;
create policy "oply_images_delete_own_uploads" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'oply-images'
    and (storage.foldername(name))[1] = auth.uid()::text
    and (storage.foldername(name))[2] = 'uploads'
  );
