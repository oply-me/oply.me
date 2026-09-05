import { PageHeader } from "@/components/dashboard/page-header";
import { ToolsExplorer } from "@/components/marketing/tools-explorer";
import { categories } from "@/config/categories";
import { toPublicTool } from "@/config/tools";
import { listTools } from "@/lib/tools/registry";

export default async function DashboardToolsPage() {
  const tools = await listTools();

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="All tools"
        description="Every Oply tool, filtered by what you're working on. Press ⌘K to search from anywhere."
      />
      <ToolsExplorer tools={tools.map(toPublicTool)} categories={categories} />
    </div>
  );
}
