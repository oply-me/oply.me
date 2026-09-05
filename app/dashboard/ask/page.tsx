import { Suspense } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { AskOply } from "@/components/dashboard/ask-oply";
import { Skeleton } from "@/components/ui/skeleton";
import { toPublicTool } from "@/config/tools";
import { requireUser } from "@/lib/auth/guards";
import { getCreditSummary } from "@/lib/credits";
import { listTools } from "@/lib/tools/registry";

export default async function AskPage() {
  const user = await requireUser("/dashboard/ask");
  const [credits, tools] = await Promise.all([
    getCreditSummary(user.id),
    listTools(),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Ask Oply"
        description="Describe what you need in plain words. Oply picks the right tool and fills in what it can."
      />
      <Suspense fallback={<Skeleton className="h-48 w-full" />}>
        <AskOply tools={tools.map(toPublicTool)} balance={credits.balance} />
      </Suspense>
    </div>
  );
}
