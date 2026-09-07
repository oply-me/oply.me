import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { EmptyStateIcon } from "@/components/empty-state-icon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; href: string };
  /**
   * Optional illustration from `public/illustrations`. When present it
   * replaces the icon badge — the icon stays required so every empty state
   * still has a fallback if the asset is ever removed.
   */
  illustration?: string;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  illustration,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-16 text-center",
        className,
      )}
    >
      <EmptyStateIcon variant={illustration ? "illustration" : "icon"}>
        {illustration ? (
          <Image
            src={illustration}
            alt=""
            width={168}
            height={168}
            /* Decorative: the heading below carries the meaning. */
            aria-hidden="true"
            className="h-full w-full object-contain"
          />
        ) : (
          <Icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        )}
      </EmptyStateIcon>
      <h3 className="text-[15px] font-semibold">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      {action && (
        <Button asChild className="mt-6" size="sm">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      )}
    </div>
  );
}
