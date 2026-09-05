"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Coins, Loader2, Sparkles } from "lucide-react";
import { ToolIcon } from "@/components/icon";
import { ToolWorkspace } from "@/components/tools/tool-workspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { PublicTool } from "@/config/tools";
import { formatNumber } from "@/lib/utils";

interface RouteResult {
  toolSlug: string;
  toolName: string;
  creditCost: number;
  confidence: "high" | "medium" | "low";
  clarification: string | null;
  prefill: Record<string, string>;
}

export function AskOply({
  tools,
  balance,
}: {
  tools: PublicTool[];
  balance: number;
}) {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";

  const [request, setRequest] = useState(initialQuery);
  const [routing, setRouting] = useState(false);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const autoRan = useRef(false);

  const classify = async (text: string) => {
    const value = text.trim();
    if (value.length < 3) {
      setError("Tell Oply a little more about what you need.");
      return;
    }

    setRouting(true);
    setError(null);
    setRoute(null);
    setConfirmed(false);

    try {
      const response = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request: value }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Couldn't work that out.");
        return;
      }
      setRoute(data);
    } catch {
      setError("Couldn't work that out. Please try again.");
    } finally {
      setRouting(false);
    }
  };

  // A request arriving from the homepage box routes itself once.
  useEffect(() => {
    if (initialQuery && !autoRan.current) {
      autoRan.current = true;
      void classify(initialQuery);
    }
    // classify is stable for this purpose; only the initial query matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  const tool = route ? tools.find((t) => t.slug === route.toolSlug) : null;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-5">
        <label htmlFor="ask-request" className="text-[13px] font-medium">
          What do you want to do?
        </label>
        <Textarea
          id="ask-request"
          value={request}
          onChange={(e) => setRequest(e.target.value)}
          rows={3}
          maxLength={4000}
          placeholder="Write a professional reply to a client asking whether the site will be ready Friday."
          className="mt-2 min-h-[96px]"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              void classify(request);
            }
          }}
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Routing is free — you only spend credits when you run the tool.
          </p>
          <Button onClick={() => classify(request)} disabled={routing}>
            {routing ? (
              <>
                <Loader2 className="animate-spin" />
                Thinking…
              </>
            ) : (
              <>
                <Sparkles />
                Ask Oply
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <p
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}

      {route && tool && !confirmed && (
        <div className="rounded-xl border border-primary/30 bg-primary/[0.04] p-5">
          <div className="flex flex-wrap items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
              <ToolIcon name={tool.icon} className="h-5 w-5" />
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Detected task
              </p>
              <p className="mt-1 text-lg font-semibold">{route.toolName}</p>

              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <Badge variant="outline">
                  <Coins className="h-3 w-3" />
                  Estimated cost: {route.creditCost} credits
                </Badge>
                {route.confidence !== "high" && (
                  <Badge variant="warning">
                    {route.confidence === "medium" ? "Best guess" : "Low confidence"}
                  </Badge>
                )}
              </div>

              {route.clarification && (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {route.clarification}
                </p>
              )}

              {balance < route.creditCost && (
                <p className="mt-3 text-sm text-warning">
                  You have {formatNumber(balance)} credits — this tool needs{" "}
                  {route.creditCost}.
                </p>
              )}
            </div>

            <Button onClick={() => setConfirmed(true)} className="shrink-0">
              Continue
              <ArrowRight />
            </Button>
          </div>
        </div>
      )}

      {route && tool && confirmed && (
        <div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-[13px] text-muted-foreground">
              Using <span className="font-medium text-foreground">{tool.name}</span>{" "}
              — check the details below before generating.
            </p>
            <Button variant="ghost" size="sm" onClick={() => setConfirmed(false)}>
              Choose again
            </Button>
          </div>
          <ToolWorkspace
            tool={tool}
            signedIn
            initialBalance={balance}
            initialInput={route.prefill}
          />
        </div>
      )}
    </div>
  );
}
