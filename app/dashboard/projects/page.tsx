import { FolderKanban } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ProjectsManager } from "@/components/dashboard/projects-manager";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export default async function ProjectsPage() {
  const user = await requireUser("/dashboard/projects");
  const supabase = await createClient();

  /*
   * The nested select pulls each filed generation's credit cost so the card
   * can show what a project actually cost, rather than only how many items
   * it holds. `project_items` has no credit column of its own — the number
   * lives on `ai_generations.credits_used` — so this is a join, not a
   * denormalised counter that could drift.
   */
  const { data: projects } = await supabase
    .from("projects")
    .select(
      "id, name, description, created_at, project_items(created_at, ai_generations(credits_used, tool_slug, created_at))",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const rows = (projects ?? []).map((p) => {
    const items = (p.project_items ?? []) as unknown as {
      created_at: string;
      ai_generations: {
        credits_used: number | null;
        tool_slug: string;
        created_at: string;
      } | null;
    }[];

    let creditsUsed = 0;
    let lastActivity: string | null = null;
    const toolSlugs = new Set<string>();

    for (const item of items) {
      const generation = item.ai_generations;
      if (generation) {
        creditsUsed += generation.credits_used ?? 0;
        toolSlugs.add(generation.tool_slug);
      }
      // When the item was filed, which is the project's own activity, not the
      // generation's original run time.
      if (!lastActivity || item.created_at > lastActivity) {
        lastActivity = item.created_at;
      }
    }

    return {
      id: p.id,
      name: p.name,
      description: p.description,
      created_at: p.created_at,
      itemCount: items.length,
      creditsUsed,
      toolCount: toolSlugs.size,
      lastActivity,
    };
  });

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Projects"
        description="Group saved results by client, site or store. Just enough structure to stay organised."
      />
      <ProjectsManager projects={rows} />
    </div>
  );
}
