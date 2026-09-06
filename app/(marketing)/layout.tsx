import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { getSessionUser } from "@/lib/auth/guards";
import { getToolsMenu } from "@/lib/tools/menu";
import { toSearchItem } from "@/lib/tools/search-item";
import { listTools } from "@/lib/tools/registry";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, allTools] = await Promise.all([getSessionUser(), listTools()]);
  const tools = allTools.map(toSearchItem);
  const menu = getToolsMenu();

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar signedIn={Boolean(user)} tools={tools} menu={menu} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
