import { Star } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { FavoritesList } from "@/components/dashboard/favorites-list";
import { EmptyState } from "@/components/empty-state";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { listTools } from "@/lib/tools/registry";

export default async function FavoritesPage() {
  const user = await requireUser("/dashboard/favorites");
  const supabase = await createClient();

  const [{ data: favorites }, tools] = await Promise.all([
    supabase
      .from("favorites")
      .select(
        "id, created_at, generation_id, ai_generations(id, tool_slug, tool_name, input_preview, output_text, output_json, credits_used, created_at)",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100),
    listTools(),
  ]);

  const items = (favorites ?? [])
    .map((row) => {
      const g = row.ai_generations as unknown as {
        id: string;
        tool_slug: string;
        tool_name: string;
        input_preview: string | null;
        output_text: string | null;
        output_json: unknown;
        created_at: string;
      } | null;
      if (!g) return null;
      return { favoriteId: row.id, generation: g };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Favorites"
        description="Results you've saved. Everything here stays until you remove it."
      />

      {items.length === 0 ? (
        <EmptyState
          icon={Star}
          title="No saved results yet."
          description="Star a result from any tool or from your history and it will be waiting here."
          action={{ label: "Browse tools", href: "/dashboard/tools" }}
        />
      ) : (
        <FavoritesList
          items={items}
          tools={tools.map((t) => ({ slug: t.slug, icon: t.icon }))}
        />
      )}
    </div>
  );
}
