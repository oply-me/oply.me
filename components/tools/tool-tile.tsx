import { ToolIcon } from "@/components/icon";
import { categoryColors } from "@/config/categories";
import { cn } from "@/lib/utils";

/**
 * The small gradient square that stands in for a tool in lists.
 *
 * Dashboard lists used to render a flat `bg-primary/10` chip, which meant the
 * same nine-category hue system that codes the marketing grid stopped at the
 * dashboard door. This is the shared version, tinted from
 * `categoryColors()` exactly like `ToolCard`'s icon tile.
 */
export function ToolTile({
  icon,
  category,
  className,
  iconClassName,
}: {
  icon: string;
  /** Category slug. Unknown slugs fall back to the brand hue. */
  category?: string;
  className?: string;
  iconClassName?: string;
}) {
  const c = categoryColors(category ?? "");

  return (
    <span
      aria-hidden="true"
      style={{ backgroundImage: c.tile } as React.CSSProperties}
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white shadow-sm",
        className,
      )}
    >
      <ToolIcon name={icon} className={cn("h-4 w-4", iconClassName)} />
    </span>
  );
}
