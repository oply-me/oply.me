"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Check, CreditCard, Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { pricingPlans } from "@/config/pricing";
import { formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";

type PaymentMethod = "card" | "crypto";

export function PricingTable({
  signedIn = false,
  cardConfigured = true,
  cryptoConfigured = true,
}: {
  signedIn?: boolean;
  cardConfigured?: boolean;
  cryptoConfigured?: boolean;
}) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);
  // Card first when both are available — lower friction for most buyers.
  const [method, setMethod] = useState<PaymentMethod>(
    cardConfigured ? "card" : "crypto",
  );

  const bothAvailable = cardConfigured && cryptoConfigured;
  const paymentsConfigured = cardConfigured || cryptoConfigured;

  async function selectPlan(planId: string) {
    if (!signedIn) {
      router.push(`/signup?next=${encodeURIComponent(`/pricing?plan=${planId}`)}`);
      return;
    }

    if (!paymentsConfigured) {
      toast.error("Checkout is not available yet", {
        description:
          "No payment method is configured on this deployment. See the setup notes in README.md.",
      });
      return;
    }

    setPendingPlan(planId);
    try {
      const response = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Only the plan id and chosen method are sent. Price and credits are
        // resolved server-side.
        body: JSON.stringify({ planId, method }),
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
    <div>
      {bothAvailable && (
        <div className="mx-auto mb-8 flex w-fit items-center gap-1 rounded-full border border-border bg-muted/40 p-1 text-[13px] font-medium">
          <button
            type="button"
            onClick={() => setMethod("card")}
            aria-pressed={method === "card"}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-4 py-1.5 transition-colors",
              method === "card"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <CreditCard className="h-3.5 w-3.5" aria-hidden="true" />
            Card
          </button>
          <button
            type="button"
            onClick={() => setMethod("crypto")}
            aria-pressed={method === "crypto"}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-4 py-1.5 transition-colors",
              method === "crypto"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Wallet className="h-3.5 w-3.5" aria-hidden="true" />
            Crypto
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-4">
        {pricingPlans.map((plan) => (
          /* The card is not itself clickable — its CTA is — so it lifts on
             hover like ToolCard but takes no whileTap. */
          <motion.div
            key={plan.id}
            whileHover={reduceMotion ? {} : { y: -4 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
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
          </motion.div>
        ))}
      </div>
    </div>
  );
}
