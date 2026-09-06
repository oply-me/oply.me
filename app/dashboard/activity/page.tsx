import { Activity } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { EmptyState } from "@/components/empty-state";
import { requireUser } from "@/lib/auth/guards";
import { ACTIVITY_PAGE_SIZE, getActivityPage } from "@/lib/dashboard/activity";
import { listTools } from "@/lib/tools/registry";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const user = await requireUser("/dashboard/activity");

  const [page, tools] = await Promise.all([
    getActivityPage(user.id, null, ACTIVITY_PAGE_SIZE),
    listTools(),
  ]);

  const toolMeta = Object.fromEntries(
    tools.map((t) => [t.slug, { icon: t.icon, category: t.category }]),
  );

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Activity"
        description="Everything that has happened on your account — generations, purchases, refunds and bonuses — newest first."
      />

      {page.items.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="Nothing has happened yet."
          description="Run a tool or buy a credit pack and every event will be recorded here in one timeline."
          action={{ label: "Browse tools", href: "/dashboard/tools" }}
        />
      ) : (
        <ActivityFeed
          initialItems={page.items}
          initialCursor={page.nextCursor}
          toolMeta={toolMeta}
        />
      )}
    </div>
  );
}
