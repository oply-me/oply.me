import { Mail } from "lucide-react";
import { ContactForm } from "@/components/marketing/contact-form";
import { Section } from "@/components/marketing/section";
import { siteConfig } from "@/config/site";
import { getSessionUser } from "@/lib/auth/guards";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: "Contact",
  description:
    "Get in touch with the Oply team about your account, billing, a bug, or a tool you would like to see.",
  path: "/contact",
});

export default async function ContactPage() {
  const user = await getSessionUser();

  return (
    <Section>
      <div className="container">
        <div className="mx-auto grid max-w-4xl gap-12 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <h1 className="text-[2rem] font-semibold tracking-[-0.028em]">
              Contact
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
              Questions about your account, an order that has not landed, a bug,
              or a tool you wish existed — all of it is welcome here.
            </p>

            <div className="mt-8 rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Mail className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-[13px] font-medium">Email us directly</p>
                  <a
                    href={`mailto:${siteConfig.supportEmail}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {siteConfig.supportEmail}
                  </a>
                </div>
              </div>
            </div>

            <p className="mt-6 text-[13px] leading-relaxed text-muted-foreground">
              If you are writing about a payment, include your order ID — you can
              find it on the billing page in your dashboard.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
            <ContactForm defaultEmail={user?.email ?? ""} />
          </div>
        </div>
      </div>
    </Section>
  );
}
