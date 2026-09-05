import { AdminToolsTable } from "@/components/admin/tools-table";
import { tools as registryTools } from "@/config/tools";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminToolsPage() {
  const db = createAdminClient();

  // Read through the service role so system prompts are visible here — the
  // anon role has no column grant for that field.
  const { data: rows } = await db
    .from("tools")
    .select(
      "id, slug, name, credit_cost, enabled, featured, sort_order, description, tagline, system_prompt, new_until",
    )
    .order("sort_order");

  const byslug = new Map((rows ?? []).map((r) => [r.slug, r]));

  // The file registry is the source of truth for which tools exist; DB rows
  // supply the admin-editable overrides where they have been synced.
  const merged = registryTools.map((tool) => {
    const row = byslug.get(tool.slug);
    return {
      slug: tool.slug,
      name: tool.name,
      category: tool.category,
      component: tool.component,
      synced: Boolean(row),
      creditCost: row?.credit_cost ?? tool.creditCost,
      enabled: row?.enabled ?? tool.enabled,
      featured: row?.featured ?? tool.featured,
      sortOrder: row?.sort_order ?? tool.sortOrder,
      description: row?.description ?? tool.description,
      systemPrompt: row?.system_prompt ?? tool.systemPrompt,
    };
  });

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="text-[1.5rem] font-semibold tracking-[-0.022em]">Tools</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Credit cost, availability and prompts. Changes take effect on the next
          generation and are written to the audit log.
        </p>
      </div>
      <AdminToolsTable tools={merged} />
    </div>
  );
}
