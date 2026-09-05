import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * The closing panel. Deliberately the most saturated block on any page — it is
 * the last thing a visitor sees before the footer.
 */
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
        <div className="bg-brand-panel relative isolate overflow-hidden rounded-3xl px-6 py-16 text-center shadow-brand-lg sm:px-12">
          {/* Graphic layers over the gradient. */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:22px_22px]"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/25 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-32 -right-16 h-80 w-80 rounded-full bg-brand-3/40 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative mx-auto max-w-xl">
            <h2 className="text-balance text-[1.875rem] font-semibold tracking-[-0.03em] text-white sm:text-[2.25rem]">
              {title}
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-white/85 sm:text-base">
              {description}
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="xl"
                className="bg-white text-[hsl(var(--brand))] shadow-lg hover:bg-white/90"
              >
                <Link href={primary.href}>{primary.label}</Link>
              </Button>
              {secondary && (
                <Button
                  asChild
                  size="xl"
                  variant="outline"
                  className="border-white/40 bg-white/10 text-white backdrop-blur hover:bg-white/20 hover:text-white"
                >
                  <Link href={secondary.href}>{secondary.label}</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
