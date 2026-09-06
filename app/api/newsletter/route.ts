import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { newsletterSchema } from "@/lib/security/validation";
import { getClientIp, rateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Footer newsletter signup.
 *
 * The address is stored and nothing else happens — `lib/email.ts` is still a
 * stub, so no provider exists to send from. The form copy says exactly that
 * rather than implying a list that already mails people.
 *
 * Insert goes through the anon RLS policy `newsletter_insert_any`, the same
 * shape as contact_messages: anyone may write, only admins may read.
 */
export async function POST(request: Request) {
  const limit = await rateLimit("contact", getClientIp(request));
  if (!limit.success) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = newsletterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Enter a valid email address." },
      { status: 400 },
    );
  }

  const user = await getSessionUser();
  const supabase = await createClient();

  const { error } = await supabase.from("newsletter_subscribers").insert({
    email: parsed.data.email,
    user_id: user?.id ?? null,
    source: "footer",
  });

  if (error) {
    // 23505 is the unique index on lower(email). Already subscribed is a
    // success from the visitor's point of view, and reporting it as a failure
    // would leak whether an address is on the list.
    if (error.code === "23505") {
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json(
      { error: "Could not save your address. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
