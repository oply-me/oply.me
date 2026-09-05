import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ToolIcon } from "@/components/icon";
import { Badge } from "@/components/ui/badge";
import { isNewTool, type PublicTool } from "@/config/tools";
import { cn } from "@/lib/utils";

export function ToolCard({
  tool,
  className,
}: {
  tool: PublicTool;
  className?: string;
}) {
  const isNew = isNewTool(tool as never);

  return (
    <Link
      href={`/tools/${tool.slug}`}
      className={cn(
        "group relative flex flex-col rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
          <ToolIcon name={tool.icon} />
        </div>
        {isNew && <Badge>New</Badge>}
      </div>

      <h3 className="mt-4 text-[15px] font-semibold tracking-tight">{tool.name}</h3>
      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">
        {tool.description}
      </p>

      <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
        <span className="text-xs text-muted-foreground">
          {tool.creditCost} credits
        </span>
        <span className="inline-flex items-center gap-1 text-[13px] font-medium text-primary">
          Open Tool
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
