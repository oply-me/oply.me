import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { estimateCost } from "./models";

export interface UsageRecord {
  userId: string;
  generationId: string | null;
  toolSlug: string;
  provider: string;
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
  creditsCharged: number;
  success: boolean;
}

/**
 * Records what a generation cost us. Best-effort — analytics must never break
 * a user's request, so failures are logged and swallowed.
 */
export async function recordUsage(record: UsageRecord): Promise<void> {
  try {
    const db = createAdminClient();
    await db.from("ai_usage").insert({
      user_id: record.userId,
      generation_id: record.generationId,
      tool_slug: record.toolSlug,
      provider: record.provider,
      model: record.model,
      input_tokens: record.inputTokens,
      output_tokens: record.outputTokens,
      estimated_cost_usd: estimateCost(
        record.model,
        record.inputTokens,
        record.outputTokens,
      ),
      credits_charged: record.creditsCharged,
      success: record.success,
    });
  } catch (err) {
    console.error("[ai/usage] failed to record usage", {
      toolSlug: record.toolSlug,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
