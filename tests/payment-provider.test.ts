import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockCreate = vi.fn();
const mockGet = vi.fn();
const mockUnmarshal = vi.fn();

vi.mock("@paddle/paddle-node-sdk", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@paddle/paddle-node-sdk")>();
  return {
    ...actual,
    Paddle: vi.fn().mockImplementation(() => ({
      transactions: { create: mockCreate, get: mockGet },
      webhooks: { unmarshal: mockUnmarshal },
    })),
  };
});

import { PaddleProvider } from "@/lib/payments/providers/paddle";
import { PaymentError } from "@/lib/payments/types";
import { EventName } from "@paddle/paddle-node-sdk";

const ORIGINAL_ENV = { ...process.env };

describe("PaddleProvider", () => {
  beforeEach(() => {
    process.env.PADDLE_API_KEY = "test-key";
    process.env.PADDLE_WEBHOOK_SECRET = "test-secret";
    mockCreate.mockReset();
    mockGet.mockReset();
    mockUnmarshal.mockReset();
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("reports unconfigured when either env var is missing", () => {
    delete process.env.PADDLE_WEBHOOK_SECRET;
    expect(new PaddleProvider().isConfigured()).toBe(false);
  });

  it("reports configured when both env vars are set", () => {
    expect(new PaddleProvider().isConfigured()).toBe(true);
  });

  it("creates a non-catalog transaction matching the requested amount, in cents", async () => {
    mockCreate.mockResolvedValue({
      id: "txn_01",
      checkout: { url: "https://checkout.paddle.com/txn_01" },
    });

    const provider = new PaddleProvider();
    const result = await provider.createPayment({
      orderId: "order-1",
      amount: 9,
      currency: "USD",
      description: "Oply — Starter (500 credits)",
      successUrl: "https://oply.me/checkout/order-1",
      cancelUrl: "https://oply.me/pricing",
      webhookUrl: "https://oply.me/api/payments/webhook/paddle",
      customerEmail: "buyer@example.com",
    });

    expect(result).toEqual({
      providerPaymentId: "txn_01",
      checkoutUrl: "https://checkout.paddle.com/txn_01",
    });

    expect(mockCreate).toHaveBeenCalledTimes(1);
    const request = mockCreate.mock.calls[0][0];
    expect(request.status).toBe("ready");
    expect(request.collectionMode).toBe("automatic");
    expect(request.customData).toEqual({ orderId: "order-1" });
    expect(request.items).toHaveLength(1);
    expect(request.items[0].quantity).toBe(1);
    // $9.00 -> "900" (smallest currency unit, as Paddle expects).
    expect(request.items[0].price.unitPrice.amount).toBe("900");
    expect(request.items[0].price.unitPrice.currencyCode).toBe("USD");
    expect(request.items[0].price.product.taxCategory).toBe("saas");
  });

  it("has no pre-created catalog price id — every item is priced ad hoc", async () => {
    mockCreate.mockResolvedValue({ id: "txn_01", checkout: { url: null } });
    const provider = new PaddleProvider();
    await provider.createPayment({
      orderId: "order-1",
      amount: 19,
      currency: "USD",
      description: "Oply — Pro (2500 credits)",
      successUrl: "https://oply.me/checkout/order-1",
      cancelUrl: "https://oply.me/pricing",
      webhookUrl: "https://oply.me/api/payments/webhook/paddle",
    });
    const request = mockCreate.mock.calls[0][0];
    expect(request.items[0].priceId).toBeUndefined();
    expect(request.items[0].price).toBeDefined();
  });

  it("wraps a Paddle API rejection as a PaymentError", async () => {
    mockCreate.mockRejectedValue(new Error("network blip"));
    const provider = new PaddleProvider();
    await expect(
      provider.createPayment({
        orderId: "order-1",
        amount: 9,
        currency: "USD",
        description: "x",
        successUrl: "https://oply.me/checkout/order-1",
        cancelUrl: "https://oply.me/pricing",
        webhookUrl: "https://oply.me/api/payments/webhook/paddle",
      }),
    ).rejects.toBeInstanceOf(PaymentError);
  });

  it("maps a completed transaction webhook to our order lifecycle", async () => {
    mockUnmarshal.mockResolvedValue({
      eventId: "evt_01",
      eventType: EventName.TransactionCompleted,
      data: { id: "txn_01", customData: { orderId: "order-1" } },
    });

    const provider = new PaddleProvider();
    const result = await provider.verifyWebhook(
      "{}",
      new Headers({ "paddle-signature": "ts=1;h1=deadbeef" }),
    );

    expect(result).toEqual({
      valid: true,
      eventId: "evt_01",
      eventType: EventName.TransactionCompleted,
      orderId: "order-1",
      providerPaymentId: "txn_01",
      status: "completed",
      payload: {
        eventId: "evt_01",
        eventType: EventName.TransactionCompleted,
        data: { id: "txn_01", customData: { orderId: "order-1" } },
      },
    });
  });

  it("maps a payment-failed event to a failed order status", async () => {
    mockUnmarshal.mockResolvedValue({
      eventId: "evt_02",
      eventType: EventName.TransactionPaymentFailed,
      data: { id: "txn_02", customData: { orderId: "order-2" } },
    });
    const provider = new PaddleProvider();
    const result = await provider.verifyWebhook(
      "{}",
      new Headers({ "paddle-signature": "ts=1;h1=deadbeef" }),
    );
    expect(result?.status).toBe("failed");
  });

  it("rejects when the signature header is missing, without calling the SDK", async () => {
    const provider = new PaddleProvider();
    const result = await provider.verifyWebhook("{}", new Headers());
    expect(result).toBeNull();
    expect(mockUnmarshal).not.toHaveBeenCalled();
  });

  it("rejects when the SDK's signature check throws", async () => {
    mockUnmarshal.mockRejectedValue(new Error("[Paddle] Webhook signature verification failed"));
    const provider = new PaddleProvider();
    const result = await provider.verifyWebhook(
      "{}",
      new Headers({ "paddle-signature": "ts=1;h1=bogus" }),
    );
    expect(result).toBeNull();
  });

  it("maps a transaction's own status when polled directly", async () => {
    mockGet.mockResolvedValue({ status: "completed" });
    const provider = new PaddleProvider();
    const result = await provider.getPaymentStatus("txn_01");
    expect(result.status).toBe("completed");

    mockGet.mockResolvedValue({ status: "draft" });
    expect((await provider.getPaymentStatus("txn_02")).status).toBe("pending");
  });
});

describe("PaddleProvider configuration caching", () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.resetModules();
  });

  it("throws before calling the SDK when the API key is missing", async () => {
    vi.resetModules();
    delete process.env.PADDLE_API_KEY;
    delete process.env.PADDLE_WEBHOOK_SECRET;
    const { PaddleProvider: FreshPaddleProvider } = await import(
      "@/lib/payments/providers/paddle"
    );
    const { PaymentError: FreshPaymentError } = await import("@/lib/payments/types");
    const provider = new FreshPaddleProvider();
    await expect(
      provider.createPayment({
        orderId: "order-1",
        amount: 9,
        currency: "USD",
        description: "x",
        successUrl: "https://oply.me/checkout/order-1",
        cancelUrl: "https://oply.me/pricing",
        webhookUrl: "https://oply.me/api/payments/webhook/paddle",
      }),
    ).rejects.toBeInstanceOf(FreshPaymentError);
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
