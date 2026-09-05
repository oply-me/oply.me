import { LegalPage } from "@/components/marketing/legal-page";
import { siteConfig } from "@/config/site";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: "Refund Policy",
  description:
    "When Oply refunds a credit purchase, how failed generations are handled, and how to raise a billing issue.",
  path: "/refund-policy",
});

export default function RefundPolicyPage() {
  return (
    <LegalPage title="Refund Policy" updated="January 2025">
      <p>
        Credits are digital goods delivered to your account as soon as payment is
        confirmed. This policy explains the situations where a refund applies and
        the situations where it does not, so there are no surprises.
      </p>

      <h2>Failed generations are always refunded</h2>
      <p>
        This is separate from a purchase refund and happens automatically. If
        credits are reserved for a generation and the AI provider fails to return
        a result, those credits are returned to your balance immediately and a
        refund entry appears in your credit history. You are never charged for a
        result you did not receive.
      </p>

      <h2>When we will refund a purchase</h2>
      <ul>
        <li>
          <strong>Duplicate charge.</strong> If a technical fault caused you to
          be charged twice for the same pack, we refund the duplicate.
        </li>
        <li>
          <strong>Credits never arrived.</strong> If a payment confirmed but the
          credits were not added to your account, we will either add the credits
          or refund the payment — your choice.
        </li>
        <li>
          <strong>Unused purchase, within 14 days.</strong> If you bought a pack
          within the last 14 days and have not spent any of those credits, write
          to us and we will refund it.
        </li>
      </ul>

      <h2>When we cannot refund</h2>
      <ul>
        <li>
          Credits that have already been spent. Once a generation runs, the
          underlying AI cost has been incurred.
        </li>
        <li>
          Dissatisfaction with AI output quality. Every tool can be tried with
          the welcome credits on a new account before you buy a pack, and output
          quality varies with the input you provide.
        </li>
        <li>
          Accounts suspended for a breach of the Terms of Service.
        </li>
        <li>
          Losses caused by sending funds to an incorrect address, or by network
          fees charged by a blockchain. Those funds never reach us.
        </li>
      </ul>

      <h2>Partial refunds</h2>
      <p>
        Where a refund is approved but part of the pack has been used, we refund
        the unused portion on a pro-rata basis. Refunding a purchase removes the
        corresponding credits from your balance; if you have already spent them,
        the balance is reduced to zero rather than going negative.
      </p>

      <h2>Crypto refunds</h2>
      <p>
        Refunds are returned in the same cryptocurrency and to the address the
        payment came from, unless that is not technically possible. The refunded
        amount is the amount we received; exchange-rate movement between payment
        and refund is not covered, and network fees are deducted.
      </p>

      <h2>How to request a refund</h2>
      <p>
        Email{" "}
        <a href={`mailto:${siteConfig.supportEmail}`}>
          {siteConfig.supportEmail}
        </a>{" "}
        with your account email, the order ID from your billing page, and what
        went wrong. We aim to respond within two business days and to resolve
        approved refunds within ten.
      </p>

      <h2>Statutory rights</h2>
      <p>
        Nothing in this policy limits rights you have under the consumer law that
        applies where you live.
      </p>
    </LegalPage>
  );
}
