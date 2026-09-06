import "server-only";

import { ApiError, Environment, EventName, Paddle, type CurrencyCode } from "@paddle/paddle-node-sdk";
import {
  PaymentError,
  type CreatePaymentParams,
  type CreatePaymentResult,
  type NormalizedStatus,
  type PaymentProvider,
  type PaymentStatusResult,
  type SupportedCurrency,
  type WebhookVerification,
} from "../types";

/** A transaction's own status field, from `transactions.get()` — used for status polling. */
const TRANSACTION_STATUS_MAP: Record<string, NormalizedStatus> = {
  draft: "pending",
  ready: "pending",
  billed: "processing",
  paid: "processing",
  completed: "completed",
  canceled: "failed",
  past_due: "processing",
};

/** Webhook event types — the actual signal the webhook route acts on. */
const EVENT_STATUS_MAP: Record<string, NormalizedStatus> = {
  [EventName.TransactionCompleted]: "completed",
  [EventName.TransactionPaid]: "processing",
  [EventName.TransactionPaymentFailed]: "failed",
  [EventName.TransactionCanceled]: "failed",
  [EventName.TransactionPastDue]: "processing",
  [EventName.TransactionReady]: "pending",
  [EventName.TransactionCreated]: "pending",
  [EventName.TransactionUpdated]: "processing",
  [EventName.TransactionBilled]: "processing",
  [EventName.TransactionRevised]: "processing",
};

let client: Paddle | null = null;

function getClient(): Paddle {
  if (!client) {
    const apiKey = process.env.PADDLE_API_KEY;
    if (!apiKey) {
      throw new PaymentError("Paddle is not configured.");
    }
    const environment =
      process.env.PADDLE_ENVIRONMENT === "production"
        ? Environment.production
        : Environment.sandbox;
    client = new Paddle(apiKey, { environment });
  }
  return client;
}

/**
 * Card checkout via Paddle Billing. Uses a non-catalog (ad-hoc) price on
 * every transaction — config/pricing.ts stays the one source of truth for
 * price and credits, so there is no separate Paddle catalog to keep in sync.
 * Hosted checkout (transaction.checkout.url) is used, not the client-side
 * overlay widget, so no Paddle.js or client token is needed anywhere.
 */
export class PaddleProvider implements PaymentProvider {
  readonly name = "paddle";

  isConfigured(): boolean {
    return Boolean(process.env.PADDLE_API_KEY && process.env.PADDLE_WEBHOOK_SECRET);
  }

  async supportedCurrencies(): Promise<SupportedCurrency[]> {
    // Paddle handles the buyer's local card currency itself — there is no
    // user-facing settlement-currency choice the way crypto has one.
    return this.isConfigured() ? [{ code: "USD", label: "Card (USD)" }] : [];
  }

  async createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
    if (!this.isConfigured()) {
      throw new PaymentError("Paddle is not configured.");
    }

    try {
      const currencyCode = params.currency as CurrencyCode;
      const transaction = await getClient().transactions.create({
        status: "ready",
        collectionMode: "automatic",
        currencyCode,
        customData: { orderId: params.orderId },
        items: [
          {
            quantity: 1,
            price: {
              description: params.description,
              unitPrice: {
                // Paddle takes amounts as a string in the currency's smallest unit.
                amount: String(Math.round(params.amount * 100)),
                currencyCode,
              },
              product: {
                name: params.description,
                taxCategory: "saas",
              },
            },
          },
        ],
      });

      return {
        providerPaymentId: transaction.id,
        checkoutUrl: transaction.checkout?.url ?? null,
      };
    } catch (err) {
      if (err instanceof ApiError) {
        throw new PaymentError(err.detail || "Paddle rejected the request.", err);
      }
      throw new PaymentError("Could not start a Paddle checkout.", err);
    }
  }

  async getPaymentStatus(providerPaymentId: string): Promise<PaymentStatusResult> {
    try {
      const transaction = await getClient().transactions.get(providerPaymentId);
      return {
        providerPaymentId,
        status: TRANSACTION_STATUS_MAP[transaction.status] ?? "pending",
      };
    } catch {
      return { providerPaymentId, status: "pending" };
    }
  }

  async verifyWebhook(
    rawBody: string,
    headers: Headers,
  ): Promise<WebhookVerification | null> {
    const secret = process.env.PADDLE_WEBHOOK_SECRET;
    const signature = headers.get("paddle-signature");
    if (!secret || !signature) return null;

    try {
      const event = await getClient().webhooks.unmarshal(rawBody, secret, signature);
      const data = event.data as { id?: string; customData?: Record<string, unknown> | null };
      const orderId = data.customData?.orderId;

      return {
        valid: true,
        eventId: event.eventId,
        eventType: event.eventType,
        orderId: typeof orderId === "string" ? orderId : null,
        providerPaymentId: typeof data.id === "string" ? data.id : null,
        status: EVENT_STATUS_MAP[event.eventType] ?? "processing",
        payload: event,
      };
    } catch {
      // unmarshal() throws on an invalid signature — same "reject, don't
      // crash" contract every other provider's verifyWebhook follows.
      return null;
    }
  }
}
