import { Section } from "@/components/marketing/section";

/** Shared shell for the legal and informational pages. */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <Section>
      <div className="container">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-[2rem] font-semibold tracking-[-0.028em]">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Last updated {updated}
          </p>
          <div className="prose-output mt-10 [&_h2]:mt-10 [&_h2]:text-lg">
            {children}
          </div>
        </div>
      </div>
    </Section>
  );
}
