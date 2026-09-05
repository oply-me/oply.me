import Link from "next/link";
import { ArrowRight, Coins, Sparkles, TrendingUp } from "lucide-react";
import { AskBox } from "@/components/marketing/ask-box";
import { ToolCard } from "@/components/marketing/tool-card";
import { ToolIcon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { toPublicTool, type ToolDefinition } from "@/config/tools";
import { siteConfig } from "@/config/site";
import { requireUser } from "@/lib/auth/guards";
import { getCreditSummary, getMonthlyUsage } from "@/lib/credits";
import { listTools } from "@/lib/tools/registry";
import { createClient } from "@/lib/supabase/server";
import { cn, formatNumber, greeting, timeAgo } from "@/lib/utils";

/** Onboarding answer → the tools we surface first. */
const RECOMMENDATIONS: Record<string, string[]> = {
  seo: ["seo-meta-generator", "schema-generator", "blog-outline-generator"],
  writing: ["ai-writer", "ai-rewriter", "ai-summarizer"],
  business: ["reply-generator", "ai-writer", "blog-outline-generator"],
  marketing: ["ai-writer", "seo-meta-generator", "product-description-generator"],
  ecommerce: ["product-description-generator", "seo-meta-generator", "ai-writer"],
  prompts: ["prompt-optimizer", "prompt-generator", "ai-writer"],
  exploring: ["ai-writer", "seo-meta-generator", "reply-generator"],
};

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");
  const supabase = await createClient();

  const [credits, monthlyUsage, tools, recentResult, usageResult, favToolsResult] =
    await Promise.all([
      getCreditSummary(user.id),
      getMonthlyUsage(user.id),
      listTools(),
      supabase
        .from("ai_generations")
        .select("id, tool_slug, tool_name, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("ai_generations")
        .select("tool_slug")
        .eq("user_id", user.id)
        .gte(
          "created_at",
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        ),
      supabase.from("favorite_tools").select("tool_slug").eq("user_id", user.id),
    ]);

  const toolBySlug = new Map(tools.map((t) => [t.slug, t]));

  // Most recent use per tool, in order.
  const recentTools: { tool: ToolDefinition; at: string }[] = [];
  const seen = new Set<string>();
  for (const row of recentResult.data ?? []) {
    if (seen.has(row.tool_slug)) continue;
    const tool = toolBySlug.get(row.tool_slug);
    if (!tool) continue;
    seen.add(row.tool_slug);
    recentTools.push({ tool, at: row.created_at });
    if (recentTools.length === 4) break;
  }

  // Usage counts for the last seven days.
  const counts = new Map<string, number>();
  for (const row of usageResult.data ?? []) {
    counts.set(row.tool_slug, (counts.get(row.tool_slug) ?? 0) + 1);
  }
  const topTools = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([slug, count]) => ({ tool: toolBySlug.get(slug), count }))
    .filter((r): r is { tool: ToolDefinition; count: number } => Boolean(r.tool));

  const favoriteSlugs = new Set(
    (favToolsResult.data ?? []).map((r) => r.tool_slug),
  );
  const favoriteTools = tools.filter((t) => favoriteSlugs.has(t.slug));

  const useCase = user.profile?.primary_use_case ?? "exploring";
  const recommendedSlugs = RECOMMENDATIONS[useCase] ?? RECOMMENDATIONS.exploring;
  const recommended = recommendedSlugs
    .map((slug) => toolBySlug.get(slug))
    .filter((t): t is ToolDefinition => Boolean(t));

  const firstName = user.profile?.full_name?.split(" ")[0] ?? null;
  const low = credits.balance <= siteConfig.lowCreditThreshold;

  return (
    <div className="mx-auto max-w-6xl">
      {/* Greeting + command bar */}
      <div className="mb-8">
        <h1 className="text-[1.75rem] font-semibold tracking-[-0.025em]">
          {greeting()}
          {firstName ? `, ${firstName}` : ""}.
        </h1>
        <p className="mt-1.5 text-[15px] text-muted-foreground">
          What would you like to create?
        </p>
        <div className="mt-5 max-w-2xl">
          <AskBox signedIn />
        </div>
      </div>

      {/* Stats */}
      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        <div
          className={cn(
            "rounded-xl border bg-card p-5",
            low ? "border-warning/40" : "border-border",
          )}
        >
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-muted-foreground">Credit balance</p>
            <Coins
              className={cn(
                "h-4 w-4",
                low ? "text-warning" : "text-muted-foreground",
              )}
              aria-hidden="true"
            />
          </div>
          <p
            className={cn(
              "mt-2 text-2xl font-semibold tabular-nums",
              low && "text-warning",
            )}
          >
            {formatNumber(credits.balance)}
          </p>
          <Button asChild size="sm" variant={low ? "default" : "outline"} className="mt-4">
            <Link href="/pricing">Buy Credits</Link>
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-muted-foreground">Used this month</p>
            <TrendingUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums">
            {formatNumber(monthlyUsage)}
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            credits across all tools
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-muted-foreground">Most used this week</p>
            <Sparkles className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </div>
          {topTools.length > 0 ? (
            <ul className="mt-2.5 space-y-1.5">
              {topTools.map(({ tool, count }) => (
                <li
                  key={tool.slug}
                  className="flex items-center justify-between gap-3 text-[13px]"
                >
                  <Link
                    href={`/tools/${tool.slug}`}
                    className="truncate hover:text-primary"
                  >
                    {tool.name}
                  </Link>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {count} {count === 1 ? "use" : "uses"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-[13px] text-muted-foreground">
              Nothing yet this week.
            </p>
          )}
        </div>
      </div>

      {/* Recently used */}
      {recentTools.length > 0 && (
        <Section title="Recently used" href="/dashboard/history" linkLabel="View history">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {recentTools.map(({ tool, at }) => (
              <Link
                key={tool.slug}
                href={`/tools/${tool.slug}`}
                className="group flex items-center gap-3 rounded-lg border border-border bg-card p-3.5 transition-colors hover:border-primary/40"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ToolIcon name={tool.icon} className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium">
                    {tool.name}
                  </span>
                  <span className="block text-[11px] text-muted-foreground">
                    {timeAgo(at)}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {/* Recommended */}
      <Section
        title={
          user.profile?.primary_use_case
            ? "Recommended for you"
            : "Popular tools"
        }
        href="/dashboard/tools"
        linkLabel="All tools"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recommended.map((tool) => (
            <ToolCard key={tool.slug} tool={toPublicTool(tool)} />
          ))}
        </div>
      </Section>

      {/* Favorite tools */}
      {favoriteTools.length > 0 && (
        <Section title="Your favorites" href="/dashboard/favorites" linkLabel="Saved results">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favoriteTools.slice(0, 3).map((tool) => (
              <ToolCard key={tool.slug} tool={toPublicTool(tool)} />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  href,
  linkLabel,
  children,
}: {
  title: string;
  href: string;
  linkLabel: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-[15px] font-semibold">{title}</h2>
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {linkLabel}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      {children}
    </section>
  );
}
