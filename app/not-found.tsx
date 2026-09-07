import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <Link href="/" aria-label="Oply home">
        <Logo />
      </Link>
      <Image
        src="/illustrations/not-found.webp"
        alt=""
        width={168}
        height={168}
        /* Decorative: the heading below carries the meaning. */
        aria-hidden="true"
        className="mt-6 h-40 w-40 object-contain"
      />
      <p className="text-[13px] font-medium tabular-nums text-primary">404</p>
      <h1 className="mt-2 text-[1.75rem] font-semibold tracking-[-0.025em]">
        Looks like this tool doesn&apos;t exist.
      </h1>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted-foreground">
        The page you were after has moved or was never here. The tool library is
        a good place to pick up again.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/tools">Explore Tools</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    </main>
  );
}
