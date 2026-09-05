import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiUser } from "@/lib/auth/guards";
import { listTools } from "@/lib/tools/registry";
import { getAIProvider } from "@/lib/ai/client";
import { rateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  request: z.string().min(3).max(4000),
});

const routeSchema = z.object({
  tool_slug: z.string(),
  confidence: z.enum(["high", "medium", "low"]),
  /** Field name → suggested value, drawn only from what the user wrote. */
  prefill: z.record(z.string(), z.string()),
  /** Present only when the request is too vague to route confidently. */
  clarification: z.string(),
});

/**
 * Classifies a free-text request and picks the tool that fits.
 *
 * Routing itself does not consume credits — the user still runs the chosen
 * tool through /api/ai/generate, where credits are validated and deducted.
 * The classification call is small and shares the generation rate limit, so
 * it cannot be used as free unlimited AI.
 */
export async function POST(request: Request) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  const limit = await rateLimit("generate", user.id);
  if (!limit.success) {
    return NextResponse.json(
      { error: "Too many requests. Try again in a moment." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Describe what you'd like to do in a sentence." },
      { status: 400 },
    );
  }

  const tools = await listTools();

  const catalogue = tools
    .map((tool) => {
      const fields = tool.fields
        .map((f) => {
          const options = f.options
            ? ` (one of: ${f.options.map((o) => o.value).join(", ")})`
            : "";
          return `    - ${f.name}: ${f.label}${f.required ? " [required]" : ""}${options}`;
        })
        .join("\n");
      return `- ${tool.slug}: ${tool.name} — ${tool.description}\n  fields:\n${fields}`;
    })
    .join("\n\n");

  try {
    const result = await getAIProvider().generate({
      system: `You route user requests to the right tool in a small AI toolkit.

Available tools:

${catalogue}

Return JSON with:
- tool_slug: the slug of the single best-fitting tool. It must be one of the slugs listed above.
- confidence: "high" when the request clearly matches one tool, "medium" when it plausibly fits, "low" when you are guessing.
- prefill: an object mapping field names of the chosen tool to values taken from the user's request. Only include a field when the user actually supplied that information — never invent topics, keywords, product names or message content. Select fields must use one of their listed option values.
- clarification: if confidence is "low", one short question that would let you route correctly. Otherwise an empty string.

Pick exactly one tool. Never return a slug that is not in the list.`,
      prompt: parsed.data.request,
      schema: routeSchema,
      maxTokens: 2000,
      effort: "low",
    });

    const routed = result.json as z.infer<typeof routeSchema>;
    const tool = tools.find((t) => t.slug === routed.tool_slug);

    if (!tool) {
      return NextResponse.json(
        { error: "Couldn't match that to a tool. Try browsing the tool library." },
        { status: 422 },
      );
    }

    // Drop any field the model invented that this tool does not have.
    const validFields = new Set(tool.fields.map((f) => f.name));
    const prefill: Record<string, string> = {};
    for (const [key, value] of Object.entries(routed.prefill ?? {})) {
      if (validFields.has(key) && typeof value === "string") {
        prefill[key] = value.slice(0, tool.maxInputChars);
      }
    }

    return NextResponse.json({
      toolSlug: tool.slug,
      toolName: tool.name,
      creditCost: tool.creditCost,
      confidence: routed.confidence,
      clarification: routed.clarification || null,
      prefill,
    });
  } catch (err) {
    console.error("[ai/ask] routing failed", {
      userId: user.id,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: "Couldn't work that out. Try picking a tool directly." },
      { status: 502 },
    );
  }
}
