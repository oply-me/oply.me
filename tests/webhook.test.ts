import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NowPaymentsProvider } from "@/lib/payments/providers/nowpayments";
import { DevPaymentProvider } from "@/lib/payments/providers/dev";

const SECRET = "test-ipn-secret";

/** Mirrors the provider's own signing: sorted keys, then HMAC-SHA512. */
function sign(payload: Record<string, unknown>): string {
  const sorted = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(sorted);
    if (value && typeof value === "object") {
      return Object.keys(value as Record<string, unknown>)
        .sort()
        .reduce<Record<string, unknown>>((acc, key) => {
          acc[key] = sorted((value as Record<string, unknown>)[key]);
          return acc;
        }, {});
    }
    return value;
  };
  return createHmac("sha512", SECRET)
    .update(JSON.stringify(sorted(payload)))
    .digest("hex");
}

const validPayload = {
  payment_id: "4455667788",
  payment_status: "finished",
  order_id: "0f8fad5b-d9cb-469f-a165-70867728950e",
  price_amount: 49,
  price_currency: "usd",
};

describe("crypto webhook verification", () => {
  let provider: NowPaymentsProvider;

  beforeEach(() => {
    process.env.CRYPTO_PAYMENT_API_KEY = "test-key";
    process.env.CRYPTO_PAYMENT_WEBHOOK_SECRET = SECRET;
    provider = new NowPaymentsProvider();
  });

  afterEach(() => {
    delete process.env.CRYPTO_PAYMENT_API_KEY;
    delete process.env.CRYPTO_PAYMENT_WEBHOOK_SECRET;
  });

  it("accepts a correctly signed payload", async () => {
    const raw = JSON.stringify(validPayload);
    const result = await provider.verifyWebhook(
      raw,
      new Headers({ "x-nowpayments-sig": sign(validPayload) }),
    );

    expect(result).not.toBeNull();
    expect(result!.valid).toBe(true);
    expect(result!.status).toBe("completed");
    expect(result!.orderId).toBe(validPayload.order_id);
    expect(result!.providerPaymentId).toBe("4455667788");
  });

  it("verifies regardless of key order in the body", async () => {
    // The provider signs sorted keys, so a reordered body must still verify.
    const reordered = JSON.stringify({
      price_currency: "usd",
      order_id: validPayload.order_id,
      payment_status: "finished",
      price_amount: 49,
      payment_id: "4455667788",
    });

    const result = await provider.verifyWebhook(
      reordered,
      new Headers({ "x-nowpayments-sig": sign(validPayload) }),
    );
    expect(result?.valid).toBe(true);
  });

  it("rejects a tampered amount", async () => {
    const tampered = { ...validPayload, price_amount: 0.01 };
    const result = await provider.verifyWebhook(
      JSON.stringify(tampered),
      new Headers({ "x-nowpayments-sig": sign(validPayload) }),
    );
    expect(result).toBeNull();
  });

  it("rejects a payload that swaps the order id", async () => {
    const attacker = {
      ...validPayload,
      order_id: "11111111-1111-1111-1111-111111111111",
    };
    const result = await provider.verifyWebhook(
      JSON.stringify(attacker),
      new Headers({ "x-nowpayments-sig": sign(validPayload) }),
    );
    expect(result).toBeNull();
  });

  it("rejects a request with no signature header", async () => {
    const result = await provider.verifyWebhook(
      JSON.stringify(validPayload),
      new Headers(),
    );
    expect(result).toBeNull();
  });

  it("rejects a signature of the wrong length without throwing", async () => {
    const result = await provider.verifyWebhook(
      JSON.stringify(validPayload),
      new Headers({ "x-nowpayments-sig": "abc123" }),
    );
    expect(result).toBeNull();
  });

  it("rejects a body that is not JSON", async () => {
    const result = await provider.verifyWebhook(
      "not json",
      new Headers({ "x-nowpayments-sig": sign(validPayload) }),
    );
    expect(result).toBeNull();
  });

  it("derives an idempotency key from payment id and status", async () => {
    const result = await provider.verifyWebhook(
      JSON.stringify(validPayload),
      new Headers({ "x-nowpayments-sig": sign(validPayload) }),
    );
    // The webhook route stores this under a UNIQUE constraint, so replaying
    // the identical event cannot credit the account twice.
    expect(result!.eventId).toBe("4455667788:finished");
  });

  it("maps provider states onto our order lifecycle", async () => {
    const cases: [string, string][] = [
      ["waiting", "pending"],
      ["confirming", "processing"],
      ["sending", "processing"],
      ["partially_paid", "processing"],
      ["finished", "completed"],
      ["failed", "failed"],
      ["expired", "expired"],
      ["refunded", "refunded"],
      ["something_new", "pending"],
    ];

    for (const [providerStatus, expected] of cases) {
      const payload = { ...validPayload, payment_status: providerStatus };
      const result = await provider.verifyWebhook(
        JSON.stringify(payload),
        new Headers({ "x-nowpayments-sig": sign(payload) }),
      );
      expect(result?.status, providerStatus).toBe(expected);
    }
  });
});

describe("development payment simulator", () => {
  afterEach(() => {
    delete process.env.DEV_PAYMENT_MODE;
    delete process.env.CRYPTO_PAYMENT_WEBHOOK_SECRET;
  });

  it("refuses to verify anything when dev mode is off", async () => {
    process.env.DEV_PAYMENT_MODE = "false";
    const dev = new DevPaymentProvider();
    const payload = JSON.stringify({ payment_id: "1", order_id: "2" });
    const result = await dev.verifyWebhook(
      payload,
      new Headers({ "x-dev-payment-sig": dev.sign(payload) }),
    );
    expect(result).toBeNull();
  });

  it("still requires a valid signature when dev mode is on", async () => {
    process.env.DEV_PAYMENT_MODE = "true";
    process.env.CRYPTO_PAYMENT_WEBHOOK_SECRET = SECRET;
    const dev = new DevPaymentProvider();
    const payload = JSON.stringify({
      payment_id: "dev_1",
      order_id: "2",
      payment_status: "finished",
    });

    expect(
      await dev.verifyWebhook(payload, new Headers({ "x-dev-payment-sig": "bogus" })),
    ).toBeNull();

    const ok = await dev.verifyWebhook(
      payload,
      new Headers({ "x-dev-payment-sig": dev.sign(payload) }),
    );
    expect(ok?.valid).toBe(true);
    expect(ok?.status).toBe("completed");
  });
});
