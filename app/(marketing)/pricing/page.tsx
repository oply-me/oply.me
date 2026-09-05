import { Section, SectionHeading } from "@/components/marketing/section";
import { PricingTable } from "@/components/marketing/pricing-table";
import { FaqList } from "@/components/marketing/faq";
import { FooterCta } from "@/components/marketing/cta";
import { getSessionUser } from "@/lib/auth/guards";
import { isPaymentConfigured } from "@/lib/payments";
import { listTools } from "@/lib/tools/registry";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: "Pricing — One-Time Credit Packs",
  description:
    "Buy Oply credits once and use them across every AI tool. Packs from $9. No monthly subscription, no recurring charge.",
  path: "/pricing",
});

const PRICING_FAQ = [
  {
    question: "Is this a subscription?",
    answer:
      "No. Every pack is a single payment. There is nothing to cancel and no card kept on file for renewals.",
  },
  {
    question: "Do credits expire?",
    answer: "No. They stay on your account until you spend them.",
  },
  {
    question: "Can I buy more credits later?",
    answer:
      "Yes. Buy another pack at any time and the credits are added to your existing balance.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "Checkout is handled by a crypto payment provider. The currencies and networks shown at checkout are the ones that provider is configured to accept.",
  },
  {
    question: "When do credits arrive?",
    answer:
      "As soon as the payment provider confirms the transaction. Credits are added only after that confirmation reaches our server — never just because a page loaded.",
  },
  {
    question: "What if a generation fails?",
    answer:
      "The credits are refunded to your balance automatically. You are only charged for results you receive.",
  },
  {
    question: "Can I get a refund?",
    answer:
      "Credits are digital goods delivered instantly. See the Refund Policy for the specific circumstances where a refund applies.",
  },
];

export default async function PricingPage() {
  const [user, tools] = await Promise.all([getSessionUser(), listTools()]);
  const paymentsConfigured = isPaymentConfigured();

  return (
    <>
      <Section className="pb-8">
        <div className="container">
          <SectionHeading
            title="Buy credits once. Use them across Oply."
            description="Every tool uses a small number of credits. Your balance is shared across your entire Oply account — including tools we ship later."
          />
          <p className="mt-4 text-center text-[13px] text-muted-foreground">
            One-time payment • No monthly subscription
          </p>

          <div className="mt-12">
            <PricingTable
              signedIn={Boolean(user)}
              paymentsConfigured={paymentsConfigured}
            />
          </div>

          {!paymentsConfigured && (
            <p className="mx-auto mt-8 max-w-xl rounded-lg border border-warning/30 bg-warning/5 p-4 text-center text-[13px] text-muted-foreground">
              Checkout is not enabled on this deployment yet — the payment
              provider has not been configured. The full order and webhook flow
              is implemented and ready; see README.md for the setup steps.
            </p>
          )}
        </div>
      </Section>

      <Section className="border-t border-border bg-surface">
        <div className="container">
          <SectionHeading
            title="What a credit buys"
            description="Costs are per generation. Refinements like shorten or expand run as a new generation."
          />
          <div className="mx-auto mt-10 max-w-2xl divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {tools.map((tool) => (
              <div
                key={tool.slug}
                className="flex items-center justify-between gap-4 px-5 py-3.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{tool.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {tool.description}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-medium tabular-nums">
                  {tool.creditCost}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section className="border-t border-border">
        <div className="container">
          <SectionHeading title="Pricing questions" />
          <div className="mx-auto mt-10 max-w-2xl">
            <FaqList items={PRICING_FAQ} />
          </div>
        </div>
      </Section>

      <FooterCta
        title="Still deciding?"
        description="Create an account and try a tool with your welcome credits first."
        primary={{ label: "Create free account", href: "/signup" }}
        secondary={{ label: "Browse tools", href: "/tools" }}
      />
    </>
  );
}
