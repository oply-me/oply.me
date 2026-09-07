import { Badge } from "@/components/ui/badge";
import { VoidReferralButton } from "@/components/admin/void-referral-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatCard } from "@/components/admin/stat-card";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateTime, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Admin view of the referral program. Reads through the service-role client
 * like every other admin page — the guard is `requireAdmin()` in
 * `app/admin/layout.tsx`, not RLS.
 */
export default async function AdminReferralsPage() {
  const db = createAdminClient();

  const [{ data: referrals }, { data: rewards }, { data: codes }] =
    await Promise.all([
      db
        .from("referrals")
        .select("id, referrer_id, referred_id, referral_code, qualified_at, created_at")
        .order("created_at", { ascending: false })
        .limit(200),
      db.from("referral_rewards").select("referral_id, user_id, credits"),
      db.from("referral_codes").select("code, user_id"),
    ]);

  const rows = referrals ?? [];
  const rewardRows = rewards ?? [];

  // Emails are resolved here rather than joined, so the query stays readable
  // and a deleted profile simply shows as unknown.
  const userIds = [
    ...new Set(rows.flatMap((r) => [r.referrer_id, r.referred_id])),
  ];
  const { data: profiles } = userIds.length
    ? await db.from("profiles").select("id, email").in("id", userIds)
    : { data: [] };
  const emailById = new Map((profiles ?? []).map((p) => [p.id, p.email]));

  const creditsByReferral = new Map<string, number>();
  for (const reward of rewardRows) {
    creditsByReferral.set(
      reward.referral_id,
      (creditsByReferral.get(reward.referral_id) ?? 0) + reward.credits,
    );
  }

  const qualified = rows.filter((r) => r.qualified_at !== null).length;
  const creditsGranted = rewardRows.reduce((sum, r) => sum + r.credits, 0);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="text-[1.5rem] font-semibold tracking-[-0.022em]">
          Referrals
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Live rows from <code>referrals</code> and <code>referral_rewards</code>.
          Rates are set in Settings.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Referred signups" value={formatNumber(rows.length)} />
        <StatCard
          label="Qualified"
          value={formatNumber(qualified)}
          hint="Made a first purchase"
        />
        <StatCard
          label="Credits granted"
          value={formatNumber(creditsGranted)}
          hint="Net of anything already reversed"
        />
        <StatCard
          label="Codes issued"
          value={formatNumber((codes ?? []).length)}
          hint="Created on first use"
        />
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Referrer</TableHead>
              <TableHead>Referred</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Credits</TableHead>
              <TableHead>Signed up</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((referral) => (
              <TableRow key={referral.id}>
                <TableCell className="max-w-[16rem] truncate">
                  {emailById.get(referral.referrer_id) ?? "—"}
                </TableCell>
                <TableCell className="max-w-[16rem] truncate">
                  {emailById.get(referral.referred_id) ?? "—"}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {referral.referral_code ?? "—"}
                </TableCell>
                <TableCell>
                  {referral.qualified_at ? (
                    <Badge variant="success">Qualified</Badge>
                  ) : (
                    <Badge variant="outline">Pending</Badge>
                  )}
                </TableCell>
                <TableCell className="tabular-nums">
                  {formatNumber(creditsByReferral.get(referral.id) ?? 0)}
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatDateTime(referral.created_at)}
                </TableCell>
                <TableCell>
                  {referral.qualified_at && (
                    <VoidReferralButton
                      referralId={referral.id}
                      referredId={referral.referred_id}
                    />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {rows.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">
            No referrals yet.
          </p>
        )}
      </div>
    </div>
  );
}
