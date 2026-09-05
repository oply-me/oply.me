import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronRight, Coins } from "lucide-react";
import { ToolIcon } from "@/components/icon";
import { JsonLd } from "@/components/json-ld";
import { FaqList } from "@/components/marketing/faq";
import { FooterCta } from "@/components/marketing/cta";
import { Section, SectionHeading } from "@/components/marketing/section";
import { ToolCard } from "@/components/marketing/tool-card";
import { ToolWorkspace } from "@/components/tools/tool-workspace";
import { Badge } from "@/components/ui/badge";
import { getCategory } from "@/config/categories";
import { getEnabledTools, isNewTool, toPublicTool } from "@/config/tools";
import { findTool, getRelatedTools } from "@/lib/tools/registry";
import { getSessionUser } from "@/lib/auth/guards";
import { getCreditSummary } from "@/lib/credits";
import { buildMetadata } from "@/lib/seo/metadata";
import {
  breadcrumbJsonLd,
  faqJsonLd,
  softwareApplicationJsonLd,
} from "@/lib/seo/jsonld";

/** Pre-renders every tool page at build time. */
export function generateStaticParams() {
  return getEnabledTools().map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = await findTool(slug);
  if (!tool) return buildMetadata({ title: "Tool not found", noIndex: true });

  return buildMetadata({
    title: tool.seoTitle,
    description: tool.seoDescription,
    path: `/tools/${tool.slug}`,
  });
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = await findTool(slug);
  if (!tool) notFound();

  const [user, related] = await Promise.all([
    getSessionUser(),
    getRelatedTools(tool, 3),
  ]);

  const balance = user ? (await getCreditSummary(user.id)).balance : null;
  const category = getCategory(tool.category);

  return (
    <>
      <JsonLd
        data={[
          softwareApplicationJsonLd(tool),
          breadcrumbJsonLd([
            { name: "AI Tools", path: "/tools" },
            { name: tool.name, path: `/tools/${tool.slug}` },
          ]),
          faqJsonLd(tool.faq),
        ]}
      />

      {/* ------------------------------------------------------------ Hero */}
      <section className="border-b border-border bg-surface">
        <div className="container py-10 sm:py-14">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1 text-[13px] text-muted-foreground">
              <li>
                <Link href="/tools" className="transition-colors hover:text-foreground">
                  AI Tools
                </Link>
              </li>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              <li aria-current="page" className="font-medium text-foreground">
                {tool.name}
              </li>
            </ol>
          </nav>

          <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ToolIcon name={tool.icon} className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[1.75rem] font-semibold tracking-[-0.028em] sm:text-[2.125rem]">
                  {tool.name}
                </h1>
                {isNewTool(tool) && <Badge>New</Badge>}
              </div>
              <p className="text-pretty mt-2 max-w-2xl text-[17px] leading-relaxed text-muted-foreground">
                {tool.tagline}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Badge variant="outline">
                  <Coins className="h-3 w-3" />
                  {tool.creditCost} credits per generation
                </Badge>
                {category && (
                  <Link href={`/categories/${category.slug}`}>
                    <Badge variant="secondary">{category.name}</Badge>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- Workspace */}
      <section className="container py-10 sm:py-12">
        <ToolWorkspace
          tool={toPublicTool(tool)}
          signedIn={Boolean(user)}
          initialBalance={balance}
        />
        {!user && (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Create a free account
            </Link>{" "}
            to run this tool. New accounts start with 50 credits.
          </p>
        )}
      </section>

      {/* -------------------------------------------------------- Benefits */}
      <Section className="border-t border-border">
        <div className="container">
          <SectionHeading align="left" title={`Why use the ${tool.name}`} />
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {tool.benefits.map((benefit) => (
              <div key={benefit.title}>
                <h3 className="text-[15px] font-semibold">{benefit.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {benefit.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ----------------------------------------------------- How it works */}
      <Section className="border-t border-border bg-surface">
        <div className="container">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <SectionHeading align="left" title="How it works" />
              <ol className="mt-6 space-y-4">
                {tool.howItWorks.map((step, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold tabular-nums text-primary">
                      {i + 1}
                    </span>
                    <span className="text-[15px] leading-relaxed text-muted-foreground">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {tool.example.label}
              </p>
              <p className="mt-3 text-[15px] leading-relaxed">
                “{tool.example.value}”
              </p>
              <p className="mt-6 border-t border-border pt-4 text-sm text-muted-foreground">
                {tool.description}
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* ------------------------------------------------------------- FAQ */}
      <Section className="border-t border-border">
        <div className="container">
          <SectionHeading align="left" title="Frequently asked questions" />
          <div className="mt-6 max-w-2xl">
            <FaqList items={tool.faq} />
          </div>
        </div>
      </Section>

      {/* --------------------------------------------------- Related tools */}
      {related.length > 0 && (
        <Section className="border-t border-border bg-surface">
          <div className="container">
            <SectionHeading
              align="left"
              title="Related tools"
              description="Other Oply tools people use alongside this one."
            />
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <ToolCard key={item.slug} tool={toPublicTool(item)} />
              ))}
            </div>
          </div>
        </Section>
      )}

      <FooterCta
        title={`Start using the ${tool.name}`}
        description="Buy credits once and use them across every Oply tool."
        primary={{ label: "Get Credits", href: "/pricing" }}
        secondary={{ label: "Browse all tools", href: "/tools" }}
      />
    </>
  );
}
