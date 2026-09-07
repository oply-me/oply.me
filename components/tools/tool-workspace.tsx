"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bookmark,
  Coins,
  Expand,
  Loader2,
  RotateCw,
  Shrink,
  Sparkles,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { CopyButton } from "@/components/copy-button";
import { DownloadButton } from "@/components/tools/download-button";
import { FieldRenderer } from "@/components/tools/field-renderer";
import { GenerationProgress } from "@/components/tools/generation-progress";
import { ImageResultView } from "@/components/tools/image-result-view";
import { ResultReveal } from "@/components/tools/result-reveal";
import { ToolExampleToggle } from "@/components/tools/tool-example-toggle";
import {
  OutlineOutput,
  ProductOutput,
  PromptOptimizerOutputView,
  ReplyOutputView,
  SchemaOutput,
  SeoOutput,
  TextOutput,
} from "@/components/tools/output-renderers";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { isFieldVisible, type PublicTool } from "@/config/tools";
import { track } from "@/lib/analytics";
import { cn, formatNumber } from "@/lib/utils";
import type {
  BlogOutlineOutput,
  ProductDescriptionOutput,
  PromptOptimizerOutput,
  ReplyOutput,
  SeoMetaOutput,
} from "@/lib/ai/schemas";

type RefineAction = "shorten" | "expand" | "improve";

interface GenerationResult {
  generationId: string;
  text?: string;
  json?: unknown | null;
  image?: { url: string; width: number; height: number; mimeType: string };
  creditsUsed: number;
  balance: number;
}

interface ErrorState {
  message: string;
  code?: string;
}

