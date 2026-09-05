import { Section, SectionHeading } from "@/components/marketing/section";

const STEPS = [
  {
    number: "01",
    title: "Choose a tool",
    body: "Pick from the tool library, or describe what you need and let Oply route it.",
  },
  {
    number: "02",
    title: "Enter your content",
    body: "Fill in a short form — topic, tone, keyword, or the text you want changed.",
  },
  {
    number: "03",
    title: "Generate with AI",
    body: "Oply runs the request and returns a result you can refine in place.",
  },
  {
    number: "04",
    title: "Copy, save or export",
    body: "Copy it out, save it to a project, or download it. Everything stays in your history.",
  },
];

export function HowItWorks() {
  return (
    <Section className="border-t border-border">
      <div className="container">
        <SectionHeading
          title="How Oply works"
          description="Four steps, the same for every tool in the library."
        />
        <ol className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <li key={step.number}>
              <div className="text-[13px] font-medium tabular-nums text-primary">
                {step.number}
              </div>
              <h3 className="mt-3 text-[15px] font-semibold">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
