import { StatCard } from "@/components/admin/stat-card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateTime, formatNumber } from "@/lib/utils";
import type { CreditTransactionType } from "@/lib/types/database";

export const dynamic = "force-dynamic";

const VARIANT: Record<
  CreditTransactionType,
  "default" | "success" | "warning" | "outline"
> = {
  purchase: "success",
  usage: "outline",
  refund: "warning",
  bonus: "default",
  admin_adjustment: "warning",
};

export default async function AdminCreditsPage() {
  const db = createAdminClient();

  const [{ data: transactions }, { data: balances }] = await Promise.all([
    db
      .from("credit_transactions")
      .select(
        "id, user_id, type, amount, balance_after, description, created_at, profiles(email)",
      )
      .order("created_at", { ascending: false })
      .limit(200),
    db.from("credit_balances").select("balance, lifetime_purchased, lifetime_used"),
  ]);

  const totals = (balances ?? []).reduce(
    (acc, row) => ({
      outstanding: acc.outstanding + row.balance,
      purchased: acc.purchased + row.lifetime_purchased,
      used: acc.used + row.lifetime_used,
    }),
    { outstanding: 0, purchased: 0, used: 0 },
  );

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="text-[1.5rem] font-semibold tracking-[-0.022em]">Credits</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The full ledger. Every balance change on the platform appears here —
          there is no code path that changes a balance without writing a row.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Outstanding balance"
          value={formatNumber(totals.outstanding)}
          hint="Credits users hold but have not spent"
        />
        <StatCard label="Lifetime purchased" value={formatNumber(totals.purchased)} />
        <StatCard label="Lifetime consumed" value={formatNumber(totals.used)} />
      </div>

      <h2 className="mb-3 mt-8 text-[15px] font-semibold">Recent transactions</h2>
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Balance after</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(transactions ?? []).map((tx) => {
              const profile = tx.profiles as unknown as { email: string } | null;
              return (
                <TableRow key={tx.id}>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatDateTime(tx.created_at)}
                  </TableCell>
                  <TableCell className="text-xs">{profile?.email ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={VARIANT[tx.type]} className="capitalize">
                      {tx.type.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={
                      tx.amount > 0
                        ? "tabular-nums text-success"
                        : "tabular-nums"
                    }
                  >
                    {tx.amount > 0 ? "+" : ""}
                    {formatNumber(tx.amount)}
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {formatNumber(tx.balance_after)}
                  </TableCell>
                  <TableCell className="max-w-[280px] truncate text-xs text-muted-foreground">
                    {tx.description ?? "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {(transactions ?? []).length === 0 && (
          <p className="py-14 text-center text-sm text-muted-foreground">
            No transactions yet.
          </p>
        )}
      </div>
    </div>
  );
}
