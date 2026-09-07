import Link from "next/link";
import { ArrowRight, Coins, Infinity as InfinityIcon, Sparkles } from "lucide-react";
import { AskBox } from "@/components/marketing/ask-box";
import { HeroBackdrop } from "@/components/marketing/backdrop";
import { HeroHeadline } from "@/components/marketing/hero-headline";
import { HeroVisual } from "@/components/marketing/hero-visual";
import { ToolMarquee } from "@/components/marketing/marquee";
import { Button } from "@/components/ui/button";
import type { PublicTool } from "@/config/tools";
import { siteConfig } from "@/config/site";
import { formatNumber } from "@/lib/utils";

/** Mirrors the site's own description ("Write, rewrite, summarize, optimize
 * and create...") — the cycling headline restates real product copy, it
 * doesn't invent new claims. */
const HERO_HEADLINE_WORDS = ["Write", "Rewrite", "Summarize", "Optimize", "Create"];

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

      <div className="container relative py-16 sm:py-20 lg:py-24">
        {/*
         * Asymmetric: copy left, graphic right, collapsing to a single centred
         * column below lg so the headline still leads on a phone.
         */}
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-16">
          <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
            <p className="border-gradient inline-flex items-center gap-2 rounded-full bg-card/70 px-4 py-1.5 text-[13px] font-medium shadow-sm backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
              <span className="text-foreground">{tools.length} AI tools</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">One credit balance</span>
            </p>

            {/*
             * The head term "AI tools" moved into the eyebrow above and the
             * supporting line below rather than leaving the page — the H1 is
             * now the brand line, but the keyword is still in the first
             * screenful and in the <title>.
             */}
            <h1 className="text-balance mt-6 text-[2.75rem] font-semibold leading-[1.03] tracking-[-0.035em] sm:text-display-sm lg:text-[3.75rem]">
              Turn your ideas
              <br />
              <span className="text-gradient">into reality</span>
            </h1>

            <p className="text-pretty mx-auto mt-5 max-w-xl text-[17px] leading-relaxed text-muted-foreground sm:text-lg lg:mx-0">
              {/* The cycling word is decorative; screen readers get the whole
                  sentence once instead of a word that re-announces itself. */}
              <span className="sr-only">
                AI tools to write, rewrite, summarize, optimize and create — all
                from one Oply account, paid for once with credits that never
                expire.
              </span>
              <span aria-hidden="true">
                AI tools to{" "}
                <HeroHeadline
                  words={HERO_HEADLINE_WORDS}
                  className="font-medium text-foreground"
                  punctuate={false}
                />{" "}
                — all from one Oply account, paid for once with credits that
                never expire.
              </span>
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Button asChild size="xl" className="w-full shadow-brand sm:w-auto">
                <Link href="/tools">
                  Explore AI tools
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="xl"
                variant="outline"
                className="w-full bg-card/70 backdrop-blur sm:w-auto"
              >
                <Link href="/pricing">Get credits from ${startingPrice}</Link>
              </Button>
            </div>

            <ul className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-muted-foreground lg:justify-start">
              <HeroFact icon={Coins} text="One-time payment" />
              <HeroFact icon={InfinityIcon} text="Credits never expire" />
              <HeroFact
                icon={Sparkles}
                text={`${formatNumber(siteConfig.signupBonusCredits)} free credits on signup`}
              />
            </ul>
          </div>

          <HeroVisual tools={tools.slice(0, 3)} className="hidden lg:block" />
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
