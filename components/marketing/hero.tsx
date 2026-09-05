import Link from "next/link";
import { ArrowRight, Coins, Infinity as InfinityIcon, Sparkles } from "lucide-react";
import { AskBox } from "@/components/marketing/ask-box";
import { HeroBackdrop } from "@/components/marketing/backdrop";
import { ToolMarquee } from "@/components/marketing/marquee";
import { Button } from "@/components/ui/button";
import type { PublicTool } from "@/config/tools";
import { siteConfig } from "@/config/site";
import { formatNumber } from "@/lib/utils";

export function Hero({
  signedIn = false,
  tools,
  startingPrice,
}: {
  signedIn?: boolean;
  tools: PublicTool[];
  startingPrice: number;
}) {
  return (
    <section className="relative isolate overflow-hidden border-b border-border">
      <HeroBackdrop />

      <div className="container relative py-20 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <p className="border-gradient inline-flex items-center gap-2 rounded-full bg-card/70 px-4 py-1.5 text-[13px] font-medium shadow-sm backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
            <span className="text-foreground">
              {tools.length} AI tools
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">One credit balance</span>
          </p>

          <h1 className="text-balance mt-6 text-[2.5rem] font-semibold leading-[1.05] tracking-[-0.035em] sm:text-display-sm lg:text-display">
            AI tools for{" "}
            <span className="text-gradient">getting things done.</span>
          </h1>

          <p className="text-pretty mx-auto mt-5 max-w-2xl text-[17px] leading-relaxed text-muted-foreground sm:text-lg">
            Write, rewrite, summarize, optimize and create — all from one Oply
            account, paid for once with credits that never expire.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="xl" className="shadow-brand">
              <Link href="/tools">
                Explore AI tools
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="xl"
              variant="outline"
              className="bg-card/70 backdrop-blur"
            >
              <Link href="/pricing">Get credits from ${startingPrice}</Link>
            </Button>
          </div>

          <ul className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-muted-foreground">
            <HeroFact icon={Coins} text="One-time payment" />
            <HeroFact icon={InfinityIcon} text="Credits never expire" />
            <HeroFact
              icon={Sparkles}
              text={`${formatNumber(siteConfig.signupBonusCredits)} free credits on signup`}
            />
          </ul>
        </div>

        {/* The command box — the fastest path into the product. */}
        <div className="mx-auto mt-14 max-w-2xl">
          <div className="relative">
            <div
              className="absolute -inset-3 rounded-[1.75rem] bg-brand-sheen opacity-80 blur-lg"
              aria-hidden="true"
            />
            <AskBox
              signedIn={signedIn}
              className="relative border-gradient bg-card/95 shadow-brand-lg backdrop-blur"
            />
          </div>
        </div>
      </div>

      {/* Every tool, scrolling past the fold. */}
      <div className="relative pb-10">
        <ToolMarquee tools={tools} />
      </div>
    </section>
  );
}

function HeroFact({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}) {
  return (
    <li className="flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
      {text}
    </li>
  );
}
