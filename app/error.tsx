"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The digest is the only safe handle on the server-side error; the raw
    // message is never shown to the user.
    console.error("[app] unhandled error", { digest: error.digest });
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <Link href="/" aria-label="Oply home">
        <Logo />
      </Link>
      <h1 className="mt-10 text-[1.75rem] font-semibold tracking-[-0.025em]">
        Something went wrong.
      </h1>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted-foreground">
        The page didn&apos;t load properly. Trying again usually fixes it.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button size="lg" onClick={reset}>
          Try Again
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/">Go Home</Link>
        </Button>
      </div>
      {error.digest && (
        <p className="mt-8 font-mono text-xs text-muted-foreground">
          Reference: {error.digest}
        </p>
      )}
    </main>
  );
}
