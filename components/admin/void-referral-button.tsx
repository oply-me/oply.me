"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Voids a qualified referral: reverses the reward credits and returns the
 * referral to pending. Uses the same `reverse_referral_reward` path a refund
 * takes, so a voided referral and a refunded one leave the ledger in the same
 * shape.
 */
export function VoidReferralButton({
  referralId,
  referredId,
}: {
  referralId: string;
  referredId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/referrals/void", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referralId, referredId }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(payload.error ?? "Could not void this referral.");
        return;
      }

      toast.success(
        payload.reclaimed > 0
          ? `Voided — ${payload.reclaimed} credits reclaimed`
          : "Voided — no credits were left to reclaim",
      );
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Could not void this referral.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Void
      </Button>

      <Dialog open={open} onOpenChange={(next) => !busy && setOpen(next)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Void this referral?</DialogTitle>
            <DialogDescription>
              The reward credits are taken back from the referrer, and the
              referral returns to pending. If those credits have already been
              spent, the balance drops to zero rather than going negative.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={busy} onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" loading={busy} onClick={confirm}>
              Void referral
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
