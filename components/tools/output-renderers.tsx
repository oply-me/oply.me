"use client";

import { useState } from "react";
import { AlertTriangle, Check, Download } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { Markdown } from "@/components/tools/markdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type {
  BlogOutlineOutput,
  ProductDescriptionOutput,
  PromptOptimizerOutput,
  ReplyOutput,
  SeoMetaOutput,
} from "@/lib/ai/schemas";

/* ------------------------------------------------------------------ */
/* Shared pieces                                                       */
/* ------------------------------------------------------------------ */

export function OutputField({
  label,
  value,
  /** When set, a character counter is shown against this target. */
  limit,
  mono,
}: {
  label: string;
  value: string;
  limit?: number;
  mono?: boolean;
}) {
  const length = value.length;
  const withinRange = limit ? length <= limit : true;

  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[13px] font-medium">{label}</span>
        <div className="flex items-center gap-2">
          {limit && (
            <span
              className={cn(
                "text-[11px] tabular-nums",
                withinRange ? "text-muted-foreground" : "text-warning",
              )}
            >
              {length} / {limit} characters
            </span>
          )}
          <CopyButton value={value} size="icon-sm" variant="ghost" />
        </div>
      </div>
      <p
        className={cn(
          "mt-2 text-sm leading-relaxed text-foreground",
          mono && "break-all font-mono text-[13px]",
        )}
      >
        {value}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Plain text / markdown                                               */
/* ------------------------------------------------------------------ */

export function TextOutput({ text }: { text: string }) {
  return <Markdown content={text} />;
}

/* ------------------------------------------------------------------ */
/* SEO Meta Generator                                                  */
/* ------------------------------------------------------------------ */

export function SeoOutput({ data }: { data: SeoMetaOutput }) {
  return (
    <div className="space-y-3">
      <OutputField label="SEO Title" value={data.seo_title} limit={60} />
      <OutputField label="Meta Description" value={data.meta_description} limit={160} />
      <OutputField label="Suggested slug" value={data.slug} mono />
      <OutputField label="Open Graph Title" value={data.og_title} limit={60} />
      <OutputField
        label="Open Graph Description"
        value={data.og_description}
        limit={110}
      />

      {/* A rough preview — search engines rewrite titles and descriptions
          often, so this is illustrative rather than a guarantee. */}
      <div className="rounded-lg border border-border bg-muted/40 p-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Approximate search preview
        </p>
        <p className="mt-2 truncate text-sm text-primary">{data.seo_title}</p>
        <p className="truncate text-xs text-success">
          example.com/{data.slug}
        </p>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {data.meta_description}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Schema Generator                                                    */
/* ------------------------------------------------------------------ */

export function SchemaOutput({ text }: { text: string }) {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  let formatted = cleaned;
  let valid = false;
  let parseError: string | null = null;

  try {
    formatted = JSON.stringify(JSON.parse(cleaned), null, 2);
    valid = true;
  } catch (err) {
    parseError = err instanceof Error ? err.message : "Could not parse JSON.";
  }

  function download() {
    const blob = new Blob([formatted], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "schema.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {valid ? (
          <Badge variant="success">
            <Check className="h-3 w-3" />
            Valid JSON
          </Badge>
        ) : (
          <Badge variant="warning">
            <AlertTriangle className="h-3 w-3" />
            Could not parse
          </Badge>
        )}
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={download}>
            <Download />
            Download
          </Button>
          <CopyButton value={formatted} label="Copy JSON-LD" />
        </div>
      </div>

      {parseError && (
        <p className="text-xs text-muted-foreground">{parseError}</p>
      )}

      <pre className="scroll-area max-h-[480px] overflow-auto rounded-lg border border-border bg-muted/40 p-4 font-mono text-[12.5px] leading-relaxed">
        <code>{formatted}</code>
      </pre>

      <p className="text-xs text-muted-foreground">
        Structure is checked for valid JSON only. Validate with Google&apos;s Rich
        Results Test before publishing — generating JSON-LD does not by itself
        make a page eligible for rich results.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Product Description Generator                                       */
/* ------------------------------------------------------------------ */

export function ProductOutput({ data }: { data: ProductDescriptionOutput }) {
  const bullets = data.bullet_points.map((b) => `• ${b}`).join("\n");

  return (
    <div className="space-y-3">
      <OutputField label="Short description" value={data.short_description} />

      <div className="rounded-lg border border-border bg-background p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[13px] font-medium">Long description</span>
          <CopyButton value={data.long_description} size="icon-sm" variant="ghost" />
        </div>
        <div className="mt-2">
          <Markdown content={data.long_description} />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-background p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[13px] font-medium">Bullet points</span>
          <CopyButton value={bullets} size="icon-sm" variant="ghost" />
        </div>
        <ul className="mt-2 space-y-1.5">
          {data.bullet_points.map((point, i) => (
            <li key={i} className="flex gap-2 text-sm text-foreground">
              <span className="text-primary" aria-hidden="true">
                •
              </span>
              {point}
            </li>
          ))}
        </ul>
      </div>

      <OutputField label="SEO title" value={data.seo_title} limit={60} />
      <OutputField label="Meta description" value={data.meta_description} limit={160} />

      <div className="rounded-lg border border-border bg-background p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[13px] font-medium">Product tags</span>
          <CopyButton value={data.tags.join(", ")} size="icon-sm" variant="ghost" />
        </div>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {data.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      <OutputField label="Call to action" value={data.cta} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Blog Outline Generator                                              */
/* ------------------------------------------------------------------ */

export function OutlineOutput({ data }: { data: BlogOutlineOutput }) {
  const plainText = [
    `# ${data.h1}`,
    "",
    `Introduction: ${data.introduction_idea}`,
    "",
    ...data.sections.flatMap((section) => [
      `## ${section.h2}`,
      ...section.key_points.map((p) => `- ${p}`),
      ...section.subsections.map((s) => `### ${s}`),
      "",
    ]),
    `Conclusion: ${data.conclusion}`,
    "",
    "FAQ ideas:",
    ...data.faq_ideas.map((q) => `- ${q}`),
  ].join("\n");

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CopyButton value={plainText} label="Copy outline" />
      </div>

      <div className="rounded-lg border border-border bg-background p-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          H1
        </p>
        <p className="mt-1.5 text-base font-semibold">{data.h1}</p>
      </div>

      <div className="rounded-lg border border-border bg-background p-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Introduction angle
        </p>
        <p className="mt-1.5 text-sm leading-relaxed">{data.introduction_idea}</p>
      </div>

      <ol className="space-y-3">
        {data.sections.map((section, i) => (
          <li
            key={i}
            className="rounded-lg border border-border bg-background p-4"
          >
            <p className="text-[13px] font-semibold">
              <span className="mr-2 text-muted-foreground tabular-nums">
                H2 · {i + 1}
              </span>
              {section.h2}
            </p>
            {section.key_points.length > 0 && (
              <ul className="mt-2.5 space-y-1">
                {section.key_points.map((point, j) => (
                  <li key={j} className="flex gap-2 text-sm text-muted-foreground">
                    <span aria-hidden="true">•</span>
                    {point}
                  </li>
                ))}
              </ul>
            )}
            {section.subsections.length > 0 && (
              <div className="mt-3 space-y-1 border-l-2 border-border pl-3">
                {section.subsections.map((sub, j) => (
                  <p key={j} className="text-[13px] text-muted-foreground">
                    <span className="mr-1.5 text-[11px] uppercase">H3</span>
                    {sub}
                  </p>
                ))}
              </div>
            )}
          </li>
        ))}
      </ol>

      <div className="rounded-lg border border-border bg-background p-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Conclusion
        </p>
        <p className="mt-1.5 text-sm leading-relaxed">{data.conclusion}</p>
      </div>

      <div className="rounded-lg border border-border bg-background p-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          FAQ ideas
        </p>
        <ul className="mt-2 space-y-1.5">
          {data.faq_ideas.map((q, i) => (
            <li key={i} className="text-sm text-muted-foreground">
              {q}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Prompt Optimizer                                                    */
/* ------------------------------------------------------------------ */

export function PromptOptimizerOutputView({
  data,
  original,
}: {
  data: PromptOptimizerOutput;
  original: string;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-primary/30 bg-primary/[0.04] p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[13px] font-medium">Optimized prompt</span>
          <CopyButton value={data.optimized_prompt} label="Copy prompt" />
        </div>
        <pre className="scroll-area mt-3 max-h-96 overflow-auto whitespace-pre-wrap font-sans text-sm leading-relaxed">
          {data.optimized_prompt}
        </pre>
      </div>

      <div className="rounded-lg border border-border bg-background p-4">
        <p className="text-[13px] font-medium">What changed</p>
        <ul className="mt-3 space-y-2.5">
          {data.improvements.map((item, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <Badge variant="outline" className="mt-0.5 shrink-0">
                {item.area}
              </Badge>
              <span className="text-muted-foreground">{item.change}</span>
            </li>
          ))}
        </ul>
      </div>

      {original && (
        <details className="rounded-lg border border-border bg-muted/30 p-4">
          <summary className="cursor-pointer text-[13px] font-medium">
            Show original prompt
          </summary>
          <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-muted-foreground">
            {original}
          </pre>
        </details>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Reply Generator                                                     */
/* ------------------------------------------------------------------ */

export function ReplyOutputView({ data }: { data: ReplyOutput }) {
  const [tab, setTab] = useState("standard");
  const current = data[tab as keyof ReplyOutput] ?? data.standard;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="short">Short</TabsTrigger>
            <TabsTrigger value="standard">Standard</TabsTrigger>
            <TabsTrigger value="detailed">Detailed</TabsTrigger>
          </TabsList>
          <TabsContent value="short" />
          <TabsContent value="standard" />
          <TabsContent value="detailed" />
        </Tabs>
        <CopyButton value={current} label="Copy reply" />
      </div>

      <div className="rounded-lg border border-border bg-background p-4">
        <pre className="whitespace-pre-wrap font-sans text-[15px] leading-relaxed">
          {current}
        </pre>
      </div>
    </div>
  );
}
