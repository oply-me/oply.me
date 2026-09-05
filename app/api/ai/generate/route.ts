import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth/guards";
import { resolveToolForGeneration } from "@/lib/tools/registry";
import {
  InsufficientCreditsError,
  refundCredits,
  reserveCredits,
} from "@/lib/credits";
import { getAIProvider } from "@/lib/ai/client";
import { AIProviderError } from "@/lib/ai/providers/types";
import { getOutputSchema } from "@/lib/ai/schemas";
import {
  buildInputPreview,
  buildRefinePrompt,
  buildSystemPrompt,
  buildUserPrompt,
} from "@/lib/ai/prompts";
import { checkInput } from "@/lib/ai/moderation";
import { recordUsage } from "@/lib/ai/usage";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/security/rate-limit";
import {
  MAX_REQUEST_BYTES,
  buildToolInputSchema,
  generateRequestSchema,
  normalizeToolInput,
} from "@/lib/security/validation";
import { trackServer } from "@/lib/analytics";

export const runtime = "nodejs";
/** Long-form generations can take a while; never cache the response. */
export const maxDuration = 120;
export const dynamic = "force-dynamic";

function fail(message: string, status: number, code?: string) {
  return NextResponse.json({ error: message, code }, { status });
}

export async function POST(request: Request) {
  // 1. Reject oversized bodies before spending anything parsing them.
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_REQUEST_BYTES) {
    return fail("That request is too large.", 413, "payload_too_large");
  }

  // 2. Authenticate. Anonymous users never reach the AI provider.
  const user = await getApiUser();
  if (!user) {
    return fail("Please sign in to use Oply tools.", 401, "unauthenticated");
  }

  // 3. Rate limit per user.
  const limit = await rateLimit("generate", user.id);
  if (!limit.success) {
    return NextResponse.json(
      {
        error: "You're generating a little too fast. Try again in a moment.",
        code: "rate_limited",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((limit.reset - Date.now()) / 1000)),
        },
      },
    );
  }

  // 4. Validate the request envelope.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("Invalid request.", 400, "invalid_body");
  }

  const parsed = generateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return fail("Invalid request.", 400, "invalid_body");
  }

  const { toolSlug, input, action = "generate", previousOutput, projectId } = parsed.data;

  // 5. Resolve the tool server-side. Credit cost comes from here and nowhere
  //    else — a cost sent by the client is never read.
  const resolved = await resolveToolForGeneration(toolSlug);
  if (!resolved) {
    return fail("That tool doesn't exist.", 404, "tool_not_found");
  }
  if (!resolved.enabled) {
    return fail("That tool is currently unavailable.", 403, "tool_disabled");
  }

  const { tool, creditCost, systemPromptOverride } = resolved;

  // 6. Validate the input against the tool's own field definitions.
  const normalized = normalizeToolInput(tool, input);
  const inputValidation = buildToolInputSchema(tool).safeParse(normalized);
  if (!inputValidation.success) {
    return fail(
      inputValidation.error.issues[0]?.message ?? "Please check your input.",
      400,
      "invalid_input",
    );
  }

  const moderation = checkInput(normalized, tool.maxInputChars);
  if (!moderation.ok) {
    return fail(moderation.reason!, 400, "invalid_input");
  }

  if (action !== "generate" && !previousOutput) {
    return fail("There is no previous result to work from.", 400, "no_previous_output");
  }

  // 7. Reserve credits atomically, before the AI call.
  let balanceAfter: number;
  try {
    balanceAfter = await reserveCredits({
      userId: user.id,
      amount: creditCost,
      description: `${tool.name}${action === "generate" ? "" : ` (${action})`}`,
      referenceType: "generation",
    });
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      return fail(
        "Not enough credits for this tool.",
        402,
        "insufficient_credits",
      );
    }
    console.error("[ai/generate] credit reservation failed", {
      userId: user.id,
      toolSlug,
      error: err instanceof Error ? err.message : String(err),
    });
    return fail("Something went wrong. Please try again.", 500, "credit_error");
  }

  // 8. Call the AI provider. Anything that fails from here on refunds.
  const startedAt = Date.now();
  const provider = getAIProvider();
  const schema = tool.outputSchema ? getOutputSchema(tool.outputSchema) : undefined;

  try {
    const prompt =
      action === "generate"
        ? buildUserPrompt(tool, normalized)
        : buildRefinePrompt(tool, normalized, previousOutput!, action);

    const result = await provider.generate({
      system: buildSystemPrompt(tool, systemPromptOverride),
      prompt,
      schema,
      maxTokens: tool.component === "long-form" ? 8000 : 4000,
      effort: tool.creditCost >= 15 ? "high" : "medium",
    });

    const db = createAdminClient();

    // 9. Persist the generation. Written with the service role because users
    //    have no INSERT policy on this table — history cannot be fabricated.
    const { data: generation, error: insertError } = await db
      .from("ai_generations")
      .insert({
        user_id: user.id,
        tool_slug: tool.slug,
        tool_name: tool.name,
        project_id: projectId ?? null,
        input: normalized,
        input_preview: buildInputPreview(tool, normalized),
        output_text: result.text,
        output_json: (result.json as never) ?? null,
        credits_used: creditCost,
        model: result.model,
        provider: result.provider,
        status: "completed",
        duration_ms: Date.now() - startedAt,
      })
      .select("id")
      .single();

    if (insertError) {
      // The user got their result, so we do not refund — but this must be
      // visible in the logs because their history will be missing a row.
      console.error("[ai/generate] failed to persist generation", {
        userId: user.id,
        toolSlug,
        error: insertError.message,
      });
    }

    await recordUsage({
      userId: user.id,
      generationId: generation?.id ?? null,
      toolSlug: tool.slug,
      provider: result.provider,
      model: result.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      creditsCharged: creditCost,
      success: true,
    });

    trackServer("generation_completed", {
      toolSlug: tool.slug,
      credits: creditCost,
    });

    return NextResponse.json({
      generationId: generation?.id ?? null,
      text: result.text,
      json: result.json,
      creditsUsed: creditCost,
      balance: balanceAfter,
    });
  } catch (err) {
    // 10. Generation failed after credits were taken — give them back.
    const refunded = await refundCredits({
      userId: user.id,
      amount: creditCost,
      description: `Refund — ${tool.name} generation failed`,
      referenceType: "generation",
    });

    const message =
      err instanceof AIProviderError
        ? err.message
        : "We couldn't generate your result.";

    console.error("[ai/generate] generation failed", {
      userId: user.id,
      toolSlug,
      refunded: refunded !== null,
      error: err instanceof Error ? err.message : String(err),
    });

    await recordUsage({
      userId: user.id,
      generationId: null,
      toolSlug: tool.slug,
      provider: provider.name,
      model: "unknown",
      inputTokens: null,
      outputTokens: null,
      creditsCharged: 0,
      success: false,
    });

    trackServer("generation_failed", { toolSlug: tool.slug });

    return NextResponse.json(
      {
        error: `${message} Your credits were not charged.`,
        code: "generation_failed",
        balance: refunded,
      },
      { status: 502 },
    );
  }
}