export function ToolWorkspace({
  tool,
  signedIn,
  initialBalance,
  initialInput,
}: {
  tool: PublicTool;
  signedIn: boolean;
  initialBalance: number | null;
  initialInput?: Record<string, string>;
}) {
  const router = useRouter();

  const [input, setInput] = useState<Record<string, string>>(() => {
    const seed: Record<string, string> = {};
    for (const field of tool.fields) {
      seed[field.name] = initialInput?.[field.name] ?? field.defaultValue ?? "";
    }
    return seed;
  });

  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<ErrorState | null>(null);
  const [balance, setBalance] = useState<number | null>(initialBalance);
  const [saved, setSaved] = useState(false);

  const missingRequired = useMemo(
    () =>
      tool.fields.some(
        (f) =>
          f.required &&
          isFieldVisible(f, input) &&
          !String(input[f.name] ?? "").trim(),
      ),
    [tool.fields, input],
  );

  const notEnoughCredits =
    signedIn && balance !== null && balance < tool.creditCost;

  function setField(name: string, value: string) {
    setInput((prev) => ({ ...prev, [name]: value }));
  }

  async function run(action: "generate" | RefineAction = "generate") {
    if (!signedIn) {
      router.push(
        `/signup?next=${encodeURIComponent(`/tools/${tool.slug}`)}`,
      );
      return;
    }

    // Guards against double submission from a fast second click.
    if (loading) return;

    setLoading(true);
    setPendingAction(action);
    setError(null);
    setSaved(false);
    track("generation_started", { toolSlug: tool.slug, category: tool.category });

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolSlug: tool.slug,
          input,
          action,
          // Refinements operate on the result currently on screen.
          previousOutput:
            action === "generate" ? undefined : (result?.text ?? undefined),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError({ message: data.error ?? "Something went wrong. Please try again.", code: data.code });
        track("generation_failed", { toolSlug: tool.slug, reason: data.code });
        return;
      }

      setResult(data);
      setBalance(data.balance);
      track("generation_completed", {
        toolSlug: tool.slug,
        credits: data.creditsUsed,
      });
      // Keeps the sidebar credit badge honest without a full reload.
      router.refresh();
    } catch {
      setError({ message: "Something went wrong. Please try again." });
      track("generation_failed", { toolSlug: tool.slug, reason: "network" });
    } finally {
      setLoading(false);
      setPendingAction(null);
    }
  }

  async function save() {
    if (!result) return;
    try {
      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generationId: result.generationId }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        toast.error(data.error ?? "Could not save this result.");
        return;
      }
      setSaved(true);
      toast.success("Saved to favorites");
    } catch {
      toast.error("Could not save this result.");
    }
  }

  const copyValue = result
    ? result.text || JSON.stringify(result.json, null, 2)
    : "";

  const progressStages =
    tool.outputType === "image"
      ? ["Understanding your brief", "Generating the image", "Finishing"]
      : tool.component === "long-form"
        ? ["Understanding topic", "Drafting", "Polishing"]
        : ["Understanding your input", "Generating", "Finishing"];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      {/* ---------------------------------------------------------- Input */}
      <div className="rounded-feature border border-border bg-card shadow-card">
        <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-5">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em]">Input</h2>
          <Badge variant="outline">
            <Coins className="h-3 w-3" />
            {tool.creditCost} credits
          </Badge>
        </div>

        <div className="space-y-5 p-6">
          {tool.fields
            .filter((field) => isFieldVisible(field, input))
            .map((field) => (
              <FieldRenderer
                key={field.name}
                field={field}
                value={input[field.name] ?? ""}
                onChange={(value) => setField(field.name, value)}
                disabled={loading}
              />
            ))}
        </div>

        <div className="border-t border-border p-6">
          {notEnoughCredits ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Not enough credits for this tool. You have{" "}
                {formatNumber(balance ?? 0)}, and this run costs{" "}
                {tool.creditCost}.
              </p>
              <Button asChild className="w-full" size="lg">
                <Link href="/pricing">Buy Credits</Link>
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => run("generate")}
              disabled={loading || missingRequired}
              className="w-full bg-gradient-to-r from-brand to-brand-2 shadow-brand transition-shadow hover:shadow-brand-lg"
              size="lg"
            >
              {loading && pendingAction === "generate" ? (
                <>
                  <Loader2 className="animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles />
                  {signedIn ? "Generate" : "Sign up to generate"}
                </>
              )}
            </Button>
          )}

          {signedIn && balance !== null && !notEnoughCredits && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Balance: {formatNumber(balance)} credits
            </p>
          )}
        </div>
      </div>

      {/* --------------------------------------------------------- Output */}
      <div className="rounded-feature border border-border bg-card shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-5">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em]">Result</h2>
          {result && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Used {result.creditsUsed} credits
              </span>
              {result.image ? (
                <DownloadButton url={result.image.url} filename={`${tool.slug}.png`} />
              ) : (
                <CopyButton value={copyValue} size="sm" />
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={save}
                disabled={saved}
                aria-label="Save result to favorites"
              >
                <Bookmark className={cn(saved && "fill-current")} />
                {saved ? "Saved" : "Save"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => run("generate")}
                disabled={loading}
              >
                <RotateCw className={cn(loading && "animate-spin")} />
                Regenerate
              </Button>
            </div>
          )}
        </div>

        <div className="min-h-[340px] p-6">
          {loading ? (
            <div className="flex h-full min-h-[260px] flex-col items-center justify-center gap-6 px-6">
              <GenerationProgress active={loading} stages={progressStages} className="max-w-sm" />
            </div>
          ) : error ? (
            <ErrorPanel error={error} onRetry={() => run("generate")} />
          ) : result ? (
            <ResultReveal resultKey={result.generationId}>
              <ResultView tool={tool} result={result} input={input} />
            </ResultReveal>
          ) : (
            <IdleState tool={tool} />
          )}
        </div>

        {/* Refinement actions, where the tool declares them */}
        {result && !loading && tool.extraActions?.length ? (
          <div className="flex flex-wrap gap-2 border-t border-border px-6 py-4">
            {tool.extraActions.includes("shorten") && (
              <Button size="sm" variant="secondary" onClick={() => run("shorten")}>
                <Shrink />
                Shorten
              </Button>
            )}
            {tool.extraActions.includes("expand") && (
              <Button size="sm" variant="secondary" onClick={() => run("expand")}>
                <Expand />
                Expand
              </Button>
            )}
            {tool.extraActions.includes("improve") && (
              <Button size="sm" variant="secondary" onClick={() => run("improve")}>
                <Wand2 />
                Improve
              </Button>
            )}
            <span className="self-center text-xs text-muted-foreground">
              Each costs {tool.creditCost} credits
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ResultView({
  tool,
  result,
  input,
}: {
  tool: PublicTool;
  result: GenerationResult;
  input: Record<string, string>;
}) {
  if (result.image) {
    return <ImageResultView image={result.image} />;
  }

  // Structured tools render their own layout; everything else is prose.
  if (result.json) {
    switch (tool.slug) {
      case "seo-meta-generator":
        return <SeoOutput data={result.json as SeoMetaOutput} />;
      case "product-description-generator":
        return <ProductOutput data={result.json as ProductDescriptionOutput} />;
      case "blog-outline-generator":
        return <OutlineOutput data={result.json as BlogOutlineOutput} />;
      case "prompt-optimizer":
        return (
          <PromptOptimizerOutputView
            data={result.json as PromptOptimizerOutput}
            original={input.prompt ?? ""}
          />
        );
      case "reply-generator":
        return <ReplyOutputView data={result.json as ReplyOutput} />;
      default:
        return (
          <pre className="scroll-area overflow-auto rounded-lg bg-muted/40 p-4 font-mono text-[12.5px]">
            {JSON.stringify(result.json, null, 2)}
          </pre>
        );
    }
  }

  if (tool.component === "schema-generator" || tool.outputType === "json") {
    return <SchemaOutput text={result.text ?? ""} />;
  }

  return <TextOutput text={result.text ?? ""} />;
}

function IdleState({ tool }: { tool: PublicTool }) {
  return (
    <div className="flex h-full min-h-[260px] flex-col items-center justify-center text-center">
      <Image
        src="/illustrations/empty-result.webp"
        alt=""
        width={128}
        height={128}
        /* Decorative: the heading below carries the meaning. */
        aria-hidden="true"
        className="h-32 w-32 object-contain"
      />
      <p className="mt-2 text-[15px] font-medium">Your result appears here</p>
      <ToolExampleToggle tool={tool} />
    </div>
  );
}

function ErrorPanel({
  error,
  onRetry,
}: {
  error: ErrorState;
  onRetry: () => void;
}) {
  const insufficient = error.code === "insufficient_credits";

  return (
    <div className="flex h-full min-h-[260px] flex-col items-center justify-center text-center">
      <p className="text-[15px] font-medium">
        {insufficient ? "Not enough credits" : "That didn't work"}
      </p>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        {error.message}
      </p>
      <div className="mt-6">
        {insufficient ? (
          <Button asChild>
            <Link href="/pricing">Buy Credits</Link>
          </Button>
        ) : (
          <Button variant="outline" onClick={onRetry}>
            <RotateCw />
            Try again
          </Button>
        )}
      </div>
    </div>
  );
}
