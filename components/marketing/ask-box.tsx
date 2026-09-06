"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const EXAMPLES = [
  "Rewrite this product description...",
  "Write a reply to a client asking about a deadline",
  "Create SEO metadata for a pricing page",
  "Summarize this article into bullet points",
];

/**
 * The central command box. Signed-out visitors are sent to sign up with the
 * request preserved, so nothing is lost between the homepage and the account.
 */
export function AskBox({
  signedIn = false,
  className,
  autoFocus = false,
}: {
  signedIn?: boolean;
  className?: string;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState("");
  /**
   * Picked after mount, not in the initialiser: this component is server
   * rendered, and `Math.random()` on both sides gave the server and the client
   * different placeholders, which failed hydration on the homepage hero.
   */
  const [placeholder, setPlaceholder] = useState(EXAMPLES[0]);
  useEffect(() => {
    setPlaceholder(EXAMPLES[Math.floor(Math.random() * EXAMPLES.length)]);
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    const target = q ? `/dashboard/ask?q=${encodeURIComponent(q)}` : "/dashboard/ask";
    router.push(
      signedIn ? target : `/signup?next=${encodeURIComponent(target)}`,
    );
  }

  return (
    <form
      onSubmit={submit}
      className={cn(
        "group relative rounded-2xl border border-border bg-card p-2 shadow-sm transition-shadow focus-within:border-primary/40 focus-within:shadow-lg",
        className,
      )}
    >
      <label htmlFor="ask-oply" className="sr-only">
        What do you want to do?
      </label>
      <div className="flex items-start gap-2 px-2 pb-1 pt-2">
        <Sparkles
          className="mt-2 h-4 w-4 shrink-0 text-primary"
          aria-hidden="true"
        />
        <textarea
          id="ask-oply"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus={autoFocus}
          rows={2}
          maxLength={2000}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit(e as unknown as React.FormEvent);
            }
          }}
          className="min-h-[52px] w-full resize-none border-0 bg-transparent p-1 text-[15px] leading-6 outline-none placeholder:text-muted-foreground"
        />
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-border px-3 pb-1 pt-2.5">
        <p className="text-xs text-muted-foreground">
          What do you want to do?
        </p>
        <Button type="submit" size="sm" className="gap-1.5">
          Ask Oply
          <ArrowUp className="h-3.5 w-3.5" />
        </Button>
      </div>
    </form>
  );
}
