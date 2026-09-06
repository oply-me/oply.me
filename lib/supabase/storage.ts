import "server-only";

import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "oply-images";
/** How long a signed URL for a result stays valid. Re-signed on every read, so this only bounds a single response's lifetime. */
const SIGNED_URL_TTL_SECONDS = 3600;

/**
 * Service-role Storage helper, mirroring lib/supabase/admin.ts's client
 * pattern: used only for the "{userId}/generations/…" prefix, which has no
 * client INSERT policy (see supabase/migrations/20250101000300_images.sql) —
 * the same trust boundary as ai_generations rows themselves.
 */

export async function uploadGeneratedImage(params: {
  userId: string;
  generationId: string;
  bytes: Buffer;
  mimeType: string;
}): Promise<{ path: string; signedUrl: string }> {
  const extension = params.mimeType === "image/png" ? "png" : "jpg";
  const path = `${params.userId}/generations/${params.generationId}.${extension}`;

  const admin = createAdminClient();
  const { error } = await admin.storage.from(BUCKET).upload(path, params.bytes, {
    contentType: params.mimeType,
    upsert: true,
  });
  if (error) throw error;

  const signedUrl = await createSignedDownloadUrl(path);
  return { path, signedUrl };
}

export async function createSignedDownloadUrl(path: string): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error || !data) throw error ?? new Error("Could not create a signed URL.");
  return data.signedUrl;
}

/** Downloads bytes for a path the caller has already verified the user owns. */
export async function downloadObject(path: string): Promise<{ bytes: Buffer; mimeType: string }> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(BUCKET).download(path);
  if (error || !data) throw error ?? new Error("Could not read the uploaded image.");
  const bytes = Buffer.from(await data.arrayBuffer());
  return { bytes, mimeType: data.type || "application/octet-stream" };
}

/** Best-effort cleanup — a failed upload after a successful provider call
 * should not leave an orphaned object, but this never blocks the refund. */
export async function deleteObject(path: string): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.storage.from(BUCKET).remove([path]);
  } catch {
    // Best-effort only.
  }
}

export function newGenerationId(): string {
  return randomUUID();
}
