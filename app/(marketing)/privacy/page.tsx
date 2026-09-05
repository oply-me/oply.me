import { LegalPage } from "@/components/marketing/legal-page";
import { siteConfig } from "@/config/site";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: "Privacy Policy",
  description:
    "How Oply collects, uses and stores your data, and what we send to our AI and payment providers.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="January 2025">
      <p>
        This policy explains what {siteConfig.name} collects, why, and who else
        sees it. It is written to be read rather than skimmed past.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Account data</strong> — your email address, and a display name
          and avatar if you set them.
        </li>
        <li>
          <strong>Content you submit</strong> — the text and options you enter
          into a tool, and the result it produced. This is stored so your
          history, favorites and projects work.
        </li>
        <li>
          <strong>Usage data</strong> — which tool ran, how many credits it cost,
          and the token counts reported by the AI provider. We use this for
          billing accuracy and capacity planning.
        </li>
        <li>
          <strong>Order data</strong> — the plan purchased, the amount, and the
          payment reference returned by the payment provider.
        </li>
      </ul>
      <p>
        We do not collect payment card details. Crypto payments are handled
        entirely by the payment provider and we never see wallet credentials.
      </p>

      <h2>Who we share it with</h2>
      <ul>
        <li>
          <strong>The AI provider</strong> receives the content you submit to a
          tool, in order to produce your result. It does not receive your email
          address or account identifiers.
        </li>
        <li>
          <strong>The payment provider</strong> receives the order amount and a
          reference, in order to process your payment.
        </li>
        <li>
          <strong>Our hosting and database providers</strong> store the data
          described above on our behalf.
        </li>
      </ul>
      <p>We do not sell your data, and we do not share it for advertising.</p>

      <h2>Model training</h2>
      <p>
        {siteConfig.name} does not train AI models on your content, and does not
        submit your content for model training.
      </p>

      <h2>How long we keep it</h2>
      <p>
        Generations stay in your history until you delete them or close your
        account. Order and credit-ledger records are retained for as long as
        required for accounting purposes. Deleting your account removes your
        profile, generations, favorites and projects.
      </p>

      <h2>Security</h2>
      <p>
        Data is access-controlled at the database level so one account cannot
        read another&apos;s records. API keys and payment secrets exist only on
        the server and are never sent to your browser.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>Delete any generation from your history at any time.</li>
        <li>Update or clear your profile details in account settings.</li>
        <li>
          Request deletion of your account and its data by emailing{" "}
          <a href={`mailto:${siteConfig.supportEmail}`}>
            {siteConfig.supportEmail}
          </a>
          .
        </li>
      </ul>

      <h2>Cookies</h2>
      <p>
        We use cookies that are necessary to keep you signed in and to remember
        your theme preference. If optional analytics are enabled on this
        deployment, they are configured to avoid collecting personal data or the
        content you submit.
      </p>

      <h2>Children</h2>
      <p>
        {siteConfig.name} is not intended for anyone under 13, and we do not
        knowingly collect their data.
      </p>

      <h2>Changes</h2>
      <p>
        If this policy changes materially we will update the date at the top and,
        where the change affects how your data is used, notify account holders.
      </p>

      <h2>Contact</h2>
      <p>
        Privacy questions go to{" "}
        <a href={`mailto:${siteConfig.supportEmail}`}>
          {siteConfig.supportEmail}
        </a>
        .
      </p>
    </LegalPage>
  );
}
