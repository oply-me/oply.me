import { NextResponse } from "next/server";
import { getPaymentProvider } from "@/lib/payments";
import { createAdminClient } from "@/lib/supabase/admin";
import { trackServer } from "@/lib/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Payment provider webhook — the only path that turns money into credits.
 *
 * Order of operations matters:
 *   1. verify the signature before reading anything from the payload
 *   2. insert a payment_events row; its UNIQUE (provider, provider_event_id)
 *      constraint makes a replayed event fail here rather than credit twice
 *   3. only then call the RPC, which locks the order and re-checks its
 *      `credited` flag inside the transaction
 *
 * Steps 2 and 3 are independent guards. Either alone would prevent double
 * crediting; together they also survive a provider that reuses event ids.
 */
export async function POST(request: Request) {
  const provider = getPaymentProvider();
  const rawBody = await request.text();

  const verification = await provider.verifyWebhook(rawBody, request.headers);

  if (!verification || !verification.valid) {
    console.warn("[payments/webhook] rejected unverified request", {
      provider: provider.name,
    });
    // Deliberately vague — an attacker learns nothing from this response.
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  const db = createAdminClient();

  // Idempotency guard.
  const { error: eventError } = await db.from("payment_events").insert({
    provider: provider.name,
    provider_event_id: verification.eventId,
    event_type: verification.eventType,
    order_id: verification.orderId,
    payload: verification.payload as never,
    processed: false,
  });

  if (eventError) {
    // 23505 = unique_violation: this exact event was already handled.
    if (eventError.code === "23505") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.error("[payments/webhook] could not record event", {
      eventId: verification.eventId,
      error: eventError.message,
    });
    // A 500 asks the provider to retry, which is the safe outcome here.
    return NextResponse.json({ error: "Could not record event." }, { status: 500 });
  }

  if (!verification.orderId) {
    await markProcessed(db, verification.eventId, "missing order id");
    return NextResponse.json({ received: true });
  }

  const { data: order } = await db
    .from("orders")
    .select("id, user_id, status, credits, plan_id, amount, currency")
    .eq("id", verification.orderId)
    .maybeSingle();

  if (!order) {
    await markProcessed(db, verification.eventId, "order not found");
    return NextResponse.json({ received: true });
  }

  try {
    if (verification.status === "completed") {
      // Atomic: marks the order completed and writes the ledger entry, or
      // returns false because it was already credited.
      const { data: credited, error: rpcError } = await db.rpc(
        "complete_order_and_credit",
        {
          p_order_id: order.id,
          p_provider_payment_id: verification.providerPaymentId,
        },
      );

      if (rpcError) throw rpcError;

      if (credited) {
        trackServer("payment_completed", {
          planId: order.plan_id,
          amount: Number(order.amount),
          credits: order.credits,
        });
      }
    } else if (verification.status === "refunded") {
      const { error: rpcError } = await db.rpc("refund_order", {
        p_order_id: order.id,
      });
      if (rpcError) throw rpcError;
    } else {
      // Intermediate or terminal-but-unsuccessful states just update status.
      // A completed order is never moved backwards.
      await db
        .from("orders")
        .update({
          status: verification.status,
          provider_payment_id: verification.providerPaymentId,
        })
        .eq("id", order.id)
        .neq("status", "completed");
    }

    await markProcessed(db, verification.eventId, null);
    return NextResponse.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[payments/webhook] processing failed", {
      orderId: order.id,
      eventId: verification.eventId,
      error: message,
    });
    await markProcessed(db, verification.eventId, message, false);
    return NextResponse.json({ error: "Processing failed." }, { status: 500 });
  }
}

async function markProcessed(
  db: ReturnType<typeof createAdminClient>,
  eventId: string,
  error: string | null,
  processed = true,
) {
  await db
    .from("payment_events")
    .update({
      processed,
      processed_at: new Date().toISOString(),
      error,
    })
    .eq("provider_event_id", eventId);
}
