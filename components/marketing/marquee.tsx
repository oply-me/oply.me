import Link from "next/link";
import { ToolIcon } from "@/components/icon";
import { categoryColors } from "@/config/categories";
import type { PublicTool } from "@/config/tools";
import { cn } from "@/lib/utils";

/**
 * An edge-to-edge scrolling band of tool pills.
 *
 * The track renders its children twice and translates by -50%, so the loop is
 * seamless. The duplicate is hidden from assistive tech and from the tab order
 * — every tool is still reachable once, and from the tool grid below.
 */
export function ToolMarquee({
  tools,
  className,
}: {
  tools: PublicTool[];
  className?: string;
}) {
  if (tools.length === 0) return null;

  return (
    <div
      className={cn(
        "group mask-fade-x relative overflow-hidden py-1",
        className,
      )}
      role="presentation"
    >
      {/* The animated element is the pair, so -50% lands on the seam. */}
      <div className="animate-marquee flex w-max group-hover:[animation-play-state:paused]">
        <Track tools={tools} />
        <Track tools={tools} duplicate />
      </div>
    </div>
  );
}

function Track({
  tools,
  duplicate = false,
}: {
  tools: PublicTool[];
  duplicate?: boolean;
}) {
  return (
    <ul
      className="flex shrink-0 items-center gap-3 pr-3"
      aria-hidden={duplicate || undefined}
    >
      {tools.map((tool) => {
        const c = categoryColors(tool.category);
        return (
          <li key={`${duplicate ? "dup-" : ""}${tool.slug}`}>
            <Link
              href={`/tools/${tool.slug}`}
              tabIndex={duplicate ? -1 : undefined}
              style={{ "--tile": c.tile, "--edge": c.edge } as React.CSSProperties}
              className="flex items-center gap-2.5 whitespace-nowrap rounded-full border border-border bg-card/80 py-2 pl-2 pr-4 text-[13px] font-medium shadow-sm backdrop-blur transition-colors hover:[border-color:var(--edge)]"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full text-white [background-image:var(--tile)]">
                <ToolIcon name={tool.icon} className="h-3.5 w-3.5" />
              </span>
              {tool.name}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
