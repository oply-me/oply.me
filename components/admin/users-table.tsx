"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Coins, Search, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatNumber } from "@/lib/utils";

interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  disabled: boolean;
  created_at: string;
  balance: number;
  lifetimePurchased: number;
}

export function AdminUsersTable({
  users,
  initialQuery,
}: {
  users: AdminUser[];
  initialQuery: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [adjusting, setAdjusting] = useState<AdminUser | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = users.filter(
    (u) =>
      !query ||
      u.email.toLowerCase().includes(query.toLowerCase()) ||
      (u.full_name ?? "").toLowerCase().includes(query.toLowerCase()),
  );

  async function adjustCredits(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!adjusting) return;

    const form = new FormData(event.currentTarget);
    const amount = Number(form.get("amount"));
    const description = String(form.get("description") ?? "");

    if (!Number.isFinite(amount) || amount === 0) {
      toast.error("Enter a non-zero amount.");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/admin/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: adjusting.id, amount, description }),
      });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error ?? "Could not adjust credits.");
        return;
      }

      toast.success(`Balance is now ${formatNumber(data.balance)} credits`);
      setAdjusting(null);
      router.refresh();
    } catch {
      toast.error("Could not adjust credits.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleDisabled(user: AdminUser) {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, disabled: !user.disabled }),
      });
      if (!response.ok) throw new Error();
      toast.success(user.disabled ? "Account enabled" : "Account disabled");
      router.refresh();
    } catch {
      toast.error("Could not update the account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="relative mb-4 max-w-sm">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by email or name…"
          aria-label="Search users"
          className="pl-9"
        />
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Credits</TableHead>
              <TableHead>Purchased</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <p className="font-medium">{user.full_name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </TableCell>
                <TableCell>
                  {user.role === "admin" ? (
                    <Badge>
                      <ShieldCheck className="h-3 w-3" />
                      Admin
                    </Badge>
                  ) : (
                    <Badge variant="outline">Member</Badge>
                  )}
                </TableCell>
                <TableCell className="tabular-nums">
                  {formatNumber(user.balance)}
                </TableCell>
                <TableCell className="tabular-nums text-muted-foreground">
                  {formatNumber(user.lifetimePurchased)}
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatDate(user.created_at)}
                </TableCell>
                <TableCell>
                  {user.disabled ? (
                    <Badge variant="destructive">Disabled</Badge>
                  ) : (
                    <Badge variant="success">Active</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setAdjusting(user)}
                    >
                      <Coins />
                      Credits
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => toggleDisabled(user)}
                      aria-label={
                        user.disabled
                          ? `Enable ${user.email}`
                          : `Disable ${user.email}`
                      }
                    >
                      <Ban />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={adjusting !== null}
        onOpenChange={(open) => !open && setAdjusting(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust credits</DialogTitle>
            <DialogDescription>
              {adjusting?.email} currently has{" "}
              {formatNumber(adjusting?.balance ?? 0)} credits. Use a negative
              number to remove credits. A ledger entry is always written.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={adjustCredits} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                required
                placeholder="500 or -100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Reason</Label>
              <Input
                id="description"
                name="description"
                maxLength={200}
                placeholder="Support credit for failed order"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAdjusting(null)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={busy}>
                Apply adjustment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
