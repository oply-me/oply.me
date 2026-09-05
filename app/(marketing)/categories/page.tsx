import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ToolIcon } from "@/components/icon";
import { Section, SectionHeading } from "@/components/marketing/section";
import { FooterCta } from "@/components/marketing/cta";
import { categories } from "@/config/categories";
import { listTools } from "@/lib/tools/registry";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: "Tool Categories",
  description:
    "Browse Oply's AI tools by category — AI, SEO, Business and E-commerce. Every category runs on the same account and credit balance.",
  path: "/categories",
  keywords: categories.filter((c) => c.enabled).map((c) => c.primaryKeyword),
});

export default async function CategoriesPage() {
  const tools = await listTools();
  const active = categories.filter(
    (c) => c.enabled && tools.some((t) => t.category === c.slug),
  );

  return (
    <>
      <Section>
        <div className="container">
          <SectionHeading
            align="left"
            title="Categories"
            description="Only categories with live tools are listed. More open up as new tools ship."
          />

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {active.map((category) => {
              const count = tools.filter((t) => t.category === category.slug).length;
              return (
                <Link
                  key={category.slug}
                  href={`/categories/${category.slug}`}
                  className="group rounded-xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <ToolIcon name={category.icon} />
                  </div>
                  <h2 className="mt-4 text-[15px] font-semibold">{category.name}</h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {category.description}
                  </p>
                  <p className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-primary">
                    {count} {count === 1 ? "tool" : "tools"}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </Section>

      <FooterCta />
    </>
  );
}
