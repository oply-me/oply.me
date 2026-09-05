import Link from "next/link";
import { ArrowRight, Coins, Layers, ShieldCheck } from "lucide-react";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Section, SectionHeading } from "@/components/marketing/section";
import { ToolCard } from "@/components/marketing/tool-card";
import { FaqList } from "@/components/marketing/faq";
import { FooterCta } from "@/components/marketing/cta";
import { Button } from "@/components/ui/button";
import { categories } from "@/config/categories";
import { toPublicTool } from "@/config/tools";
import { pricingPlans } from "@/config/pricing";
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
    answer:
      "No. Credits stay on your account until you use them.",
  },
  {
    question: "What happens if a generation fails?",
    answer:
      "The credits are returned to your balance automatically. You are only charged for results you actually receive.",
  },
  {
    question: "How do I pay?",
    answer:
      "Checkout is handled by a crypto payment provider, with the settlement currencies that provider supports. Credits are added once the payment is confirmed on-chain.",
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

  const activeCategories = categories.filter(
    (category) =>
      category.enabled && allTools.some((t) => t.category === category.slug),
  );

  return (
    <>
      <Hero signedIn={Boolean(user)} />

      {/* Featured tools */}
      <Section>
        <div className="container">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              align="left"
              title="Start with these"
              description="The tools people reach for most on Oply."
              className="max-w-lg"
            />
            <Button asChild variant="ghost" size="sm" className="self-start sm:self-end">
              <Link href="/tools">
                All {allTools.length} tools
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((tool) => (
              <ToolCard key={tool.slug} tool={toPublicTool(tool)} />
            ))}
          </div>
        </div>
      </Section>

      {/* Category discovery */}
      <Section className="border-t border-border bg-surface">
        <div className="container">
          <SectionHeading
            title="Everything you need, in one place."
            description="Browse by what you are working on. Every tool runs from the same account and the same credit balance."
          />

          <div className="mt-12 space-y-14">
            {activeCategories.map((category) => {
              const categoryTools = allTools.filter(
                (t) => t.category === category.slug,
              );
              return (
                <div key={category.slug}>
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold tracking-tight">
                        {category.name}
                      </h3>
                      <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                        {category.description}
                      </p>
                    </div>
                    <Link
                      href={`/categories/${category.slug}`}
                      className="shrink-0 text-[13px] font-medium text-primary hover:underline"
                    >
                      View all
                    </Link>
                  </div>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {categoryTools.map((tool) => (
                      <ToolCard key={tool.slug} tool={toPublicTool(tool)} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      <HowItWorks />

      {/* Credit model */}
      <Section className="border-t border-border bg-surface">
        <div className="container">
          <SectionHeading
            eyebrow="Credits"
            title="Buy credits once. Use them across Oply."
            description="Every tool uses a small number of credits. Your balance is shared across your entire Oply account."
          />

          <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-3">
            <ValueProp
              icon={Coins}
              title="One balance"
              body="Credits work in every tool. Nothing is locked to a specific feature or plan."
            />
            <ValueProp
              icon={Layers}
              title="New tools included"
              body="Tools added after your purchase run on the same credits you already own."
            />
            <ValueProp
              icon={ShieldCheck}
              title="Only pay for results"
              body="If a generation fails, the credits go straight back to your balance."
            />
          </div>

          <div className="mx-auto mt-12 max-w-2xl rounded-xl border border-border bg-card p-6">
            <h3 className="text-[15px] font-semibold">What credits get you</h3>
            <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {allTools.slice(0, 6).map((tool) => (
                <li
                  key={tool.slug}
                  className="flex items-center justify-between gap-4 text-sm"
                >
                  <span className="text-muted-foreground">{tool.name}</span>
                  <span className="shrink-0 font-medium tabular-nums">
                    {tool.creditCost} credits
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-5 border-t border-border pt-4 text-[13px] text-muted-foreground">
              The {pricingPlans[2].name} pack is{" "}
              {formatNumber(pricingPlans[2].credits)} credits for $
              {pricingPlans[2].price}, one time.
            </p>
          </div>
        </div>
      </Section>

      {/* Pricing preview */}
      <Section className="border-t border-border">
        <div className="container">
          <SectionHeading
            title="Simple, one-time pricing"
            description="Pick a pack, pay once, and spend the credits whenever you need them."
          />
          <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {pricingPlans.map((plan) => (
              <Link
                key={plan.id}
                href="/pricing"
                className="group rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <p className="text-[13px] font-medium text-muted-foreground">
                  {plan.name}
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
                  ${plan.price}
                </p>
                <p className="mt-1 text-sm text-primary">
                  {formatNumber(plan.credits)} credits
                </p>
              </Link>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button asChild size="lg">
              <Link href="/pricing">
                Compare packs
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </Section>

      {/* FAQ */}
      <Section className="border-t border-border bg-surface">
        <div className="container">
          <SectionHeading title="Questions people ask" />
          <div className="mx-auto mt-10 max-w-2xl">
            <FaqList items={HOME_FAQ} />
          </div>
        </div>
      </Section>

      <FooterCta
        secondary={{ label: "See pricing", href: "/pricing" }}
      />
    </>
  );
}

function ValueProp({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <h3 className="mt-4 text-[15px] font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
