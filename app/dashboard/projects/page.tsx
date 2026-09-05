import { FolderKanban } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ProjectsManager } from "@/components/dashboard/projects-manager";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export default async function ProjectsPage() {
  const user = await requireUser("/dashboard/projects");
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, description, created_at, project_items(count)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const rows = (projects ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    created_at: p.created_at,
    itemCount:
      (p.project_items as unknown as { count: number }[] | null)?.[0]?.count ?? 0,
  }));

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
