import Link from "next/link";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between px-6 py-5">
        <Link href="/" aria-label="Oply home">
          <Logo />
        </Link>
        <ThemeToggle />
      </header>
      <main
        id="main"
        className="flex flex-1 items-center justify-center px-6 py-10"
      >
        <div className="w-full max-w-[400px]">{children}</div>
      </main>
      <footer className="px-6 py-6 text-center text-xs text-muted-foreground">
        <Link href="/terms" className="hover:text-foreground">
          Terms
        </Link>
        <span className="mx-2">·</span>
        <Link href="/privacy" className="hover:text-foreground">
          Privacy
        </Link>
      </footer>
    </div>
  );
}
