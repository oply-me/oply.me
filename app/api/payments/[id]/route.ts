import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { getProviderByName } from "@/lib/payments";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Order status for the checkout page to poll.
 *
 * This endpoint reports status; it never grants credits. Even if the provider
 * says the payment finished, crediting only happens through the verified
 * webhook — a user refreshing this page cannot pay themselves.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  // Read through RLS, so a user can only ever see their own order.
  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, plan_name, amount, currency, credits, status, payment_provider, provider_payment_id, provider_checkout_url, pay_address, pay_amount, pay_currency, expires_at, created_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  // For orders still in flight, ask the provider for a fresher status so the
  // page updates even if a webhook is delayed. Status only — never credits.
  if (
    (order.status === "pending" || order.status === "processing") &&
    order.provider_payment_id
  ) {
    try {
      const remote = await getProviderByName(order.payment_provider).getPaymentStatus(
        order.provider_payment_id,
      );

      if (remote.status !== order.status && remote.status !== "completed") {
        const db = createAdminClient();
        await db
          .from("orders")
          .update({ status: remote.status })
          .eq("id", order.id)
          .neq("status", "completed");
        order.status = remote.status;
      } else if (remote.status === "completed") {
        // Show "confirming" rather than "completed": the credits are not on
        // the account until the webhook has been verified and processed.
        order.status = "processing";
      }
    } catch {
      // A provider lookup failure must not break the page.
    }
  }

  return NextResponse.json({ order });
}
