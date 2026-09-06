import Link from "next/link";
import { LegalPage } from "@/components/marketing/legal-page";
import { siteConfig } from "@/config/site";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: "Refund Policy",
  description:
    "Credit purchases are final. The narrow exceptions, how failed generations are handled automatically, and how to raise a billing issue.",
  path: "/refund-policy",
});

export default function RefundPolicyPage() {
  return (
    <LegalPage title="Refund Policy" updated="September 2026">
      <p>
        Credits are digital goods, delivered to your account the moment payment
        confirms and usable immediately. <strong>Credit purchases are final.</strong>{" "}
        This page sets out the narrow exceptions where we will still refund, so
        there are no surprises in either direction.
      </p>

      <h2>Try before you buy</h2>
      <p>
        Every new account starts with {siteConfig.signupBonusCredits} welcome
        credits, and every tool page shows an example of its output before you
        run anything. Because you can evaluate the tools without paying, we do
        not offer a change-of-mind refund window on credit packs.
      </p>

      <h2>Failed generations are always refunded</h2>
      <p>
        This is automatic and is not a purchase refund. If credits are reserved
        for a generation and the AI provider fails to return a result, those
        credits are returned to your balance immediately and a refund entry
        appears in your credit history. You are never charged for a result you
        did not receive.
      </p>

      <h2>The exceptions we will still refund</h2>
      <ul>
        <li>
          <strong>Duplicate charge.</strong> If a technical fault charged you
          twice for the same pack, we refund the duplicate in full.
        </li>
        <li>
          <strong>Credits never arrived.</strong> If a payment confirmed but the
          credits were not added to your account, we will either add the credits
          or refund the payment — your choice.
        </li>
        <li>
          <strong>Where the law requires it.</strong> See statutory rights
          below.
        </li>
      </ul>

      <h2>When we will not refund</h2>
      <ul>
        <li>
          Change of mind, or a pack bought and no longer wanted. There is no
          14-day window and no partial or pro-rata refund of an unused balance.
        </li>
        <li>
          Credits that have already been spent. Once a generation runs, the
          underlying AI cost has been incurred.
        </li>
        <li>
          Dissatisfaction with AI output quality. Output varies with the input
          you provide, and the welcome credits exist so you can judge that
          before buying.
        </li>
        <li>Accounts suspended for a breach of the Terms of Service.</li>
        <li>
          Losses caused by sending funds to an incorrect address, or by network
          fees charged by a blockchain. Those funds never reach us.
        </li>
        <li>
          Credits remaining on an account you choose to delete. Deleting your
          account forfeits any unused balance.
        </li>
      </ul>

      <h2>Statutory rights</h2>
      <p>
        Nothing in this policy limits rights you have under the consumer law
        that applies where you live. In the EU and UK in particular, digital
        content bought online normally carries a 14-day right of withdrawal;
        that right is waived only where you have expressly consented to
        immediate delivery and acknowledged the loss of it. Where you have not,
        the statutory right applies regardless of the wording above.
      </p>

      <h2>Card payments and disputes</h2>
      <p>
        Card purchases are processed by Paddle as Merchant of Record. Paddle is
        the seller of record for those transactions and applies its own buyer
        terms and dispute handling, which operate independently of this policy
        and may result in a refund we would not otherwise have given. If you
        paid by card, please contact us before opening a chargeback — a dispute
        raised without contacting us first is usually slower to resolve for
        everyone.
      </p>

      <h2>Crypto refunds</h2>
      <p>
        Where a refund is due, it is returned in the same cryptocurrency and to
        the address the payment came from, unless that is not technically
        possible. The refunded amount is the amount we received; exchange-rate
        movement between payment and refund is not covered, and network fees are
        deducted.
      </p>

      <h2>Effect of a refund</h2>
      <p>
        Refunding a purchase removes the corresponding credits from your
        balance. If you have already spent them, the balance is reduced to zero
        rather than going negative.
      </p>

      <h2>How to raise a billing issue</h2>
      <p>
        Email{" "}
        <a href={`mailto:${siteConfig.supportEmail}`}>
          {siteConfig.supportEmail}
        </a>{" "}
        with your account email, the order ID from your{" "}
        <Link href="/dashboard/billing">billing page</Link>, and what went
        wrong. We aim to respond within two business days and to resolve
        approved refunds within ten.
      </p>
    </LegalPage>
  );
}
