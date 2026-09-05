/**
 * Privacy-conscious product analytics.
 *
 * Events carry identifiers and counts only — never prompt text, generated
 * output, or anything a user typed. Without ANALYTICS_KEY configured this is
 * a no-op, so nothing is collected by default.
 */
export type AnalyticsEvent =
  | "tool_viewed"
  | "tool_started"
  | "generation_started"
  | "generation_completed"
  | "generation_failed"
  | "credit_purchase_started"
  | "payment_completed"
  | "tool_favorited"
  | "signup_completed";

export interface AnalyticsProperties {
  [key: string]: unknown;
  toolSlug?: string;
  category?: string;
  credits?: number;
  planId?: string;
  amount?: number;
  reason?: string;
}

export function track(
  event: AnalyticsEvent,
  properties: AnalyticsProperties = {},
): void {
  if (typeof window === "undefined") return;
  if (!process.env.NEXT_PUBLIC_ANALYTICS_ENABLED) return;

  const w = window as unknown as {
    plausible?: (e: string, o?: { props: Record<string, unknown> }) => void;
  };
  w.plausible?.(event, { props: properties });
}

/** Server-side counterpart. Logs structurally; no user content included. */
export function trackServer(
  event: AnalyticsEvent,
  properties: AnalyticsProperties = {},
): void {
  if (!process.env.ANALYTICS_KEY) return;
  console.log(JSON.stringify({ type: "analytics", event, ...properties }));
}
