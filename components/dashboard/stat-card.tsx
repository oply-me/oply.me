import type { LucideIcon } from "lucide-react";
import { AnimatedStat } from "@/components/animated-stat";
import { cn } from "@/lib/utils";

const VALUE_SIZE = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-3xl",
} as const;

/**
 * The dashboard's stat tile, shared by the overview, credits and billing
 * pages — they each hand-rolled the same card at three different type scales
 * before this existed.
 *
 * A numeric `value` counts up via `AnimatedStat`; the number itself is always
 * supplied by the caller from real account data.
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  emphasis = "default",
  size = "md",
  footer,
  children,
  className,
}: {
  label: string;
  /** Numbers count up. Strings render as-is (e.g. a plan name). */
  value?: number | string;
  icon?: LucideIcon;
  emphasis?: "default" | "warning";
  size?: keyof typeof VALUE_SIZE;
  footer?: React.ReactNode;
  /** Rendered in place of `value`, for cards holding a list. */
  children?: React.ReactNode;
  className?: string;
}) {
  const warn = emphasis === "warning";
  const valueClass = cn(
    "mt-2 block font-semibold",
    VALUE_SIZE[size],
    warn && "text-warning",
  );

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-5",
        warn ? "border-warning/40" : "border-border",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] text-muted-foreground">{label}</p>
        {Icon && (
          <Icon
            className={cn(
              "h-4 w-4 shrink-0",
              warn ? "text-warning" : "text-muted-foreground",
            )}
            aria-hidden="true"
          />
        )}
      </div>

      {typeof value === "number" ? (
        <AnimatedStat value={value} className={cn(valueClass, "tabular-nums")} />
      ) : typeof value === "string" ? (
        <p className={valueClass}>{value}</p>
      ) : null}

      {children}
      {footer && <div className="mt-4">{footer}</div>}
    </div>
  );
}
