import { Badge } from "@/components/ui/badge";
import { Section, SectionHeading } from "@/components/marketing/section";
import { FooterCta } from "@/components/marketing/cta";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: "Roadmap",
  description:
    "What Oply is working on now, what comes next, and what is further out. No dates promised.",
  path: "/roadmap",
});

const COLUMNS = [
  {
    label: "Now",
    variant: "success" as const,
    description: "Shipped and live today.",
    items: [
      "10 AI tools",
      "Credit system with atomic deduction",
      "Crypto payments and order tracking",
      "Dashboard, history, favorites and projects",
      "Ask Oply request routing",
    ],
  },
  {
    label: "Next",
    variant: "default" as const,
    description: "In progress or queued up.",
    items: [
      "AI Email Writer",
      "FAQ and Alt Text generators",
      "YouTube and social caption tools",
      "Ad copy and landing page copy",
      "E-commerce product SEO tools",
      "Bulk generation",
    ],
  },
  {
    label: "Later",
    variant: "outline" as const,
    description: "Planned, not yet started.",
    items: [
      "Public API with credit-based usage",
      "Chrome extension",
      "Team workspaces",
      "Multi-step workflows in Ask Oply",
      "File and URL input",
    ],
  },
];

export default function RoadmapPage() {
  return (
    <>
      <Section>
        <div className="container">
          <SectionHeading
            title="Roadmap"
            description="What we are building, in rough order. We do not promise dates — items move when they are ready."
          />

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {COLUMNS.map((column) => (
              <div
                key={column.label}
                className="rounded-xl border border-border bg-card p-6"
              >
                <Badge variant={column.variant}>{column.label}</Badge>
                <p className="mt-3 text-sm text-muted-foreground">
                  {column.description}
                </p>
                <ul className="mt-5 space-y-2.5 border-t border-border pt-5">
                  {column.items.map((item) => (
                    <li key={item} className="text-sm leading-relaxed">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="mx-auto mt-10 max-w-xl text-center text-[13px] text-muted-foreground">
            Credits you buy today work with everything on this page once it
            ships. Nothing here becomes a separate plan.
          </p>
        </div>
      </Section>

      <FooterCta
        title="Want to shape what comes next?"
        description="Tell us which tool would save you the most time."
        primary={{ label: "Send a suggestion", href: "/contact" }}
      />
    </>
  );
}
