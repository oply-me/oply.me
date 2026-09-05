"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Megaphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Announcement {
  id: string;
  title: string;
  message: string;
  link_url: string | null;
  link_label: string | null;
}

const STORAGE_PREFIX = "oply:announcement:";

export function AnnouncementBanner({
  announcement,
}: {
  announcement: Announcement;
}) {
  const [dismissed, setDismissed] = useState(true);

  // Dismissal is a per-browser convenience, so it lives in localStorage.
  // Rendering starts hidden to avoid a flash before the check runs.
  useEffect(() => {
    try {
      setDismissed(
        localStorage.getItem(`${STORAGE_PREFIX}${announcement.id}`) === "1",
      );
    } catch {
      setDismissed(false);
    }
  }, [announcement.id]);

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${announcement.id}`, "1");
    } catch {
      // Private mode or blocked storage — the banner just returns next load.
    }
  }

  if (dismissed) return null;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-primary/25 bg-primary/[0.05] px-4 py-3">
      <Megaphone className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium">{announcement.title}</p>
        <p className="text-[13px] text-muted-foreground">{announcement.message}</p>
      </div>
      {announcement.link_url && (
        <Button asChild size="sm" variant="outline">
          <Link href={announcement.link_url}>
            {announcement.link_label ?? "Learn more"}
          </Link>
        </Button>
      )}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss announcement"
        className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
