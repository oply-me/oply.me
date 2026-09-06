import { Skeleton } from "@/components/ui/skeleton";

/** Matches ToolCard's layout, shown only during a category-pill transition. */
export function ToolCardSkeleton() {
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-11 w-11 rounded-xl" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-4 w-2/3" />
      <Skeleton className="mt-2.5 h-3.5 w-full" />
      <Skeleton className="mt-1.5 h-3.5 w-4/5" />
      <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}
