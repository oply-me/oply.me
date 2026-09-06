import Link from "next/link";
import { Logo } from "@/components/logo";
import { NewsletterForm } from "@/components/marketing/newsletter-form";
import { SocialLinks } from "@/components/marketing/social-links";
import { siteConfig } from "@/config/site";
import { categories } from "@/config/categories";
import { getEnabledTools } from "@/config/tools";
import { pricingPlans } from "@/config/pricing";

export function Footer() {
  const tools = getEnabledTools();
  const activeCategories = new Set(tools.map((t) => t.category));
  const toolCategories = categories.filter(
    (c) => c.enabled && activeCategories.has(c.slug),
  );

  /* The only two "live" numbers in the footer, and both are derived from
     config at build time rather than invented: how many tools ship, and the
     cheapest pack's real price. No usage or user counters. */
  const cheapestPlan = [...pricingPlans].sort((a, b) => a.price - b.price)[0];

  return (
    <footer className="border-t border-border bg-surface">
      <div className="container py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {siteConfig.tagline}
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              {tools.length} tools across {toolCategories.length} categories.
              One-time payment{cheapestPlan ? ` from $${cheapestPlan.price}` : ""}
              . No monthly subscription.
            </p>
            <SocialLinks />
          </div>

          <FooterColumn title="Tools">
            <FooterLink href="/tools">All tools</FooterLink>
            {toolCategories.map((c) => (
              <FooterLink key={c.slug} href={`/categories/${c.slug}`}>
                {c.name}
              </FooterLink>
            ))}
          </FooterColumn>

          <FooterColumn title="Product">
            {siteConfig.footer.product.map((item) => (
              <FooterLink key={item.href} href={item.href}>
                {item.title}
              </FooterLink>
            ))}
          </FooterColumn>

          <FooterColumn title="Company">
            {siteConfig.footer.company.map((item) => (
              <FooterLink key={item.href} href={item.href}>
                {item.title}
              </FooterLink>
            ))}
          </FooterColumn>

          <FooterColumn title="Legal">
            {siteConfig.footer.legal.map((item) => (
              <FooterLink key={item.href} href={item.href}>
                {item.title}
              </FooterLink>
            ))}
          </FooterColumn>
        </div>

        <div className="mt-12 border-t border-border pt-8">
          <h3 className="text-[13px] font-semibold text-foreground">
            New tools, when they ship
          </h3>
          <NewsletterForm />
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            AI output should be reviewed before you publish it.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-[13px] font-semibold text-foreground">{title}</h3>
      <ul className="mt-3 space-y-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        {children}
      </Link>
    </li>
  );
}
