import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Coins,
  Layers,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { SoftBackdrop, OrbitRing } from "@/components/marketing/backdrop";
import { Reveal } from "@/components/reveal";
import { AnimatedStat } from "@/components/animated-stat";
import { Section, SectionHeading } from "@/components/marketing/section";
import { ToolCard } from "@/components/marketing/tool-card";
import { CategoryCard } from "@/components/marketing/category-card";
import { FaqList } from "@/components/marketing/faq";
import { FooterCta } from "@/components/marketing/cta";
import { ToolIcon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { categories, categoryColors } from "@/config/categories";
import { toPublicTool } from "@/config/tools";
import { pricingPlans } from "@/config/pricing";
import { siteConfig } from "@/config/site";
import { listTools, listFeaturedTools } from "@/lib/tools/registry";
import { getSessionUser } from "@/lib/auth/guards";
import { formatNumber } from "@/lib/utils";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({ path: "/" });

const HOME_FAQ = [
  {
    question: "Do I need a monthly subscription?",
    answer:
      "No. Oply is a one-time purchase — you buy a pack of credits and spend them whenever you want. There is no recurring charge and no plan to cancel.",
  },
  {
    question: "What is a credit?",
    answer:
      "A credit is the unit each tool costs to run. A rewrite is 5 credits, a long-form article is 20. Your balance is shared across every tool in your account.",
  },
  {
    question: "Do credits expire?",
    answer: "No. Credits stay on your account until you use them.",
  },
  {
    question: "What happens if a generation fails?",
    answer:
      "The credits are returned to your balance automatically. You are only charged for results you actually receive.",
  },
  {
    question: "How do I pay?",
    answer:
      "Pay by card through Paddle or in crypto — whichever you prefer at checkout. Credits are added once the payment provider confirms the transaction.",
  },
  {
    question: "Will more tools be added?",
    answer:
      "Yes. Oply is built around a tool registry so new tools ship regularly, and every tool you buy credits for today keeps working. See the roadmap for what is planned.",
  },
];

export default async function HomePage() {
  const [user, allTools, featured] = await Promise.all([
    getSessionUser(),
    listTools(),
    listFeaturedTools(6),
  ]);

  const publicTools = allTools.map(toPublicTool);
  const startingPrice = Math.min(...pricingPlans.map((p) => p.price));
  const bestValue = pricingPlans.find((p) => p.highlight) ?? pricingPlans[2];

  const activeCategories = categories
    .filter(
      (category) =>
        category.enabled && allTools.some((t) => t.category === category.slug),
    )
    .map((category) => ({
      category,
      count: allTools.filter((t) => t.category === category.slug).length,
    }));

  return (
    <>
      <Hero
        signedIn={Boolean(user)}
        tools={publicTools}
        startingPrice={startingPrice}
      />

      {/* ------------------------------------------------------- Stat band */}
      <section className="border-b border-border bg-surface">
        <div className="container py-8">
          <Reveal>
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border lg:grid-cols-4">
              <Stat value={allTools.length} label="AI tools, one account" hue={258} />
              <Stat
                value={startingPrice}
                prefix="$"
                label="Starting one-time price"
                hue={288}
              />
              <Stat
                value={bestValue.credits}
                label={`Credits in the ${bestValue.name} pack`}
                hue={322}
              />
              <Stat
                value={siteConfig.signupBonusCredits}
                label="Free credits when you sign up"
                hue={194}
              />
            </dl>
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------------- Featured tools */}
      <Section className="relative isolate overflow-hidden">
        <SoftBackdrop />
        <div className="container relative">
          <Reveal>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <SectionHeading
                align="left"
                eyebrow="Most used"
                title="Start with these"
                description="The tools people reach for most on Oply."
                className="max-w-lg"
              />
              <Button asChild variant="outline" className="self-start bg-card/70 backdrop-blur sm:self-end">
                <Link href="/tools">
                  All {allTools.length} tools
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((tool) => (
                <ToolCard key={tool.slug} tool={toPublicTool(tool)} />
              ))}
            </div>
          </Reveal>
        </div>
      </Section>

      {/* --------------------------------------------------------- Categories */}
      <Section className="relative isolate overflow-hidden border-t border-border bg-surface">
        <SoftBackdrop dots />
        <div className="container relative">
          <Reveal>
            <SectionHeading
              eyebrow="Browse"
              title="Everything you need, colour-coded"
              description="Every tool runs from the same account and the same credit balance. Pick the shelf you are working on."
            />
          </Reveal>

          <Reveal delay={0.1}>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeCategories.map(({ category, count }) => (
                <CategoryCard
                  key={category.slug}
                  category={category}
                  toolCount={count}
                />
              ))}
            </div>
          </Reveal>

          {/* Every tool, one tap away — and one crawlable link away. */}
          <div className="mt-12">
            <h3 className="text-center text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
              All {allTools.length} tools
            </h3>
            <ul className="mt-5 flex flex-wrap justify-center gap-2.5">
              {publicTools.map((tool) => {
                const c = categoryColors(tool.category);
                return (
                  <li key={tool.slug}>
                    <Link
                      href={`/tools/${tool.slug}`}
                      style={
                        {
                          "--tile": c.tile,
                          "--edge": c.edge,
                        } as React.CSSProperties
                      }
                      className="flex items-center gap-2 rounded-full border border-border bg-card py-1.5 pl-1.5 pr-4 text-[13px] font-medium shadow-sm transition-colors hover:[border-color:var(--edge)]"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full text-white [background-image:var(--tile)]">
                        <ToolIcon name={tool.icon} className="h-3 w-3" />
                      </span>
                      {tool.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </Section>

      <Reveal>
        <HowItWorks />
      </Reveal>

      {/* ------------------------------------------------------ Credit model */}
      <Section className="relative isolate overflow-hidden border-t border-border bg-surface">
        <SoftBackdrop />
        <div className="container relative">
          <Reveal>
            <SectionHeading
              eyebrow="Credits"
              title="Buy once. Spend across every tool."
              description="Every tool uses a small number of credits, drawn from one shared balance."
            />
          </Reveal>

          <Reveal delay={0.1} className="mt-12 grid items-start gap-6 lg:grid-cols-[1.05fr_1fr]">
            {/* The graphic: a credit balance with the real per-tool costs. */}
            <div className="border-gradient relative isolate overflow-hidden rounded-3xl bg-card p-7 shadow-brand">
              <OrbitRing className="-right-24 -top-24 h-64 w-64" />
              <div className="relative flex items-center justify-between gap-4">
                <div>
                  <p className="text-[13px] font-medium text-muted-foreground">
                    Example balance
                  </p>
                  <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums">
                    {formatNumber(bestValue.credits)}
                    <span className="ml-2 text-base font-medium text-muted-foreground">
                      credits
                    </span>
                  </p>
                </div>
                <span className="bg-brand-panel flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-brand">
                  <Coins className="h-5 w-5" aria-hidden="true" />
                </span>
              </div>

              <div
                className="bg-brand-panel relative mt-6 h-2 rounded-full"
                aria-hidden="true"
              />

              <ul className="relative mt-6 space-y-2.5">
                {allTools.slice(0, 6).map((tool) => {
                  const c = categoryColors(tool.category);
                  return (
                    <li
                      key={tool.slug}
                      style={{ "--tile": c.tile } as React.CSSProperties}
                      className="flex items-center gap-3 text-sm"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white [background-image:var(--tile)]">
                        <ToolIcon name={tool.icon} className="h-3.5 w-3.5" />
                      </span>
                      <span className="flex-1 truncate text-muted-foreground">
                        {tool.name}
                      </span>
                      <span className="shrink-0 font-semibold tabular-nums">
                        {tool.creditCost}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <p className="relative mt-6 border-t border-border pt-4 text-[13px] text-muted-foreground">
                The {bestValue.name} pack is {formatNumber(bestValue.credits)}{" "}
                credits for ${bestValue.price}, one time.
              </p>
            </div>

            <div className="grid gap-4">
              <ValueProp
                icon={Coins}
                hue={258}
                title="One balance"
                body="Credits work in every tool. Nothing is locked to a specific feature or plan."
              />
              <ValueProp
                icon={Layers}
                hue={322}
                title="New tools included"
                body="Tools added after your purchase run on the same credits you already own."
              />
              <ValueProp
                icon={ShieldCheck}
                hue={194}
                title="Only pay for results"
                body="If a generation fails, the credits go straight back to your balance."
              />
              <ValueProp
                icon={BadgeCheck}
                hue={158}
                title="No subscription"
                body="There is nothing to cancel. Buy another pack when, and only when, you want one."
              />
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ----------------------------------------------------- Pricing preview */}
      <Section className="relative isolate overflow-hidden border-t border-border">
        <SoftBackdrop />
        <div className="container relative">
          <Reveal>
            <SectionHeading
              eyebrow="Pricing"
              title="Simple, one-time pricing"
              description="Pick a pack, pay once, and spend the credits whenever you need them."
            />
          </Reveal>
          <Reveal delay={0.1} className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {pricingPlans.map((plan) => {
              const highlighted = Boolean(plan.highlight);
              return (
                <Link
                  key={plan.id}
                  href="/pricing"
                  className={
                    highlighted
                      ? "bg-brand-panel group relative overflow-hidden rounded-2xl p-6 text-white shadow-brand-lg transition-transform hover:-translate-y-1"
                      : "group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-brand/40 hover:shadow-brand"
                  }
                >
                  {highlighted && (
                    <span
                      className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/25 blur-2xl"
                      aria-hidden="true"
                    />
                  )}
                  <p
                    className={
                      highlighted
                        ? "relative flex items-center gap-1.5 text-[13px] font-semibold text-white"
                        : "relative text-[13px] font-medium text-muted-foreground"
                    }
                  >
                    {highlighted && (
                      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    {plan.name}
                  </p>
                  <p className="relative mt-3 text-3xl font-semibold tracking-tight tabular-nums">
                    ${plan.price}
                  </p>
                  <p
                    className={
                      highlighted
                        ? "relative mt-1 text-sm text-white/85"
                        : "relative mt-1 text-sm text-primary"
                    }
                  >
                    {formatNumber(plan.credits)} credits
                  </p>
                  {plan.badge && (
                    <p className="relative mt-4 inline-flex rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold">
                      {plan.badge}
                    </p>
                  )}
                </Link>
              );
            })}
          </Reveal>
          <div className="mt-10 text-center">
            <Button asChild size="lg" className="shadow-brand">
              <Link href="/pricing">
                Compare packs
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </Section>

      {/* ------------------------------------------------------------- FAQ */}
      <Section className="border-t border-border bg-surface">
        <div className="container">
          <Reveal>
            <SectionHeading eyebrow="FAQ" title="Questions people ask" />
          </Reveal>
          <Reveal delay={0.1} className="mx-auto mt-10 max-w-2xl">
            <FaqList items={HOME_FAQ} />
          </Reveal>
        </div>
      </Section>

      <FooterCta
        title="Start with 50 free credits"
        description="Create an account, try a tool, and buy a credit pack only if it earns its place."
        primary={{ label: "Explore tools", href: "/tools" }}
        secondary={{ label: "See pricing", href: "/pricing" }}
      />
    </>
  );
}

function Stat({
  value,
  prefix,
  label,
  hue,
}: {
  value: number;
  prefix?: string;
  label: string;
  hue: number;
}) {
  return (
    <div
      className="bg-card px-5 py-6 text-center"
      style={{ "--solid": `hsl(${hue} 82% 52%)` } as React.CSSProperties}
    >
      <dt className="sr-only">{label}</dt>
      <dd>
        <AnimatedStat
          value={value}
          prefix={prefix}
          className="block text-3xl font-semibold tracking-tight tabular-nums [color:var(--solid)]"
        />
        <span className="mt-1.5 block text-[13px] leading-snug text-muted-foreground">
          {label}
        </span>
      </dd>
    </div>
  );
}

function ValueProp({
  icon: Icon,
  title,
  body,
  hue,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  hue: number;
}) {
  return (
    <div
      className="flex gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:[border-color:var(--edge)]"
      style={
        {
          "--tile": `linear-gradient(135deg, hsl(${hue} 88% 60%), hsl(${hue + 34} 86% 56%))`,
          "--edge": `hsl(${hue} 80% 58% / 0.45)`,
        } as React.CSSProperties
      }
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm [background-image:var(--tile)]">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <h3 className="text-[15px] font-semibold">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {body}
        </p>
      </div>
    </div>
  );
}
