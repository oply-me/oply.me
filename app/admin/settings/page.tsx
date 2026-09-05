import { AdminSettingsForm } from "@/components/admin/settings-form";
import { AnnouncementManager } from "@/components/admin/announcement-manager";
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/config/site";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAIConfigured } from "@/lib/ai/client";
import { DEFAULT_MODEL } from "@/lib/ai/models";
import { getPaymentProvider, isDevPaymentModeEnabled, isPaymentConfigured } from "@/lib/payments";
import { getEmailProvider } from "@/lib/email";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const db = createAdminClient();

  const [{ data: settings }, { data: announcements }] = await Promise.all([
    db.from("site_settings").select("key, value"),
    db
      .from("announcements")
      .select("id, title, message, link_url, link_label, enabled, starts_at, ends_at")
      .order("starts_at", { ascending: false })
      .limit(20),
  ]);

  const values = Object.fromEntries(
    (settings ?? []).map((s) => [s.key, s.value]),
  ) as Record<string, unknown>;

  const integrations = [
    {
      name: "AI provider",
      detail: `${process.env.AI_PROVIDER ?? "anthropic"} · ${DEFAULT_MODEL}`,
      configured: isAIConfigured(),
    },
    {
      name: "Payment provider",
      detail: isDevPaymentModeEnabled()
        ? "development simulator"
        : getPaymentProvider().name,
      configured: isPaymentConfigured(),
    },
    {
      name: "Email provider",
      detail: getEmailProvider().name,
      configured: getEmailProvider().isConfigured(),
    },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-[1.5rem] font-semibold tracking-[-0.022em]">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Operational configuration. Pricing and credit costs live in
          server-side config, not here.
        </p>
      </div>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-[15px] font-semibold">Integrations</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Read from the environment at runtime. Secrets are never displayed.
        </p>
        <ul className="mt-5 space-y-3">
          {integrations.map((item) => (
            <li
              key={item.name}
              className="flex items-center justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0"
            >
              <div>
                <p className="text-sm font-medium">{item.name}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {item.detail}
                </p>
              </div>
              <Badge variant={item.configured ? "success" : "warning"}>
                {item.configured ? "Configured" : "Not configured"}
              </Badge>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-xl border border-border bg-card p-6">
        <h2 className="text-[15px] font-semibold">Platform settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Stored in the <code>site_settings</code> table and read at runtime.
        </p>
        <div className="mt-5">
          <AdminSettingsForm
            values={{
              signup_bonus_credits: Number(
                values.signup_bonus_credits ?? siteConfig.signupBonusCredits,
              ),
              low_credit_threshold: Number(
                values.low_credit_threshold ?? siteConfig.lowCreditThreshold,
              ),
              ai_rate_limit_per_min: Number(values.ai_rate_limit_per_min ?? 10),
              support_email: String(values.support_email ?? siteConfig.supportEmail),
              maintenance_mode: Boolean(values.maintenance_mode ?? false),
            }}
          />
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-border bg-card p-6">
        <h2 className="text-[15px] font-semibold">Announcements</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Shows as a banner at the top of the dashboard while active.
        </p>
        <div className="mt-5">
          <AnnouncementManager announcements={announcements ?? []} />
        </div>
      </section>
    </div>
  );
}
