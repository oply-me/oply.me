import { JsonLd } from "@/components/json-ld";
import { FaqList } from "@/components/marketing/faq";
import { FooterCta } from "@/components/marketing/cta";
import { Section, SectionHeading } from "@/components/marketing/section";
import { faqJsonLd } from "@/lib/seo/jsonld";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: "FAQ",
  description:
    "Answers about Oply credits, one-time pricing, crypto payments, AI output quality and account features.",
  path: "/faq",
});

const GROUPS = [
  {
    title: "Credits and pricing",
    items: [
      {
        question: "How does the credit system work?",
        answer:
          "Every tool has a published credit cost — 5 for a rewrite, 20 for a long-form article. You buy a pack of credits once, and that single balance is spent across every tool on your account.",
      },
      {
        question: "Is there a monthly subscription?",
        answer:
          "No. Oply is one-time payments only. There is no renewal, no card kept on file for recurring charges, and nothing to cancel.",
      },
      {
        question: "Do credits expire?",
        answer: "No. Credits stay on your account until you use them.",
      },
      {
        question: "What happens when I run out?",
        answer:
          "Tools stop running and you are shown a prompt to buy more. Your history, favorites and projects stay exactly as they are.",
      },
      {
        question: "Do new tools cost extra?",
        answer:
          "No. Tools added after your purchase run on the credits you already own.",
      },
    ],
  },
  {
    title: "Payments",
    items: [
      {
        question: "How do I pay?",
        answer:
          "Through a crypto payment provider. The supported currencies and networks shown at checkout are exactly the ones that provider is configured to accept — we do not advertise networks we cannot settle.",
      },
      {
        question: "When are credits added to my account?",
        answer:
          "Only after the payment provider confirms the transaction and sends a signed confirmation to our server. Returning to a success page never adds credits by itself.",
      },
      {
        question: "What if I pay and nothing happens?",
        answer:
          "Crypto confirmations can lag behind the payment. Your order page shows the live status. If it has not resolved within an hour, contact support with your order ID.",
      },
    ],
  },
  {
    title: "Using the tools",
    items: [
      {
        question: "How good is the output?",
        answer:
          "Good enough to work from, not good enough to publish unread. Treat every result as a first draft: check facts, adjust the voice, and edit before it goes out.",
      },
      {
        question: "Can I use the output commercially?",
        answer:
          "Yes. What you generate is yours to use. You are responsible for reviewing it and for the claims it makes.",
      },
      {
        question: "Is my input used to train models?",
        answer:
          "Oply does not train models on your content. Your inputs are sent to the AI provider to produce your result and stored in your own history so you can find it again.",
      },
      {
        question: "What happens if a generation fails?",
        answer:
          "The credits reserved for it are returned automatically and a refund entry appears in your credit history.",
      },
      {
        question: "Is there a free trial?",
        answer:
          "New accounts start with a small welcome balance so you can try the tools before buying a pack.",
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        question: "Can I delete my account?",
        answer:
          "Yes. Email support and we will remove your account and its data. Unused credits are not transferable.",
      },
      {
        question: "Can I use Oply on my phone?",
        answer:
          "Yes. The whole interface, including the tool workspaces, is built for small screens.",
      },
    ],
  },
];

export default function FaqPage() {
  const all = GROUPS.flatMap((g) => g.items);

  return (
    <>
      <JsonLd data={faqJsonLd(all)} />

      <Section>
        <div className="container">
          <SectionHeading
            title="Frequently asked questions"
            description="If your question is not here, contact us and we will answer it directly."
          />

          <div className="mx-auto mt-14 max-w-2xl space-y-12">
            {GROUPS.map((group) => (
              <div key={group.title}>
                <h2 className="text-[15px] font-semibold text-primary">
                  {group.title}
                </h2>
                <div className="mt-2">
                  <FaqList items={group.items} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <FooterCta
        title="Still have a question?"
        description="Send it over and we will get back to you."
        primary={{ label: "Contact us", href: "/contact" }}
        secondary={{ label: "Browse tools", href: "/tools" }}
      />
    </>
  );
}
