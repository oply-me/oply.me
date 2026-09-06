"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Stores the address, and says so. There is no mail provider wired up yet, so
 * the confirmation deliberately promises a future email rather than implying
 * an existing newsletter — a success state for something that does not happen
 * would be the dishonest version of this form.
 */
export function NewsletterForm() {
  const [status, setStatus] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = event.currentTarget;
    const email = String(new FormData(form).get("email") ?? "").trim();
    if (!email) return;

    setStatus("busy");
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload.error ?? "Could not save your address.");
        setStatus("idle");
        return;
      }

      form.reset();
      setStatus("done");
    } catch {
      setError("Could not save your address.");
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <p className="flex items-start gap-2 text-[13px] leading-relaxed text-muted-foreground">
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
        <span>
          Saved. We&apos;ll email you when there is something worth sending —
          there is no regular newsletter yet.
        </span>
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="mt-3">
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <div className="flex gap-2">
        <Input
          id="newsletter-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="h-9 max-w-[15rem]"
        />
        <Button type="submit" size="sm" disabled={status === "busy"}>
          {status === "busy" ? <Loader2 className="animate-spin" /> : null}
          Notify me
        </Button>
      </div>
      {error ? (
        <p className="mt-2 text-[12px] text-destructive" role="alert">
          {error}
        </p>
      ) : (
        <p className="mt-2 text-[11.5px] leading-relaxed text-muted-foreground">
          New tools and product updates. No regular newsletter is running yet —
          your address is only stored until there is.
        </p>
      )}
    </form>
  );
}
