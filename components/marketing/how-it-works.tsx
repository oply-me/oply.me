import { MousePointerClick, PenLine, Sparkles, Download } from "lucide-react";
import { SoftBackdrop } from "@/components/marketing/backdrop";
import { Section, SectionHeading } from "@/components/marketing/section";

const STEPS = [
  {
    number: "01",
    icon: MousePointerClick,
    title: "Choose a tool",
    body: "Pick from the tool library, or describe what you need and let Oply route it.",
  },
  {
    number: "02",
    icon: PenLine,
    title: "Enter your content",
    body: "Fill in a short form — topic, tone, keyword, or the text you want changed.",
  },
  {
    number: "03",
    icon: Sparkles,
    title: "Generate with AI",
    body: "Oply runs the request and returns a result you can refine in place.",
  },
  {
    number: "04",
    icon: Download,
    title: "Copy, save or export",
    body: "Copy it out, save it to a project, or download it. Everything stays in your history.",
  },
];

/** Hue per step, walking the brand wheel from violet to cyan. */
const STEP_HUES = [258, 288, 322, 194];

export function HowItWorks() {
  return (
    <Section className="relative isolate overflow-hidden border-t border-border">
      <SoftBackdrop />
      <div className="container relative">
        <SectionHeading
          eyebrow="How it works"
          title="Four steps, the same for every tool"
          description="No setup, no prompt engineering, no per-tool learning curve."
        />

        <ol className="relative mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* The line the steps sit on — desktop only. */}
          <div
            className="pointer-events-none absolute inset-x-0 top-7 hidden h-px bg-gradient-to-r from-brand/0 via-brand/50 to-brand-3/0 lg:block"
            aria-hidden="true"
          />

          {STEPS.map((step, i) => {
            const hue = STEP_HUES[i];
            return (
              <li
                key={step.number}
                className="relative"
                style={
                  {
                    "--tile": `linear-gradient(135deg, hsl(${hue} 88% 60%), hsl(${hue + 34} 86% 56%))`,
                    "--solid": `hsl(${hue} 82% 52%)`,
                  } as React.CSSProperties
                }
              >
                <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-brand [background-image:var(--tile)]">
                  <step.icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <p className="mt-5 text-[13px] font-semibold tabular-nums [color:var(--solid)]">
                  {step.number}
                </p>
                <h3 className="mt-1 text-[15px] font-semibold">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </Section>
  );
}
