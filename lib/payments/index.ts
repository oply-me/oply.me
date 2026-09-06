import "server-only";

import { NowPaymentsProvider } from "./providers/nowpayments";
import { PaddleProvider } from "./providers/paddle";
import { DevPaymentProvider, isDevPaymentModeEnabled } from "./providers/dev";
import type { PaymentProvider } from "./types";

export * from "./types";
export { isDevPaymentModeEnabled };

/**
 * Two independent checkout methods, each with its own real provider plus the
 * shared dev simulator override. Unlike the single-provider factory this
 * replaces, a customer picks one of these at checkout — see
 * components/marketing/pricing-table.tsx — so both must be resolvable at
 * once, not just whichever one happens to be "configured."
 */
const registry: Record<string, () => PaymentProvider> = {
  nowpayments: () => new NowPaymentsProvider(),
  paddle: () => new PaddleProvider(),
  dev: () => new DevPaymentProvider(),
};

const cache = new Map<string, PaymentProvider>();

function resolve(name: string): PaymentProvider {
  const cached = cache.get(name);
  if (cached) return cached;
  const factory = registry[name];
  if (!factory) {
    throw new Error(
      `Unknown payment provider "${name}". Supported: ${Object.keys(registry).join(", ")}`,
    );
  }
  const instance = factory();
  cache.set(name, instance);
  return instance;
}

/** The crypto checkout method — NOWPayments, or the dev simulator when enabled. */
export function getCryptoProvider(): PaymentProvider {
  return isDevPaymentModeEnabled() ? resolve("dev") : resolve("nowpayments");
}

/** The card checkout method — Paddle, or the dev simulator when enabled. */
export function getCardProvider(): PaymentProvider {
  return isDevPaymentModeEnabled() ? resolve("dev") : resolve("paddle");
}

/**
 * Resolves the exact provider an existing order was created with, by its
 * stored `payment_provider` name — for polling an order's status, never for
 * creating a new checkout (use getCryptoProvider/getCardProvider for that,
 * so the dev-mode override is applied consistently at creation time).
 */
export function getProviderByName(name: string): PaymentProvider {
  return resolve(name);
}

export function isCryptoConfigured(): boolean {
  try {
    return getCryptoProvider().isConfigured();
  } catch {
    return false;
  }
}

export function isCardConfigured(): boolean {
  try {
    return getCardProvider().isConfigured();
  } catch {
    return false;
  }
}
