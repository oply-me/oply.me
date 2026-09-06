import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { FaqList } from "@/components/marketing/faq";
import { FooterCta } from "@/components/marketing/cta";
import { Section, SectionHeading } from "@/components/marketing/section";
import { ToolCard } from "@/components/marketing/tool-card";
import { categories, getCategory } from "@/config/categories";
import { getActiveCategorySlugs, toPublicTool } from "@/config/tools";
import { listTools, listToolsByCategory } from "@/lib/tools/registry";
import { buildMetadata } from "@/lib/seo/metadata";
import {
  breadcrumbJsonLd,
  collectionPageJsonLd,
  faqJsonLd,
} from "@/lib/seo/jsonld";

export function generateStaticParams() {
  return getActiveCategorySlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) return buildMetadata({ title: "Not found", noIndex: true });

  return buildMetadata({
    title: `${category.name} AI Tools`,
    description: category.seoDescription,
    path: `/categories/${slug}`,
    keywords: [category.primaryKeyword, ...category.keywords],
    // Colocated opengraph-image.tsx wins here — see buildMetadata.
    defaultOgImage: false,
  });
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category || !category.enabled) notFound();

  const tools = await listToolsByCategory(slug);
  if (tools.length === 0) notFound();

  const allTools = await listTools();
  const otherCategories = categories.filter(
    (c) =>
      c.slug !== slug && c.enabled && allTools.some((t) => t.category === c.slug),
  );

  const faq = [
    {
      question: `How much do ${category.name} tools cost to run?`,
      answer: `Each tool has its own credit cost — ${tools
        .map((t) => `${t.name} is ${t.creditCost}`)
        .join(", ")}. Credits are bought once and shared across your whole account.`,
    },
    {
      question: `Do I need a separate plan for ${category.name} tools?`,
      answer:
        "No. One credit balance covers every category on Oply, including tools added later.",
    },
    {
      question: "Can I save what I generate?",
      answer:
        "Yes. Every generation is kept in your history, and you can favorite results or file them under a project.",
    },
  ];

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Categories", path: "/categories" },
            { name: category.name, path: `/categories/${slug}` },
          ]),
          faqJsonLd(faq),
          collectionPageJsonLd(category, tools),
        ]}
      />

      <section className="border-b border-border bg-surface">
        <div className="container py-10 sm:py-14">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-1 text-[13px] text-muted-foreground">
              <li>
                <Link href="/categories" className="hover:text-foreground">
                  Categories
                </Link>
              </li>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              <li aria-current="page" className="font-medium text-foreground">
                {category.name}
              </li>
            </ol>
          </nav>

          <h1 className="mt-6 text-[1.75rem] font-semibold tracking-[-0.028em] sm:text-[2.125rem]">
            {category.name} AI tools
          </h1>
          <p className="text-pretty mt-2 max-w-2xl text-[17px] leading-relaxed text-muted-foreground">
            {category.description}
          </p>
        </div>
      </section>

      <Section>
        <div className="container">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool) => (
              <ToolCard key={tool.slug} tool={toPublicTool(tool)} />
            ))}
          </div>
        </div>
      </Section>

      {otherCategories.length > 0 && (
        <Section className="border-t border-border bg-surface">
          <div className="container">
            <SectionHeading align="left" title="Other categories" />
            <div className="mt-6 flex flex-wrap gap-2">
              {otherCategories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/categories/${c.slug}`}
                  className="rounded-full border border-border bg-background px-4 py-2 text-[13px] font-medium transition-colors hover:bg-accent"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        </Section>
      )}

      <Section className="border-t border-border">
        <div className="container">
          <SectionHeading align="left" title="Frequently asked questions" />
          <div className="mt-6 max-w-2xl">
            <FaqList items={faq} />
          </div>
        </div>
      </Section>

      <FooterCta
        title={`Ready to try Oply's ${category.name} tools?`}
        description="One-time payment, credits shared across everything."
        primary={{ label: "Get Credits", href: "/pricing" }}
        secondary={{ label: "All tools", href: "/tools" }}
      />
    </>
  );
}
