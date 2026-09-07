import Link from "next/link";
import { ArrowRight, Coins, Sparkles, TrendingUp } from "lucide-react";
import { AskBox } from "@/components/marketing/ask-box";
import { ToolCard } from "@/components/marketing/tool-card";
import { BentoFeature } from "@/components/marketing/bento-feature";
import { Reveal } from "@/components/reveal";
import { StatCard } from "@/components/dashboard/stat-card";
import { ToolTile } from "@/components/tools/tool-tile";
import { Button } from "@/components/ui/button";
import { toPublicTool, type ToolDefinition } from "@/config/tools";
import { siteConfig } from "@/config/site";
import { requireUser } from "@/lib/auth/guards";
import { getCreditSummary, getMonthlyUsage } from "@/lib/credits";
import { listTools } from "@/lib/tools/registry";
import { createClient } from "@/lib/supabase/server";
import { greeting, timeAgo } from "@/lib/utils";

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
      {/* Greeting + command bar, on a soft branded band. */}
      <div className="relative isolate mb-10 overflow-hidden rounded-feature border border-border bg-card px-6 py-8 shadow-card sm:px-8 sm:py-10">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-brand/15 blur-[70px]"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-brand-2/10 blur-[70px]"
        />

        <div className="relative">
          <h1 className="text-[2rem] font-semibold leading-[1.1] tracking-[-0.03em] sm:text-[2.5rem]">
            {greeting()}
            {firstName ? `, ${firstName}` : ""}.
            <br />
            <span className="text-gradient">What will you make?</span>
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
            Describe the job and Oply picks the tool, or jump straight into one
            below.
          </p>
          <div className="mt-6 max-w-2xl">
            <AskBox signedIn />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Credit balance"
          value={credits.balance}
          icon={Coins}
          emphasis={low ? "warning" : "default"}
          footer={
            <Button asChild size="sm" variant={low ? "default" : "outline"}>
              <Link href="/pricing">Buy Credits</Link>
            </Button>
          }
        />

        <StatCard
          label="Used this month"
          value={monthlyUsage}
          icon={TrendingUp}
          footer={
            <Link
              href="/dashboard/usage"
              className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              See usage over time
            </Link>
          }
        />

        <StatCard label="Most used this week" icon={Sparkles}>
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
        </StatCard>
      </div>

      {/* Recently used */}
      {recentTools.length > 0 && (
        <Section title="Recently used" href="/dashboard/activity" linkLabel="View activity">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {recentTools.map(({ tool, at }, i) => (
              <Reveal key={tool.slug} delay={i * 0.06}>
                <Link
                  href={`/tools/${tool.slug}`}
                  className="group flex items-center gap-3 rounded-lg border border-border bg-card p-3.5 transition-colors hover:border-primary/40"
                >
                  <ToolTile
                    icon={tool.icon}
                    category={tool.category}
                    className="transition-transform duration-300 group-hover:scale-105"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium">
                      {tool.name}
                    </span>
                    <span className="block text-[11px] text-muted-foreground">
                      {timeAgo(at)}
                    </span>
                  </span>
                </Link>
              </Reveal>
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
          {recommended.map((tool, i) => (
            <Reveal key={tool.slug} delay={i * 0.06}>
              <ToolCard tool={toPublicTool(tool)} className="h-full" />
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Feature tile, using the same component as the public tools page. */}
      <BentoFeature
        tools={recommended.map(toPublicTool)}
        href="/dashboard/tools"
        className="mb-10"
      />

      {/* Favorite tools */}
      {favoriteTools.length > 0 && (
        <Section title="Your favorites" href="/dashboard/favorites" linkLabel="Saved results">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favoriteTools.slice(0, 3).map((tool, i) => (
              <Reveal key={tool.slug} delay={i * 0.06}>
                <ToolCard tool={toPublicTool(tool)} className="h-full" />
              </Reveal>
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
