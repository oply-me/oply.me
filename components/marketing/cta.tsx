import Link from "next/link";
import { Button } from "@/components/ui/button";

export function FooterCta({
  title = "Ready to get more done?",
  description = "Explore Oply's AI tools.",
  primary = { label: "Explore Tools", href: "/tools" },
  secondary,
}: {
  title?: string;
  description?: string;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
}) {
  return (
    <section className="border-t border-border bg-surface">
      <div className="container py-16 sm:py-20">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-balance text-[1.75rem] font-semibold tracking-[-0.025em]">
            {title}
          </h2>
          <p className="mt-3 text-[15px] text-muted-foreground">{description}</p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href={primary.href}>{primary.label}</Link>
            </Button>
            {secondary && (
              <Button asChild size="lg" variant="outline">
                <Link href={secondary.href}>{secondary.label}</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
