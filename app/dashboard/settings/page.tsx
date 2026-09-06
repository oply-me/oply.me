import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsForm } from "@/components/dashboard/settings-form";
import {
  ChangePasswordForm,
  DeleteAccountForm,
} from "@/components/dashboard/security-forms";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth/guards";
import { formatDate } from "@/lib/utils";

export default async function SettingsPage() {
  const user = await requireUser("/dashboard/settings");

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Settings"
        description="Your profile, appearance and account details."
      />

      <div className="space-y-6">
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-[15px] font-semibold">Profile</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            How you appear inside Oply.
          </p>
          <div className="mt-5">
            <SettingsForm
              profile={{
                full_name: user.profile?.full_name ?? "",
                avatar_url: user.profile?.avatar_url ?? "",
                primary_use_case: user.profile?.primary_use_case ?? "",
              }}
              email={user.email}
            />
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-[15px] font-semibold">Appearance</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Light, dark, or follow your system.
              </p>
            </div>
            <ThemeToggle />
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-[15px] font-semibold">Account</h2>
          <dl className="mt-5 space-y-3.5 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium">{user.email}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Role</dt>
              <dd>
                <Badge variant={user.profile?.role === "admin" ? "default" : "outline"}>
                  {user.profile?.role === "admin" ? "Admin" : "Member"}
                </Badge>
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Member since</dt>
              <dd className="font-medium">
                {user.profile ? formatDate(user.profile.created_at) : "—"}
              </dd>
            </div>
          </dl>
          <p className="mt-6 border-t border-border pt-4 text-[13px] leading-relaxed text-muted-foreground">
            Your email, role and credit balance can only be changed by Oply.
          </p>
        </section>

        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-[15px] font-semibold">Password</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your current password is required, so a signed-in browser left
            unattended cannot be used to lock you out.
          </p>
          <div className="mt-5">
            <ChangePasswordForm />
          </div>
        </section>

        <section className="rounded-xl border border-destructive/30 bg-card p-6">
          <h2 className="text-[15px] font-semibold">Delete account</h2>
          <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted-foreground">
            Permanently deletes your account and everything attached to it —
            generations, saved results, projects, order records and any
            remaining credit balance. This cannot be undone, and unused credits
            are not refunded.
          </p>
          <div className="mt-5">
            <DeleteAccountForm email={user.email} />
          </div>
        </section>
      </div>
    </div>
  );
}
