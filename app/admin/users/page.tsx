import { AdminUsersTable } from "@/components/admin/users-table";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const db = createAdminClient();

  let query = db
    .from("profiles")
    .select("id, email, full_name, role, disabled, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (q) query = query.ilike("email", `%${q}%`);

  const { data: profiles } = await query;

  const ids = (profiles ?? []).map((p) => p.id);
  const { data: balances } = await db
    .from("credit_balances")
    .select("user_id, balance, lifetime_purchased, lifetime_used")
    .in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);

  const balanceByUser = new Map(
    (balances ?? []).map((b) => [b.user_id, b]),
  );

  const users = (profiles ?? []).map((p) => ({
    ...p,
    balance: balanceByUser.get(p.id)?.balance ?? 0,
    lifetimePurchased: balanceByUser.get(p.id)?.lifetime_purchased ?? 0,
  }));

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="text-[1.5rem] font-semibold tracking-[-0.022em]">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Credit adjustments made here are written to the ledger as
          admin_adjustment entries.
        </p>
      </div>
      <AdminUsersTable users={users} initialQuery={q ?? ""} />
    </div>
  );
}
