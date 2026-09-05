"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface Values {
  signup_bonus_credits: number;
  low_credit_threshold: number;
  ai_rate_limit_per_min: number;
  support_email: string;
  maintenance_mode: boolean;
}

export function AdminSettingsForm({ values }: { values: Values }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [maintenance, setMaintenance] = useState(values.maintenance_mode);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signup_bonus_credits: Number(form.get("signup_bonus_credits")),
          low_credit_threshold: Number(form.get("low_credit_threshold")),
          ai_rate_limit_per_min: Number(form.get("ai_rate_limit_per_min")),
          support_email: String(form.get("support_email") ?? ""),
          maintenance_mode: maintenance,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error ?? "Could not save settings.");
        return;
      }

      toast.success("Settings saved");
      router.refresh();
    } catch {
      toast.error("Could not save settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="signup_bonus_credits">Signup bonus credits</Label>
          <Input
            id="signup_bonus_credits"
            name="signup_bonus_credits"
            type="number"
            min={0}
            defaultValue={values.signup_bonus_credits}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="low_credit_threshold">Low credit warning at</Label>
          <Input
            id="low_credit_threshold"
            name="low_credit_threshold"
            type="number"
            min={0}
            defaultValue={values.low_credit_threshold}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ai_rate_limit_per_min">AI requests per minute</Label>
          <Input
            id="ai_rate_limit_per_min"
            name="ai_rate_limit_per_min"
            type="number"
            min={1}
            defaultValue={values.ai_rate_limit_per_min}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="support_email">Support email</Label>
          <Input
            id="support_email"
            name="support_email"
            type="email"
            defaultValue={values.support_email}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
        <div>
          <p className="text-sm font-medium">Maintenance mode</p>
          <p className="text-xs text-muted-foreground">
            Flag for operational use. Enabling it does not disable generation on
            its own.
          </p>
        </div>
        <Switch
          checked={maintenance}
          onCheckedChange={setMaintenance}
          aria-label="Maintenance mode"
        />
      </div>

      <Button type="submit" loading={saving}>
        Save settings
      </Button>
    </form>
  );
}
