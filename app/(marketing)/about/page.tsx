import { LegalPage } from "@/components/marketing/legal-page";
import { FooterCta } from "@/components/marketing/cta";
import { siteConfig } from "@/config/site";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: "About",
  description:
    "Oply is one home for small, useful AI tools — bought once, shared across a single account.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <>
      <LegalPage title="About Oply" updated="January 2025">
        <p>
          Most AI tools arrive as a separate tab, a separate login and a separate
          monthly charge. You end up paying four subscriptions to do four small
          jobs, and none of them remember what you did last week.
        </p>
        <p>
          Oply is the opposite arrangement. One account, one credit balance, and
          a set of focused tools that each do a single job properly. You buy
          credits once and spend them wherever you need them.
        </p>

        <h2>What we are building</h2>
        <p>
          The product is deliberately small at launch — ten tools covering
          writing, rewriting, summarizing, prompts, SEO metadata, structured
          data, product copy, replies and outlines. Everything is built around a
          tool registry, so new tools ship as configuration rather than as a
          redesign.
        </p>

        <h2>How we think about pricing</h2>
        <p>
          There is no subscription. A credit pack is a one-time payment and the
          credits do not expire. Each tool costs a small, published number of
          credits per run, and if a generation fails those credits go straight
          back to your balance.
        </p>

        <h2>What we will not claim</h2>
        <p>
          Oply will not promise unlimited AI, guaranteed search rankings, or
          content indistinguishable from human writing. AI output is a strong
          first draft that you should read and edit. We would rather be useful
          than impressive.
        </p>

        <h2>Get in touch</h2>
        <p>
          Questions, bugs or a tool you wish existed — write to{" "}
          <a href={`mailto:${siteConfig.supportEmail}`}>
            {siteConfig.supportEmail}
          </a>
          .
        </p>
      </LegalPage>
      <FooterCta />
    </>
  );
}
