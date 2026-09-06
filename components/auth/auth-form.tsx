"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { siteConfig } from "@/config/site";

type Mode = "login" | "signup";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const fullName = String(form.get("fullName") ?? "").trim();

    const supabase = createClient();

    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName || null },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/dashboard/onboarding")}`,
          },
        });

        if (signUpError) {
          setError(friendlyAuthError(signUpError));
          return;
        }

        // With email confirmation enabled there is no session yet.
        if (!data.session) {
          setConfirmationSent(true);
          return;
        }

        toast.success(`Welcome to ${siteConfig.name}`);
        router.push("/dashboard/onboarding");
        router.refresh();
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(friendlyAuthError(signInError));
        return;
      }

      router.push(next);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmationSent) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <h1 className="text-lg font-semibold">Check your email</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          We sent you a confirmation link. Open it to finish creating your
          account.
        </p>
        <Button asChild variant="outline" className="mt-6 w-full">
          <Link href="/login">Back to log in</Link>
        </Button>
      </div>
    );
  }

  const isSignup = mode === "signup";

  return (
    <div>
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {isSignup ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isSignup
            ? `Start with ${siteConfig.signupBonusCredits} free credits. No card required.`
            : "Log in to your Oply workspace."}
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
        {isSignup && (
          <div className="space-y-2">
            <Label htmlFor="fullName">Name</Label>
            <Input
              id="fullName"
              name="fullName"
              autoComplete="name"
              placeholder="Alex Rivera"
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@company.com"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            {!isSignup && (
              <Link
                href="/forgot-password"
                className="text-[13px] text-muted-foreground hover:text-foreground"
              >
                Forgot?
              </Link>
            )}
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete={isSignup ? "new-password" : "current-password"}
            placeholder={isSignup ? "At least 8 characters" : "••••••••"}
          />
        </div>

        {error && (
          <p
            className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-[13px] text-destructive"
            role="alert"
          >
            {error}
          </p>
        )}

        <Button type="submit" loading={submitting} className="w-full" size="lg">
          {isSignup ? "Create account" : "Log in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {isSignup ? "Already have an account? " : "New to Oply? "}
        <Link
          href={isSignup ? "/login" : "/signup"}
          className="font-medium text-primary hover:underline"
        >
          {isSignup ? "Log in" : "Create one"}
        </Link>
      </p>

      {isSignup && (
        <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
          By creating an account you agree to our{" "}
          <Link href="/terms" className="underline underline-offset-2">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline underline-offset-2">
            Privacy Policy
          </Link>
          .
        </p>
      )}
    </div>
  );
}

/**
 * Provider messages are technical; these are the versions users see.
 *
 * Keyed primarily on `error.code` — the machine-readable `error_code` GoTrue
 * returns (e.g. "over_email_send_rate_limit") — because the human-readable
 * `message` varies in wording ("For security purposes, you can only request
 * this after 58 seconds" does not contain the word "rate limit") and previously
 * fell through to the generic fallback for real, common cases like resubmitting
 * within a minute of a first attempt.
 */
function friendlyAuthError(error: AuthError): string {
  const code = error.code;
  const m = error.message.toLowerCase();

  if (code === "invalid_credentials" || m.includes("invalid login credentials")) {
    return "That email and password don't match an account.";
  }
  if (
    code === "user_already_exists" ||
    code === "email_exists" ||
    code === "identity_already_exists" ||
    m.includes("already registered") ||
    m.includes("already been registered")
  ) {
    return "An account with that email already exists. Try logging in.";
  }
  if (code === "weak_password" || m.includes("password should be")) {
    return "Please use a password of at least 8 characters.";
  }
  if (code === "email_address_invalid" || code === "validation_failed") {
    return "Please enter a valid email address.";
  }
  if (code === "over_email_send_rate_limit" || code === "over_request_rate_limit" || m.includes("rate limit")) {
    return "Too many attempts. Please wait a minute and try again.";
  }
  if (code === "email_not_confirmed" || m.includes("email not confirmed")) {
    return "Please confirm your email address first — check your inbox.";
  }
  if (code === "signup_disabled" || code === "email_provider_disabled") {
    return "Sign-ups are temporarily unavailable. Please try again later.";
  }
  return "Something went wrong. Please try again.";
}
