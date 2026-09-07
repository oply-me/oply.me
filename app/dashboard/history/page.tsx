import { History } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { HistoryList } from "@/components/dashboard/history-list";
import { EmptyState } from "@/components/empty-state";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { listTools } from "@/lib/tools/registry";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ tool?: string }>;
}) {
  const params = await searchParams;
  const user = await requireUser("/dashboard/history");
  const supabase = await createClient();

  let query = supabase
    .from("ai_generations")
    .select(
      "id, tool_slug, tool_name, input_preview, output_text, output_json, credits_used, status, created_at",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (params.tool) query = query.eq("tool_slug", params.tool);

  const [{ data: generations }, tools, { data: favorites }] = await Promise.all([
    query,
    listTools(),
    supabase.from("favorites").select("generation_id").eq("user_id", user.id),
  ]);

  const favoriteIds = new Set((favorites ?? []).map((f) => f.generation_id));

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="History"
        description="Everything you've generated, newest first. Only you can see this."
      />

      {(generations ?? []).length === 0 ? (
        <EmptyState
          icon={History}
          title="No generations yet."
          description="Run any Oply tool and the result will appear here with its inputs, so you can find it again later."
          illustration="/illustrations/empty-history.webp"
          action={{ label: "Browse tools", href: "/dashboard/tools" }}
        />
      ) : (
        <HistoryList
          generations={generations ?? []}
          tools={tools.map((t) => ({
            slug: t.slug,
            name: t.name,
            icon: t.icon,
            category: t.category,
            tagline: t.tagline,
            creditCost: t.creditCost,
          }))}
          favoriteIds={[...favoriteIds]}
          activeTool={params.tool ?? null}
        />
      )}
    </div>
  );
}
