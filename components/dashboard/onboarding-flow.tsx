"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Compass,
  Megaphone,
  PenLine,
  Search,
  ShoppingBag,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "seo", label: "SEO", icon: Search },
  { value: "writing", label: "Writing", icon: PenLine },
  { value: "business", label: "Business", icon: Briefcase },
  { value: "marketing", label: "Marketing", icon: Megaphone },
  { value: "ecommerce", label: "E-commerce", icon: ShoppingBag },
  { value: "prompts", label: "AI prompts", icon: Wand2 },
  { value: "exploring", label: "Just exploring", icon: Compass },
];

export function OnboardingFlow({ name }: { name: string | null }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function finish(useCase: string | null) {
    setSaving(true);
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primary_use_case: useCase,
          onboarded: true,
        }),
      });
    } catch {
      // Onboarding is a preference, not a gate — never block on this.
    } finally {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-8">
      <h1 className="text-2xl font-semibold tracking-tight">
        Welcome to Oply{name ? `, ${name.split(" ")[0]}` : ""}.
      </h1>
      <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
        You have {siteConfig.signupBonusCredits} credits to start with. One
        question, then you&apos;re in.
      </p>

      <fieldset className="mt-8">
        <legend className="text-[15px] font-medium">
          What do you want to use Oply for?
        </legend>
        <p className="mt-1 text-[13px] text-muted-foreground">
          We use this to pick which tools to show you first. You can change it
          later in settings.
        </p>

        <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
          {OPTIONS.map((option) => {
            const active = selected === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelected(option.value)}
                aria-pressed={active}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "border-primary bg-primary/[0.06] text-foreground"
                    : "border-border hover:bg-accent",
                )}
              >
                <option.icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                  aria-hidden="true"
                />
                {option.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-8 flex items-center gap-3">
        <Button
          onClick={() => finish(selected)}
          disabled={!selected}
          loading={saving}
          size="lg"
          className="flex-1"
        >
          Continue
        </Button>
        <Button variant="ghost" onClick={() => finish(null)} disabled={saving}>
          Skip
        </Button>
      </div>
    </div>
  );
}
