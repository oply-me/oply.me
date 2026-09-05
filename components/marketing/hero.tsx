import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AskBox } from "@/components/marketing/ask-box";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

export function Hero({ signedIn = false }: { signedIn?: boolean }) {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div
        className="bg-grid pointer-events-none absolute inset-0 opacity-[0.55] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_60%,transparent_100%)]"
        aria-hidden="true"
      />
      <div className="container relative py-20 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-[13px] text-muted-foreground shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
            {siteConfig.secondaryTagline}
          </div>

          <h1 className="text-balance mt-6 text-[2.375rem] font-semibold leading-[1.08] tracking-[-0.032em] sm:text-display-sm lg:text-display">
            AI tools for getting things done.
          </h1>

          <p className="text-pretty mx-auto mt-5 max-w-2xl text-[17px] leading-relaxed text-muted-foreground">
            Write, rewrite, summarize, optimize and create with simple AI tools —
            all from one Oply account.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/tools">
                Explore AI Tools
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/pricing">Get Lifetime Access</Link>
            </Button>
          </div>

          <p className="mt-4 text-[13px] text-muted-foreground">
            One-time payment • No monthly subscription
          </p>
        </div>

        <div className="mx-auto mt-14 max-w-2xl">
          <AskBox signedIn={signedIn} />
        </div>
      </div>
    </section>
  );
}
