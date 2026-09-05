import { cn } from "@/lib/utils";

/**
 * The Oply mark: an "O" cut by an ascending stroke — the "o" of Oply and a
 * sense of forward motion. Uses currentColor so it inverts cleanly between
 * light and dark without a second asset.
 */
export function OplyMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-hidden="true"
      className={cn("h-7 w-7", className)}
    >
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <circle
        cx="16"
        cy="16"
        r="7.25"
        stroke="hsl(var(--primary-foreground))"
        strokeWidth="2.75"
      />
      <path
        d="M16 16 L23.5 8.5"
        stroke="hsl(var(--primary-foreground))"
        strokeWidth="2.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({
  className,
  markClassName,
  showWordmark = true,
}: {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <OplyMark className={markClassName} />
      {showWordmark && (
        <span className="text-[17px] font-semibold tracking-tight text-foreground">
          Oply
        </span>
      )}
      <span className="sr-only">Oply — AI tools for getting things done</span>
    </span>
  );
}
