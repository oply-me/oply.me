import {
  Bookmark,
  Coins,
  FolderKanban,
  History,
  Moon,
  Search,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { Section, SectionHeading } from "@/components/marketing/section";
import { FooterCta } from "@/components/marketing/cta";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: "Features",
  description:
    "What you get with an Oply account: a shared credit balance, generation history, favorites, projects, dark mode and a growing library of AI tools.",
  path: "/features",
});

const FEATURES = [
  {
    icon: Sparkles,
    title: "A growing tool library",
    body: "Ten focused tools today, built on a registry designed for adding more without reshaping the product around them.",
  },
  {
    icon: Coins,
    title: "One shared balance",
    body: "Credits work in every tool. Nothing is locked behind a separate plan or add-on.",
  },
  {
    icon: History,
    title: "Full generation history",
    body: "Every result is kept with its inputs, so you can find what you made last week and reuse it.",
  },
  {
    icon: Bookmark,
    title: "Favorites",
    body: "Star the results worth keeping and pull them back up in a click.",
  },
  {
    icon: FolderKanban,
    title: "Lightweight projects",
    body: "Group work by client, site or store. Just enough structure to stay organised.",
  },
  {
    icon: Search,
    title: "Instant search",
    body: "Cmd+K from anywhere to jump straight to the tool you need.",
  },
  {
    icon: ShieldCheck,
    title: "Refunds on failure",
    body: "If a generation fails after credits are reserved, they are returned automatically.",
  },
  {
    icon: Moon,
    title: "Light, dark and system",
    body: "The whole interface follows your system preference, or whichever you pick.",
  },
  {
    icon: Zap,
    title: "No subscription",
    body: "Buy a pack when you need one. There is no renewal, and nothing to cancel.",
  },
];

export default function FeaturesPage() {
  return (
    <>
      <Section>
        <div className="container">
          <SectionHeading
            title="What you get with Oply"
            description="A calm workspace for small AI tools, with the account features that make them worth returning to."
          />

          <div className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div key={feature.title}>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <feature.icon className="h-4.5 w-4.5" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-[15px] font-semibold">{feature.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {feature.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <FooterCta secondary={{ label: "See pricing", href: "/pricing" }} />
    </>
  );
}
