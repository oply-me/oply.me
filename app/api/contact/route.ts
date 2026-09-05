import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { contactSchema } from "@/lib/security/validation";
import { getClientIp, rateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // Public endpoint, so rate limit by IP.
  const limit = await rateLimit("contact", getClientIp(request));
  if (!limit.success) {
    return NextResponse.json(
      { error: "Too many messages sent. Please try again later." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return NextResponse.json(
      { error: "Please check the form.", fieldErrors },
      { status: 400 },
    );
  }

  const user = await getSessionUser();
  const supabase = await createClient();

  const { error } = await supabase.from("contact_messages").insert({
    user_id: user?.id ?? null,
    name: parsed.data.name,
    email: parsed.data.email,
    message: parsed.data.message,
  });

  if (error) {
    console.error("[contact] could not store message", { error: error.message });
    return NextResponse.json(
      { error: "Could not send your message. Please email us directly." },
      { status: 500 },
    );
  }

  return NextResponse.json({ sent: true });
}
