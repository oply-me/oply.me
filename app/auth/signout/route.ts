import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { absoluteUrl } from "@/lib/utils";

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  // Built from NEXT_PUBLIC_APP_URL, not the request's Host header: behind a
  // proxy that doesn't forward the original host, `request.url` resolves to
  // the app's own bind address instead of the public site.
  return NextResponse.redirect(absoluteUrl("/"), { status: 303 });
}
