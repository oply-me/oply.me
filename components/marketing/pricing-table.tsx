"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { pricingPlans } from "@/config/pricing";
import { formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function PricingTable({
  signedIn = false,
  paymentsConfigured = true,
}: {
  signedIn?: boolean;
  paymentsConfigured?: boolean;
}) {
  const router = useRouter();
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);

  async function selectPlan(planId: string) {
    if (!signedIn) {
      router.push(`/signup?next=${encodeURIComponent(`/pricing?plan=${planId}`)}`);
      return;
    }

    if (!paymentsConfigured) {
      toast.error("Checkout is not available yet", {
        description:
          "Crypto payments are not configured on this deployment. See the setup notes in README.md.",
      });
      return;
    }

    setPendingPlan(planId);
    try {
      const response = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Only the plan id is sent. Price and credits are resolved server-side.
        body: JSON.stringify({ planId }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error ?? "Could not start checkout. Please try again.");
        return;
      }

      router.push(`/checkout/${data.orderId}`);
    } catch {
      toast.error("Could not start checkout. Please try again.");
    } finally {
      setPendingPlan(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-4">
      {pricingPlans.map((plan) => (
        <div
          key={plan.id}
          className={cn(
            "relative flex flex-col rounded-xl border bg-card p-6 transition-shadow",
            plan.highlight
              ? "border-primary/50 shadow-md ring-1 ring-primary/20"
              : "border-border hover:shadow-sm",
          )}
        >
          {plan.badge && (
            <Badge className="absolute -top-2.5 left-6">{plan.badge}</Badge>
          )}

          <h3 className="text-[15px] font-semibold">{plan.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>

          <div className="mt-5 flex items-baseline gap-1.5">
            <span className="text-4xl font-semibold tracking-tight tabular-nums">
              ${plan.price}
            </span>
            <span className="text-sm text-muted-foreground">one-time</span>
          </div>
          <p className="mt-1.5 text-sm font-medium text-primary">
            {formatNumber(plan.credits)} credits
          </p>

          <Button
            className="mt-6"
            variant={plan.highlight ? "default" : "outline"}
            onClick={() => selectPlan(plan.id)}
            disabled={pendingPlan !== null}
          >
            {pendingPlan === plan.id ? (
              <>
                <Loader2 className="animate-spin" />
                Starting…
              </>
            ) : signedIn ? (
              "Buy Credits"
            ) : (
              "Get Started"
            )}
          </Button>

          <ul className="mt-6 space-y-2.5 border-t border-border pt-6">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm">
                <Check
                  className="mt-0.5 h-4 w-4 shrink-0 text-success"
                  aria-hidden="true"
                />
                <span className="text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
