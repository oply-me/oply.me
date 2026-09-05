import { cn } from "@/lib/utils";

/**
 * Decorative background layers.
 *
 * All of them are purely presentational: absolutely positioned, pointer-events
 * disabled and hidden from assistive tech. They stack over the page background
 * rather than replacing it, so a section keeps working if one is removed.
 */

export function HeroBackdrop({ className }: { className?: string }) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden="true"
    >
      <div className="bg-aurora absolute inset-0" />
      <div className="bg-grid mask-radial absolute inset-0 opacity-60" />

      {/* Colour blooms. They drift slowly; reduced-motion freezes them. */}
      <div className="animate-float absolute -left-32 -top-40 h-[30rem] w-[30rem] rounded-full bg-brand/25 blur-[110px]" />
      <div className="animate-float-slow absolute -right-40 -top-28 h-[26rem] w-[26rem] rounded-full bg-brand-2/25 blur-[110px]" />
      <div className="animate-float absolute -bottom-56 left-1/3 h-[32rem] w-[32rem] rounded-full bg-brand-3/20 blur-[120px]" />

      {/* Brand hairline closing the section. */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand/60 to-transparent" />
    </div>
  );
}

export function SoftBackdrop({
  className,
  dots = false,
}: {
  className?: string;
  dots?: boolean;
}) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden="true"
    >
      <div className="bg-aurora-soft absolute inset-0" />
      {dots && <div className="bg-dots mask-fade-b absolute inset-0 opacity-50" />}
    </div>
  );
}

/**
 * A slowly rotating conic ring. Used as the graphic anchor of the credits
 * section, where a plain card would read as filler.
 */
export function OrbitRing({ className }: { className?: string }) {
  return (
    <div
      className={cn("pointer-events-none absolute", className)}
      aria-hidden="true"
    >
      <div className="animate-spin-slow h-full w-full rounded-full [background:conic-gradient(from_0deg,hsl(var(--brand)/0.35),hsl(var(--brand-2)/0.3),hsl(var(--brand-3)/0.35),hsl(var(--brand)/0.35))] [mask:radial-gradient(farthest-side,transparent_calc(100%-2px),#000_calc(100%-1px))]" />
    </div>
  );
}
