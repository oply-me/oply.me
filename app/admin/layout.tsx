import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { requireAdmin } from "@/lib/auth/guards";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({ title: "Admin", noIndex: true });

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side role check on every admin page render. Admin API routes do
  // their own independent check — neither relies on the other.
  const user = await requireAdmin();

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/admin" aria-label="Oply admin">
              <Logo />
            </Link>
            <Badge variant="outline">Admin</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {user.email}
            </span>
            <ThemeToggle />
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard">Exit admin</Link>
            </Button>
          </div>
        </div>
        <AdminNav />
      </header>

      <main id="main" className="px-4 py-6 sm:px-6 lg:py-8">
        {children}
      </main>
    </div>
  );
}
