import { NextResponse } from "next/server";
import { getCardProvider } from "@/lib/payments";
import { processPaymentWebhookEvent } from "@/lib/payments/process-webhook-event";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Paddle's webhook — point Paddle's Notification destination (dashboard, not
 * per-request) at this exact URL. Sibling to app/api/payments/webhook/route.ts
 * (NOWPayments); each provider gets its own route because each has its own
 * signature scheme.
 */
export async function POST(request: Request) {
  const provider = getCardProvider();
  const rawBody = await request.text();

  const verification = await provider.verifyWebhook(rawBody, request.headers);

  if (!verification || !verification.valid) {
    console.warn("[payments/webhook/paddle] rejected unverified request", {
      provider: provider.name,
    });
    // Deliberately vague — an attacker learns nothing from this response.
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  return processPaymentWebhookEvent(provider, verification);
}
