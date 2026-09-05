import { cn } from "@/lib/utils";

export function Section({
  className,
  children,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section className={cn("py-16 sm:py-20 lg:py-24", className)} {...props}>
      {children}
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex max-w-2xl flex-col",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow && (
        <p
          className={cn(
            "inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-[12px] font-semibold uppercase tracking-wider text-primary shadow-sm backdrop-blur",
            align === "center" && "mx-auto",
          )}
        >
          <span
            className="h-1.5 w-1.5 rounded-full bg-brand-panel"
            aria-hidden="true"
          />
          {eyebrow}
        </p>
      )}
      <h2 className="text-balance mt-4 text-[1.875rem] first:mt-0 font-semibold tracking-[-0.03em] sm:text-[2.25rem]">
        {title}
      </h2>
      {description && (
        <p className="text-pretty mt-3 text-[15px] leading-relaxed text-muted-foreground sm:text-base">
          {description}
        </p>
      )}
    </div>
  );
}
