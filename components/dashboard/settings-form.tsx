"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const USE_CASES = [
  { value: "seo", label: "SEO" },
  { value: "writing", label: "Writing" },
  { value: "business", label: "Business" },
  { value: "marketing", label: "Marketing" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "prompts", label: "AI prompts" },
  { value: "exploring", label: "Just exploring" },
];

export function SettingsForm({
  profile,
  email,
}: {
  profile: { full_name: string; avatar_url: string; primary_use_case: string };
  email: string;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [useCase, setUseCase] = useState(profile.primary_use_case || "exploring");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: String(form.get("full_name") ?? ""),
          avatar_url: String(form.get("avatar_url") ?? ""),
          primary_use_case: useCase,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error ?? "Could not save your profile.");
        return;
      }

      toast.success("Profile updated");
      router.refresh();
    } catch {
      toast.error("Could not save your profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="full_name">Name</Label>
        <Input
          id="full_name"
          name="full_name"
          defaultValue={profile.full_name}
          maxLength={120}
          placeholder="Alex Rivera"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="settings-email">Email</Label>
        <Input id="settings-email" value={email} disabled readOnly />
        <p className="text-xs text-muted-foreground">
          Contact support to change the email on your account.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="avatar_url">Avatar URL</Label>
        <Input
          id="avatar_url"
          name="avatar_url"
          type="url"
          defaultValue={profile.avatar_url}
          maxLength={500}
          placeholder="https://…"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="primary_use_case">Mainly using Oply for</Label>
        <Select value={useCase} onValueChange={setUseCase}>
          <SelectTrigger id="primary_use_case">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {USE_CASES.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Changes which tools are recommended on your dashboard.
        </p>
      </div>

      <Button type="submit" loading={saving}>
        Save changes
      </Button>
    </form>
  );
}
