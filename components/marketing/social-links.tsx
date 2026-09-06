import { Github, Linkedin } from "lucide-react";
import { siteConfig } from "@/config/site";

/** lucide has no X mark, so the glyph is inline. */
function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const ICONS = {
  x: XIcon,
  github: Github,
  linkedin: Linkedin,
} as const;

export function SocialLinks() {
  /* Widened from the `as const` literal so an empty list is a real case the
     compiler allows, not dead code. */
  const social: readonly { title: string; href: string; icon: string }[] =
    siteConfig.social;
  if (social.length === 0) return null;

  return (
    <ul className="mt-5 flex items-center gap-1">
      {social.map((item) => {
        const Icon = ICONS[item.icon as keyof typeof ICONS];
        if (!Icon) return null;
        return (
          <li key={item.href}>
            <a
              href={item.href}
              target="_blank"
              rel="me noopener noreferrer"
              aria-label={`Oply on ${item.title}`}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Icon className="h-4 w-4" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
