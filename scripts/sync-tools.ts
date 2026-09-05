/**
 * Pushes config/tools.ts into the `tools` table.
 *
 * The file registry holds the defaults; the DB row is what admins edit at
 * runtime. Re-running this only fills in rows that do not exist yet and
 * refreshes fields admins do not own (name, prompt, schema, SEO copy) —
 * it never clobbers an admin's credit_cost / enabled / featured overrides.
 *
 *   npm run db:sync-tools
 */
import { createClient } from "@supabase/supabase-js";
import { tools } from "../config/tools";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the environment.",
  );
  process.exit(1);
}

const db = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

async function main() {
  const { data: cats, error: catErr } = await db
    .from("tool_categories")
    .select("id, slug");

  if (catErr) throw catErr;
  const categoryId = new Map((cats ?? []).map((c) => [c.slug, c.id]));

  const { data: existingRows } = await db.from("tools").select("slug");
  const existing = new Set((existingRows ?? []).map((r) => r.slug));

  for (const tool of tools) {
    const base = {
      slug: tool.slug,
      name: tool.name,
      tagline: tool.tagline,
      description: tool.description,
      category_id: categoryId.get(tool.category) ?? null,
      icon: tool.icon,
      system_prompt: tool.systemPrompt,
      component: tool.component,
      input_schema: tool.fields,
      output_type: tool.outputType,
      max_input_chars: tool.maxInputChars,
      seo_title: tool.seoTitle,
      seo_description: tool.seoDescription,
      new_until: tool.newUntil ?? null,
    };

    if (existing.has(tool.slug)) {
      // Refresh only the fields admins do not control.
      const { error } = await db.from("tools").update(base).eq("slug", tool.slug);
      if (error) throw error;
      console.log(`updated  ${tool.slug}`);
    } else {
      const { error } = await db.from("tools").insert({
        ...base,
        credit_cost: tool.creditCost,
        featured: tool.featured,
        enabled: tool.enabled,
        sort_order: tool.sortOrder,
      });
      if (error) throw error;
      console.log(`inserted ${tool.slug}`);
    }
  }

  console.log(`\nSynced ${tools.length} tools.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
