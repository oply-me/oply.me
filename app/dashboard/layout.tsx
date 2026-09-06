import { Sidebar } from "@/components/dashboard/sidebar";
import { AnnouncementBanner } from "@/components/dashboard/announcement-banner";
import { ToolSearch } from "@/components/tool-search";
import { requireUser } from "@/lib/auth/guards";
import { getCreditSummary } from "@/lib/credits";
import { getNotifications } from "@/lib/dashboard/notifications";
import { listTools } from "@/lib/tools/registry";
import { toSearchItem } from "@/lib/tools/search-item";
import { createClient } from "@/lib/supabase/server";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({ title: "Dashboard", noIndex: true });

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser("/dashboard");
  const supabase = await createClient();

  const [credits, tools, announcementResult] = await Promise.all([
    getCreditSummary(user.id),
    listTools(),
    supabase
      .from("announcements")
      .select("id, title, message, link_url, link_label")
      .order("starts_at", { ascending: false })
      .limit(1),
  ]);

  const announcement = announcementResult.data?.[0] ?? null;

  // Needs the balance, so it cannot join the Promise.all above.
  const notifications = await getNotifications(
    user.id,
    credits.balance,
    user.profile?.notifications_seen_at ?? null,
  );

  return (
    <div className="min-h-dvh bg-background">
      <Sidebar
        user={{
          name: user.profile?.full_name ?? null,
          email: user.email,
          avatarUrl: user.profile?.avatar_url ?? null,
          isAdmin: user.profile?.role === "admin",
        }}
        balance={credits.balance}
        notifications={notifications.items}
        unreadCount={notifications.unreadCount}
      />

      <div className="lg:pl-[260px]">
        <main id="main" className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {announcement && <AnnouncementBanner announcement={announcement} />}
          {children}
        </main>
      </div>

      {/* Mounted globally so Cmd/Ctrl+K works from any dashboard page. */}
      <ToolSearch tools={tools.map(toSearchItem)} trigger="hidden" />
    </div>
  );
}
