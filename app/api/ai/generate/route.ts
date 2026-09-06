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
import { getImageProvider } from "@/lib/ai/image-client";
import { ImageProviderError } from "@/lib/ai/providers/image-types";
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
import {
  downloadObject,
  newGenerationId,
  uploadGeneratedImage,
} from "@/lib/supabase/storage";
import { fitToExactDimensions } from "@/lib/images/resize";
import { rateLimit } from "@/lib/security/rate-limit";
import {
  MAX_REQUEST_BYTES,
  buildToolInputSchema,
  generateRequestSchema,
  isOwnedUploadPath,
  normalizeToolInput,
} from "@/lib/security/validation";
import { trackServer } from "@/lib/analytics";
import type { ImageDimensions, ToolDefinition } from "@/config/tools";

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

  // 6b. An "image" field's value is a Storage path the browser uploaded
  // before this request — Storage RLS already stops a user from uploading
  // under someone else's folder, but this stops them from simply typing
  // another user's existing path into the request body.
  for (const field of tool.fields) {
    if (field.type !== "image") continue;
    const value = normalized[field.name];
    if (value && !isOwnedUploadPath(value, user.id)) {
      return fail("That upload does not belong to you.", 403, "forbidden_path");
    }
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

  // 8. Image tools follow an entirely different pipeline (binary I/O, no
  // schema/refine actions) — handled by a sibling function, reusing the same
  // reserve-then-refund-on-failure contract.
  if (tool.outputType === "image") {
    return runImageGeneration({
      tool,
      creditCost,
      normalized,
      userId: user.id,
      projectId: projectId ?? null,
      balanceAfter,
    });
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

/**
 * The image-tool pipeline: reserve credits (already done by the caller) →
 * fetch any input image → call the image provider → fit to the tool's exact
 * declared pixel size → upload to Storage → persist the ai_generations row →
 * respond. Any failure after credit reservation refunds, exactly like the
 * text path in POST() above.
 */
async function runImageGeneration({
  tool,
  creditCost,
  normalized,
  userId,
  projectId,
  balanceAfter,
}: {
  tool: ToolDefinition;
  creditCost: number;
  normalized: Record<string, string>;
  userId: string;
  projectId: string | null;
  balanceAfter: number;
}) {
  const startedAt = Date.now();
  const provider = getImageProvider();
  const spec = tool.imageOutput;

  async function refundAndFail(message: string) {
    const refunded = await refundCredits({
      userId,
      amount: creditCost,
      description: `Refund — ${tool.name} generation failed`,
      referenceType: "generation",
    });
    return NextResponse.json(
      { error: `${message} Your credits were not charged.`, code: "generation_failed", balance: refunded },
      { status: 502 },
    );
  }

  if (!spec) {
    console.error("[ai/generate] image tool missing imageOutput spec", { toolSlug: tool.slug });
    return refundAndFail("This tool is not configured correctly.");
  }

  const requestedSize: ImageDimensions =
    (spec.sizeField && spec.sizes?.[normalized[spec.sizeField]]) || spec.defaultSize;
  const background =
    (spec.backgroundField && spec.backgroundValues?.[normalized[spec.backgroundField]]) ||
    spec.background;

  try {
    const inputImage = spec.inputImageField
      ? await downloadObject(normalized[spec.inputImageField])
      : undefined;

    const result = await provider.generate({
      prompt: buildUserPrompt(tool, normalized),
      size: requestedSize,
      inputImage,
      background,
    });

    const finalBytes = spec.skipExactFit
      ? result.bytes
      : await fitToExactDimensions(result.bytes, requestedSize);
    const size: ImageDimensions = spec.skipExactFit
      ? { width: result.width, height: result.height }
      : requestedSize;

    const generationId = newGenerationId();
    const { signedUrl, path: storagePath } = await uploadGeneratedImage({
      userId,
      generationId,
      bytes: finalBytes,
      mimeType: result.mimeType,
    });

    const db = createAdminClient();

    // Written with the service role, same as the text path — users have no
    // INSERT policy on this table.
    const { error: insertError } = await db.from("ai_generations").insert({
      id: generationId,
      user_id: userId,
      tool_slug: tool.slug,
      tool_name: tool.name,
      project_id: projectId,
      input: normalized,
      input_preview: buildInputPreview(tool, normalized),
      output_image_url: signedUrl,
      output_image_mime: "image/png",
      output_image_width: size.width,
      output_image_height: size.height,
      output_storage_path: storagePath,
      credits_used: creditCost,
      model: result.model,
      provider: result.provider,
      status: "completed",
      duration_ms: Date.now() - startedAt,
    });

    if (insertError) {
      console.error("[ai/generate] failed to persist image generation", {
        userId,
        toolSlug: tool.slug,
        error: insertError.message,
      });
    }

    await recordUsage({
      userId,
      generationId,
      toolSlug: tool.slug,
      provider: result.provider,
      model: result.model,
      inputTokens: null,
      outputTokens: null,
      creditsCharged: creditCost,
      success: true,
    });

    trackServer("generation_completed", { toolSlug: tool.slug, credits: creditCost });

    return NextResponse.json({
      generationId,
      image: {
        url: signedUrl,
        width: size.width,
        height: size.height,
        mimeType: "image/png",
      },
      creditsUsed: creditCost,
      balance: balanceAfter,
    });
  } catch (err) {
    const message =
      err instanceof ImageProviderError ? err.message : "We couldn't generate your image.";

    console.error("[ai/generate] image generation failed", {
      userId,
      toolSlug: tool.slug,
      error: err instanceof Error ? err.message : String(err),
    });

    await recordUsage({
      userId,
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

    return refundAndFail(message);
  }
}
