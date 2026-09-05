import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types/database";

export interface SessionUser {
  id: string;
  email: string;
  profile: Profile | null;
}

/** Returns the signed-in user, or null. Never throws. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return { id: user.id, email: user.email ?? "", profile: profile ?? null };
}

/** Server Component guard — redirects to /login when signed out. */
export async function requireUser(nextPath?: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    redirect(nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login");
  }
  if (user.profile?.disabled) {
    redirect("/login?error=account_disabled");
  }
  return user;
}

/**
 * Admin guard. The role is read from the database on every call — never from
 * a cookie, a client prop, or the presence of a nav link.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser("/admin");
  if (user.profile?.role !== "admin") {
    redirect("/dashboard");
  }
  return user;
}

/** API-route variant: returns the user or null without redirecting. */
export async function getApiUser(): Promise<SessionUser | null> {
  const user = await getSessionUser();
  if (!user || user.profile?.disabled) return null;
  return user;
}

/** API-route admin check. Every admin endpoint must call this itself. */
export async function getApiAdmin(): Promise<SessionUser | null> {
  const user = await getApiUser();
  if (!user || user.profile?.role !== "admin") return null;
  return user;
}
