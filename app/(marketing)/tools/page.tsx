import { ToolsExplorer } from "@/components/marketing/tools-explorer";
import { FooterCta } from "@/components/marketing/cta";
import { Section, SectionHeading } from "@/components/marketing/section";
import { ToolIcon } from "@/components/icon";
import { Badge } from "@/components/ui/badge";
import { categories } from "@/config/categories";
import { comingSoonTools, toPublicTool } from "@/config/tools";
import { listTools } from "@/lib/tools/registry";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: "All AI Tools",
  description:
    "Browse every Oply AI tool — writing, rewriting, summarizing, SEO metadata, schema, product copy, replies and outlines. One account, one credit balance.",
  path: "/tools",
});

export default async function ToolsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const params = await searchParams;
  const tools = await listTools();

  return (
    <>
      <Section className="pb-10">
        <div className="container">
          <SectionHeading
            align="left"
            title="AI tools"
            description="Every Oply tool runs from the same account and the same credit balance. Pick one and start."
          />

          <div className="mt-10">
            <ToolsExplorer
              tools={tools.map(toPublicTool)}
              categories={categories}
              initialQuery={params.q ?? ""}
              initialCategory={params.category ?? "all"}
            />
          </div>
        </div>
      </Section>

      <Section className="border-t border-border bg-surface">
        <div className="container">
          <SectionHeading
            align="left"
            title="Coming soon"
            description="Planned tools. These are not available yet — no button here does anything."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {comingSoonTools.map((tool) => (
              <div
                key={tool.name}
                className="rounded-xl border border-dashed border-border bg-card/50 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <ToolIcon name={tool.icon} className="h-4 w-4" />
                  </div>
                  <Badge variant="outline">Coming soon</Badge>
                </div>
                <h3 className="mt-4 text-[15px] font-semibold text-muted-foreground">
                  {tool.name}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {tool.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <FooterCta
        title="Not sure which tool you need?"
        description="Describe the job and Oply will point you at the right one."
        primary={{ label: "Try Ask Oply", href: "/dashboard/ask" }}
        secondary={{ label: "See pricing", href: "/pricing" }}
      />
    </>
  );
}
