import { siteConfig } from "./site";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

/**
 * "image" fields hold an object-storage path string (e.g.
 * "{userId}/uploads/{file}"), not a file or base64 bytes — the browser
 * uploads directly to Supabase Storage first (see ImageFieldInput), and only
 * the resulting path travels through the generate request.
 */
export type FieldType = "text" | "textarea" | "select" | "number" | "image";

export interface ToolField {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  /** Only for type: "select". */
  options?: { label: string; value: string }[];
  defaultValue?: string;
  maxLength?: number;
  rows?: number;
  /** Show this field only when another field holds one of these values. */
  showWhen?: { field: string; equals: string[] };
}

/**
 * Which reusable workspace template renders the tool. Adding a tool that fits
 * one of these needs no new React code — only a registry entry.
 */
export type ToolComponent =
  | "standard-text"
  | "long-form"
  | "reply"
  | "prompt"
  | "seo-generator"
  | "schema-generator"
  | "structured-output"
  | "image-generator";

export type OutputType = "text" | "markdown" | "json" | "structured" | "image";

/** Keys into lib/ai/schemas.ts. Server-side only concern. */
export type OutputSchemaKey =
  | "seoMeta"
  | "productDescription"
  | "blogOutline"
  | "promptOptimizer"
  | "reply";

export interface ToolFaq {
  question: string;
  answer: string;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Maps a tool's own field values to the exact pixel size the generate route
 * should produce — the route looks up `sizes[normalized[sizeField]]`, so the
 * size is always one of a fixed, server-known set, never a client-supplied
 * number. `sizes`' keys must match `sizeField`'s select `options[].value`
 * exactly (checked in tests/image-tools.test.ts).
 */
export interface ImageOutputSpec {
  /** Used when there is no `sizeField`, and as the fallback for an unrecognised value. */
  defaultSize: ImageDimensions;
  /** A select field whose value picks the exact pixel size, for tools that offer more than one. */
  sizeField?: string;
  sizes?: Record<string, ImageDimensions>;
  /** Name of the "image" field holding the source to edit — absent for pure generation. */
  inputImageField?: string;
  /** Fixed alpha-channel mode, for tools with no user-facing background choice. */
  background?: "transparent" | "opaque" | "auto";
  /**
   * A select field whose value picks the real PNG alpha-channel mode —
   * distinct from a tool's own "background" *content* field (e.g. Product
   * Photo's "Studio White" vs "Lifestyle Scene" backdrop, which is prompt
   * text, not this). Takes priority over the fixed `background` above.
   */
  backgroundField?: string;
  backgroundValues?: Record<string, "transparent" | "opaque" | "auto">;
  /**
   * Skip cropping to the exact requested size and keep whatever the provider
   * natively returned — for edits (e.g. background removal) where cropping
   * to a fixed size could cut off part of the subject.
   */
  skipExactFit?: boolean;
}

/**
 * The dominant search intent of a tool's landing page. `commercial` means
 * someone is comparing tools before picking one; `informational` means they
 * are still learning the concept. It decides whether the page leads with what
 * the tool *is* or with what it *does for you*.
 */
export type SearchIntent = "informational" | "commercial" | "transactional";

/**
 * The semantic keyword map for a tool. Public data: it ships to the browser,
 * powers metadata, JSON-LD and site search, and is never used to stuff copy.
 *
 * The five layers are different things and must not be collapsed into one
 * flat array — `entities` are concepts a crawler expects to co-occur, not
 * queries anyone types, and `questions` must each have a real answer in `faq`.
 */
export interface ToolKeywords {
  /** The one head term this page should own. Unique across the registry. */
  primary: string;
  /** Same intent, different words. 6-10. */
  secondary: string[];
  /** 4+ word intent-loaded phrases. 8-14. */
  longTail: string[];
  /** Concepts the page should co-occur with. 8-15. */
  entities: string[];
  /** Real questions, phrased as questions. 4-8. Should align with `faq`. */
  questions: string[];
  intent: SearchIntent;
}

export interface ToolDefinition {
  slug: string;
  name: string;
  /** One-line hero subheading. */
  tagline: string;
  /** Card + meta description length copy. */
  description: string;
  category: string;
  /** lucide-react icon name. */
  icon: string;
  creditCost: number;
  component: ToolComponent;
  outputType: OutputType;
  outputSchema?: OutputSchemaKey;
  /**
   * Required when outputType is "image". Server-authoritative: the size
   * actually produced is looked up from the validated value of `sizeField`
   * (a select field), never taken directly from the client.
   */
  imageOutput?: ImageOutputSpec;
  /** Server-only. Never sent to the browser. */
  systemPrompt: string;
  fields: ToolField[];
  maxInputChars: number;
  /** Result post-actions beyond copy/save/regenerate. */
  extraActions?: ("shorten" | "expand" | "improve" | "download")[];
  seoTitle: string;
  seoDescription: string;
  featured: boolean;
  sortOrder: number;
  enabled: boolean;
  /** ISO date; a "New" badge shows until then. */
  newUntil?: string;
  related: string[];
  /** Required: a tool cannot ship without its semantic keyword map. */
  keywords: ToolKeywords;
  benefits: { title: string; body: string }[];
  howItWorks: string[];
  /**
   * `before` is optional — most tools' idle/preview panels fall back to the
   * first required field's placeholder as the synthetic "before" state (see
   * ToolCardPreview/ToolExampleToggle), so authoring it here is only worth
   * doing where it genuinely clarifies the transform.
   */
  example: { label: string; value: string; before?: string };
  faq: ToolFaq[];
}

/* ------------------------------------------------------------------ */
/* Shared option sets                                                  */
/* ------------------------------------------------------------------ */

const TONE_OPTIONS = [
  { label: "Professional", value: "professional" },
  { label: "Friendly", value: "friendly" },
  { label: "Casual", value: "casual" },
  { label: "Persuasive", value: "persuasive" },
  { label: "Creative", value: "creative" },
  { label: "Technical", value: "technical" },
];

const LENGTH_OPTIONS = [
  { label: "Short", value: "short" },
  { label: "Medium", value: "medium" },
  { label: "Long", value: "long" },
];

/** Appended to every system prompt so output stays clean and honest. */
export const GLOBAL_SYSTEM_RULES = `
You are a tool inside ${siteConfig.name}, a suite of focused AI utilities.

Rules that apply to every response:
- Return only the requested output. No preamble, no "Here is...", no sign-off.
- Never wrap the whole response in a markdown code fence unless the output is code or JSON.
- Do not invent facts, statistics, prices, dates, awards or testimonials that were not supplied.
- Do not make guarantees about search rankings, sales or results.
- Match the language of the user's input.
- If the input is too vague to work with, produce the best reasonable draft anyway and keep it generic rather than inventing specifics.
`.trim();

/* ------------------------------------------------------------------ */
/* The registry                                                        */
/* ------------------------------------------------------------------ */

export const tools: ToolDefinition[] = [
  /* ---------------------------------------------------------------- */
  {
    slug: "ai-writer",
    name: "AI Writer",
    tagline: "Create high-quality content with AI in seconds.",
    description:
      "Turn a topic and a few notes into a finished piece of writing you can edit and publish.",
    category: "ai",
    icon: "PenLine",
    creditCost: 20,
    component: "long-form",
    outputType: "markdown",
    maxInputChars: siteConfig.longFormMaxInputChars,
    extraActions: ["shorten", "expand", "improve"],
    systemPrompt: `You write clear, useful long-form content.

Write about the given topic for the given audience, in the requested tone and length.

Structure:
- Open with a specific, concrete first sentence. Never open with "In today's fast-paced world" or similar filler.
- Use markdown headings (##) when the piece is long enough to need them.
- Keep paragraphs to 2-4 sentences.
- Prefer concrete detail over adjectives.
- End when the point is made. Do not add a summary section unless the length calls for it.

Length guide: short = roughly 200-300 words, medium = roughly 500-700 words, long = roughly 1000-1400 words.`,
    fields: [
      {
        name: "topic",
        label: "Topic",
        type: "textarea",
        rows: 3,
        required: true,
        placeholder: "Write a product launch announcement for a SaaS company.",
        maxLength: 2000,
        helpText: "What should the piece be about?",
      },
      {
        name: "audience",
        label: "Audience",
        type: "text",
        placeholder: "Founders and product managers evaluating new tools",
        maxLength: 300,
      },
      {
        name: "tone",
        label: "Tone",
        type: "select",
        options: TONE_OPTIONS,
        defaultValue: "professional",
      },
      {
        name: "length",
        label: "Length",
        type: "select",
        options: LENGTH_OPTIONS,
        defaultValue: "medium",
      },
      {
        name: "instructions",
        label: "Extra instructions",
        type: "textarea",
        rows: 3,
        placeholder: "Mention the free tier. Keep it under 600 words.",
        maxLength: 1500,
      },
    ],
    seoTitle: "AI Writer — Generate Articles and Long-Form Content | Oply",
    seoDescription:
      "Oply's AI Writer is an AI content writer and blog post writer in one: give it a topic, audience, tone and length, then edit the draft it returns.",
    featured: true,
    sortOrder: 1,
    enabled: true,
    related: ["ai-rewriter", "blog-outline-generator", "ai-summarizer"],
    keywords: {
      primary: "ai writer",
      secondary: [
        "ai content writer",
        "ai writing generator",
        "ai article writer",
        "blog post writer",
        "ai content generator",
        "long form content writer",
        "ai text generator",
        "automatic draft writer",
      ],
      longTail: [
        "write a blog post from a topic",
        "ai tool to write long form articles",
        "generate a first draft for an article",
        "write a product launch announcement with ai",
        "ai writer that lets you set the tone",
        "turn an outline into a finished draft",
        "write content for a specific audience",
        "ai writing tool with a word count target",
        "write a 1000 word article with ai",
        "ai writer for founders and marketers",
        "draft an announcement for a saas launch",
      ],
      entities: [
        "long-form content",
        "first draft",
        "content brief",
        "tone of voice",
        "target audience",
        "word count",
        "markdown",
        "copywriting",
        "content marketing",
        "headline",
        "editing",
        "large language model",
      ],
      questions: [
        "How many credits does the AI Writer use?",
        "Can I edit what the AI writer produces?",
        "Is the writing original?",
        "How long a piece can the AI writer produce?",
        "Can the AI writer match a specific tone of voice?",
        "Does the AI writer research the topic?",
      ],
      intent: "commercial",
    },
    benefits: [
      {
        title: "Start from a draft, not a blank page",
        body: "Give the AI writer a topic and an audience and it returns a structured first draft you can shape into the final piece.",
      },
      {
        title: "Control the voice",
        body: "Six tones and three lengths, so an announcement and a blog post do not come back sounding identical.",
      },
      {
        title: "One tool for every format",
        body: "Articles, launch copy and long-form drafts all come from the same AI content writer, so you are not switching to a separate blog post writer for the next piece.",
      },
    ],
    howItWorks: [
      "Describe the topic and who it is for.",
      "Pick a tone and a target length.",
      "Generate, then shorten, expand or improve the draft.",
      "Copy it out or save it to a project.",
    ],
    example: {
      label: "Example topic",
      value: "Write a product launch announcement for a SaaS company.",
    },
    faq: [
      {
        question: "How many credits does the AI Writer use?",
        answer:
          "20 credits per generation. Shorten, expand and improve each count as a new generation at the same cost.",
      },
      {
        question: "Can I edit what the AI writer produces?",
        answer:
          "Yes. The result is plain editable text — copy it into your editor, or save it to a project and come back to it.",
      },
      {
        question: "Is the writing original?",
        answer:
          "Each generation is produced fresh from your inputs. It is a first draft, not a finished publication — read it, check any facts and edit before publishing.",
      },
      {
        question: "How long a piece can the AI writer produce?",
        answer:
          "Short is roughly 200-300 words, medium 500-700 and long 1,000-1,400. Put a specific word count in the extra instructions if you need a tighter target.",
      },
      {
        question: "Can the AI writer match a specific tone of voice?",
        answer:
          "Six tones ship as presets — professional, friendly, casual, persuasive, creative and technical. Describe the voice further in the extra instructions to narrow it.",
      },
      {
        question: "Does the AI writer research the topic?",
        answer:
          "No. It writes from the topic and notes you supply and does not browse the web, so check any facts and figures before you publish.",
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "ai-rewriter",
    name: "AI Rewriter",
    tagline: "Rewrite any text in seconds.",
    description:
      "Make your writing clearer, more natural or more professional without changing what it says.",
    category: "ai",
    icon: "RefreshCw",
    creditCost: 5,
    component: "standard-text",
    outputType: "markdown",
    maxInputChars: siteConfig.longFormMaxInputChars,
    extraActions: ["shorten", "expand"],
    systemPrompt: `You rewrite text.

Rewrite the supplied text in the requested style. Preserve the original meaning, facts, names, numbers and claims exactly — you are changing wording, not content.

Style guide:
- natural: conversational and easy to read aloud.
- professional: precise and businesslike, no slang.
- simple: short sentences, plain words, no jargon.
- concise: same meaning in noticeably fewer words.
- persuasive: benefit-led and confident, without hype or false urgency.
- seo-friendly: readable and well-structured, keeping key terms intact. Do not stuff keywords.

Keep the original formatting (paragraphs, lists, headings) unless the style calls for changing it. Output only the rewritten text.`,
    fields: [
      {
        name: "text",
        label: "Text to rewrite",
        type: "textarea",
        rows: 12,
        required: true,
        placeholder:
          "Paste the paragraph, email or product copy you want rewritten...",
        maxLength: 30000,
      },
      {
        name: "style",
        label: "Rewrite style",
        type: "select",
        defaultValue: "natural",
        options: [
          { label: "Natural", value: "natural" },
          { label: "Professional", value: "professional" },
          { label: "Simple", value: "simple" },
          { label: "Concise", value: "concise" },
          { label: "Persuasive", value: "persuasive" },
          { label: "SEO-friendly", value: "seo-friendly" },
        ],
      },
    ],
    seoTitle: "AI Rewriter — Rewrite Text Online | Oply",
    seoDescription:
      "Oply's AI Rewriter is a text rewriter and paraphrasing tool for emails, articles and product copy. Rewrite text online in a clearer, more professional style.",
    featured: true,
    sortOrder: 2,
    enabled: true,
    related: ["ai-writer", "reply-generator", "ai-summarizer"],
    keywords: {
      primary: "ai rewriter",
      secondary: [
        "text rewriter",
        "paraphrasing tool",
        "sentence rewriter",
        "article rewriter",
        "rewrite text online",
        "ai paraphraser",
        "paragraph rewriter",
        "reword generator",
      ],
      longTail: [
        "rewrite a paragraph to sound more professional",
        "free ai tool to reword an email",
        "make my writing clearer without changing the meaning",
        "rewrite text in plain english",
        "shorten a paragraph without losing meaning",
        "rewrite product copy in a different tone",
        "paraphrase a long article online",
        "rewrite a sentence to be more concise",
        "change the tone of an email to be firmer",
        "rewrite a draft for a general audience",
      ],
      entities: [
        "paraphrase",
        "tone of voice",
        "readability",
        "plain language",
        "copywriting",
        "editing",
        "proofreading",
        "sentence structure",
        "word choice",
        "clarity",
        "style guide",
        "large language model",
      ],
      questions: [
        "Does rewriting change the meaning of my text?",
        "How long can the input be?",
        "Can this help me get past an AI detector?",
        "Is an AI rewriter the same as a paraphrasing tool?",
        "Which rewrite style should I choose?",
        "Can I rewrite text in another language?",
      ],
      intent: "commercial",
    },
    benefits: [
      {
        title: "Six ways to say it",
        body: "Switch the text rewriter between natural, professional, simple, concise, persuasive and SEO-friendly without rewriting your prompt.",
      },
      {
        title: "Meaning stays put",
        body: "As a paraphrasing tool it changes the wording, not the content — facts, names and numbers come through exactly as you wrote them.",
      },
      {
        title: "Handles long text",
        body: "Paste up to 30,000 characters and rewrite text online in a single pass, which covers most articles and long emails.",
      },
    ],
    howItWorks: [
      "Paste the text you want to change.",
      "Choose the style you are aiming for.",
      "Generate and compare against your original.",
      "Copy the version you prefer.",
    ],
    example: {
      label: "Example input",
      value:
        "We are pleased to inform you that your order has been dispatched and should arrive shortly.",
    },
    faq: [
      {
        question: "Does rewriting change the meaning of my text?",
        answer:
          "It should not. The AI rewriter is instructed to preserve meaning, facts, names and numbers and to change only the wording. Compare both versions before you use one.",
      },
      {
        question: "How long can the input be?",
        answer:
          "Up to 30,000 characters per rewrite, roughly 5,000 words — enough for most articles and long emails in a single pass.",
      },
      {
        question: "Can this help me get past an AI detector?",
        answer:
          "No. Oply does not sell detection evasion, and no tool can honestly promise it. The rewriter is for clarity, tone and readability.",
      },
      {
        question: "Is an AI rewriter the same as a paraphrasing tool?",
        answer:
          "Close, in practice. A paraphrasing tool swaps wording; this rewriter does that and also lets you aim at a style, so the same paragraph can come back plainer or more formal.",
      },
      {
        question: "Which rewrite style should I choose?",
        answer:
          "Natural for conversational copy, professional for client-facing writing, simple for plain language, concise to cut length, persuasive for landing pages, and SEO-friendly to keep key terms intact.",
      },
      {
        question: "Can I rewrite text in another language?",
        answer:
          "Yes. The output follows the language of the text you paste, so a French paragraph comes back rewritten in French.",
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "ai-summarizer",
    name: "AI Summarizer",
    tagline: "Turn long text into a summary you can actually use.",
    description:
      "Condense articles, transcripts and reports into a TL;DR, bullets or a detailed summary.",
    category: "ai",
    icon: "AlignLeft",
    creditCost: 10,
    component: "standard-text",
    outputType: "markdown",
    maxInputChars: siteConfig.longFormMaxInputChars,
    systemPrompt: `You summarize text.

Summarize only what the source says. Never add outside information, opinions or recommendations that are not present in the text.

Modes:
- tldr: one dense paragraph, 2-3 sentences.
- bullets: 4-8 markdown bullets, each a complete thought.
- short: roughly 100 words in flowing prose.
- detailed: roughly 300 words with markdown subheadings for each major section of the source.

Preserve important numbers, names and dates. If the source is inconclusive, say so rather than inventing a conclusion.`,
    fields: [
      {
        name: "text",
        label: "Text to summarize",
        type: "textarea",
        rows: 14,
        required: true,
        placeholder: "Paste an article, transcript, report or set of notes...",
        maxLength: 30000,
      },
      {
        name: "mode",
        label: "Summary type",
        type: "select",
        defaultValue: "bullets",
        options: [
          { label: "TL;DR", value: "tldr" },
          { label: "Bullet points", value: "bullets" },
          { label: "Short summary", value: "short" },
          { label: "Detailed summary", value: "detailed" },
        ],
      },
    ],
    seoTitle: "AI Summarizer — Summarize Text and Articles | Oply",
    seoDescription:
      "Oply's AI Summarizer is a text summarizer and article summarizer in one: paste long text and get a TL;DR, bullet points or a detailed summary you can use.",
    featured: true,
    sortOrder: 3,
    enabled: true,
    related: ["ai-rewriter", "ai-writer", "reply-generator"],
    keywords: {
      primary: "ai summarizer",
      secondary: [
        "text summarizer",
        "article summarizer",
        "tldr generator",
        "summary generator",
        "summarize text online",
        "bullet point summary tool",
        "document summarizer",
        "transcript summarizer",
      ],
      longTail: [
        "summarize a long article into bullet points",
        "turn meeting notes into a short summary",
        "get a tldr of a research report",
        "summarize a transcript into key points",
        "condense a report into an executive summary",
        "summarize text without losing the numbers",
        "make a short summary of a long email thread",
        "summarize an article in a few sentences",
        "bullet point summary of a long document",
        "shorten a report into a one paragraph brief",
      ],
      entities: [
        "tldr",
        "executive summary",
        "abstract",
        "key points",
        "meeting notes",
        "transcript",
        "long document",
        "bullet points",
        "reading time",
        "note taking",
        "editing",
        "large language model",
      ],
      questions: [
        "What is the longest text I can summarize?",
        "Can it summarize a PDF or a URL?",
        "How accurate is the summary?",
        "What is the difference between a TL;DR and a detailed summary?",
        "Can it summarize meeting notes and transcripts?",
        "Does the summarizer add anything that is not in the source?",
      ],
      intent: "commercial",
    },
    benefits: [
      {
        title: "Four shapes of summary",
        body: "A TL;DR for a quick decision, bullets for notes, or a detailed breakdown that follows the structure of the source.",
      },
      {
        title: "Stays inside the source",
        body: "The AI summarizer uses only what is in the text you paste, so it does not quietly add claims of its own.",
      },
      {
        title: "Articles, reports and transcripts",
        body: "The same text summarizer takes a news article, a research report or a meeting transcript — up to 30,000 characters in one run.",
      },
    ],
    howItWorks: [
      "Paste the text you want condensed.",
      "Choose TL;DR, bullets, short or detailed.",
      "Generate the summary.",
      "Copy it or save it for later.",
    ],
    example: {
      label: "Example input",
      value: "A 2,000-word article about remote team productivity research.",
    },
    faq: [
      {
        question: "What is the longest text I can summarize?",
        answer:
          "30,000 characters per generation. Split longer documents into sections and summarize them one at a time.",
      },
      {
        question: "Can it summarize a PDF or a URL?",
        answer:
          "Not yet — paste the text itself. File and URL input are on the roadmap.",
      },
      {
        question: "How accurate is the summary?",
        answer:
          "It reflects the text you paste, but AI can misread emphasis. For anything important, check the summary against the source.",
      },
      {
        question: "What is the difference between a TL;DR and a detailed summary?",
        answer:
          "A TL;DR is two or three sentences for a quick decision. A detailed summary runs to roughly 300 words with subheadings that follow the structure of the source.",
      },
      {
        question: "Can it summarize meeting notes and transcripts?",
        answer:
          "Yes — as a transcript summarizer it works from the raw text. Paste the transcript or notes, then choose bullet points for the key points or detailed to keep the shape of the discussion.",
      },
      {
        question: "Does the summarizer add anything that is not in the source?",
        answer:
          "It is instructed not to. If the source is inconclusive it should say so rather than supply a conclusion of its own.",
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "prompt-generator",
    name: "Prompt Generator",
    tagline: "Turn a goal into a structured AI prompt.",
    description:
      "Describe what you want to accomplish and get a well-structured prompt for the AI platform you use.",
    category: "ai",
    icon: "Wand2",
    creditCost: 5,
    component: "prompt",
    outputType: "markdown",
    maxInputChars: 5000,
    systemPrompt: `You write prompts for AI systems.

From the user's goal, produce one complete, ready-to-paste prompt using these markdown sections, in order:

## Role
## Context
## Task
## Requirements
## Output format
## Constraints

Rules:
- Write the prompt itself, addressed to the AI that will receive it. Do not write about the prompt.
- Be specific. Replace vague instructions with checkable ones.
- Tailor to the target platform: coding AI gets language/runtime detail, image AI gets subject, style, composition and lighting instead of prose sections, general AI gets the standard structure.
- Where the user must supply their own material, insert a clearly marked placeholder like [PASTE YOUR TEXT HERE].
- Keep it under 400 words unless the task genuinely needs more.`,
    fields: [
      {
        name: "goal",
        label: "What do you want to accomplish?",
        type: "textarea",
        rows: 4,
        required: true,
        placeholder: "Create a modern SaaS landing page.",
        maxLength: 3000,
      },
      {
        name: "platform",
        label: "AI platform",
        type: "select",
        defaultValue: "general",
        options: [
          { label: "General AI", value: "general" },
          { label: "ChatGPT", value: "chatgpt" },
          { label: "Claude", value: "claude" },
          { label: "Gemini", value: "gemini" },
          { label: "Image AI", value: "image" },
          { label: "Coding AI", value: "coding" },
        ],
      },
      {
        name: "style",
        label: "Style",
        type: "select",
        defaultValue: "professional",
        options: [
          { label: "Professional", value: "professional" },
          { label: "Creative", value: "creative" },
          { label: "Technical", value: "technical" },
          { label: "Detailed", value: "detailed" },
        ],
      },
    ],
    seoTitle: "AI Prompt Generator — Write Better Prompts | Oply",
    seoDescription:
      "An AI prompt generator that turns a goal into a structured prompt. Works as a ChatGPT prompt generator, Claude prompt generator and image prompt generator.",
    featured: false,
    sortOrder: 4,
    enabled: true,
    related: ["prompt-optimizer", "ai-writer", "ai-rewriter"],
    keywords: {
      primary: "ai prompt generator",
      secondary: [
        "prompt generator",
        "prompt writing tool",
        "chatgpt prompt generator",
        "claude prompt generator",
        "prompt template generator",
        "image prompt generator",
        "ai prompt maker",
        "prompt builder",
      ],
      longTail: [
        "write a prompt for chatgpt from a goal",
        "generate a structured prompt for claude",
        "create a prompt template for image generation",
        "how to write a prompt for a coding assistant",
        "turn an idea into a detailed ai prompt",
        "build a role based prompt for an ai model",
        "write a system prompt for an assistant",
        "make a reusable prompt for marketing copy",
        "generate a prompt with a clear output format",
        "prompt structure with role context and task",
      ],
      entities: [
        "prompt engineering",
        "system prompt",
        "role prompt",
        "few-shot prompting",
        "output format",
        "prompt template",
        "instruction following",
        "ChatGPT",
        "Claude",
        "Gemini",
        "text-to-image model",
        "large language model",
      ],
      questions: [
        "Which AI platforms does this support?",
        "How is this different from the Prompt Optimizer?",
        "Can I save generated prompts?",
        "What makes a good AI prompt?",
        "Can the AI prompt generator write image prompts?",
      ],
      intent: "informational",
    },
    benefits: [
      {
        title: "A real structure, every time",
        body: "Role, context, task, requirements, output format and constraints — the parts most hand-written prompts forget.",
      },
      {
        title: "Platform aware",
        body: "The AI prompt generator shapes an image prompt around subject, style and lighting, and a coding prompt around language and runtime.",
      },
      {
        title: "Cheap to iterate",
        body: "At 5 credits a run it is practical to generate several variants and keep the best one as a reusable prompt template.",
      },
    ],
    howItWorks: [
      "Describe the outcome you want.",
      "Choose the platform and style.",
      "Generate the structured prompt.",
      "Copy it into your AI tool of choice.",
    ],
    example: {
      label: "Example goal",
      value: "Create a modern SaaS landing page.",
    },
    faq: [
      {
        question: "Which AI platforms does this support?",
        answer:
          "The generated prompt is plain text and works anywhere — use it as a ChatGPT prompt generator, a Claude prompt generator or an image prompt generator. Picking a platform adjusts the structure and the level of technical detail.",
      },
      {
        question: "How is this different from the Prompt Optimizer?",
        answer:
          "This tool writes a prompt from a goal. The Prompt Optimizer improves a prompt you already have.",
      },
      {
        question: "Can I save generated prompts?",
        answer:
          "Yes — save any result to your favorites or to a project and reuse it as a prompt template.",
      },
      {
        question: "What makes a good AI prompt?",
        answer:
          "A clear role, enough context, one specific task, checkable requirements, a stated output format and explicit constraints. The generator writes all six so none get forgotten.",
      },
      {
        question: "Can the AI prompt generator write image prompts?",
        answer:
          "Yes. Choose Image AI and the output is shaped around subject, style, composition and lighting instead of the standard prose sections.",
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "prompt-optimizer",
    name: "Prompt Optimizer",
    tagline: "Make an existing prompt clearer and more reliable.",
    description:
      "Paste a prompt that is not working and get an improved version plus what changed.",
    category: "ai",
    icon: "Sparkles",
    creditCost: 10,
    component: "structured-output",
    outputType: "structured",
    outputSchema: "promptOptimizer",
    maxInputChars: 10000,
    systemPrompt: `You improve prompts written for AI systems.

Analyze the supplied prompt and rewrite it so it produces more reliable results.

Return JSON with exactly these keys:
- optimized_prompt: the full improved prompt, ready to paste. This is the main deliverable — do not shorten it into a summary.
- improvements: an array of 3-6 objects, each { area, change }, where area is one of "Clarity", "Context", "Structure", "Constraints", "Output format", "Specificity", and change is one sentence describing what you altered and why.

Keep the user's intent. Do not add subject-matter requirements they never asked for.`,
    fields: [
      {
        name: "prompt",
        label: "Your current prompt",
        type: "textarea",
        rows: 12,
        required: true,
        placeholder: "Write me a blog post about marketing.",
        maxLength: 10000,
      },
      {
        name: "goal",
        label: "What should it produce? (optional)",
        type: "textarea",
        rows: 2,
        placeholder: "A 900-word post for B2B founders with practical examples.",
        maxLength: 1000,
      },
    ],
    seoTitle: "AI Prompt Optimizer — Improve Your Prompts | Oply",
    seoDescription:
      "Paste a prompt into Oply's Prompt Optimizer and get a clearer version plus what changed — a prompt improver and prompt engineering tool in a single run.",
    featured: true,
    sortOrder: 5,
    enabled: true,
    related: ["prompt-generator", "ai-rewriter", "ai-writer"],
    keywords: {
      primary: "prompt optimizer",
      secondary: [
        "prompt improver",
        "prompt rewriting tool",
        "prompt engineering tool",
        "improve an ai prompt",
        "optimize a chatgpt prompt",
        "prompt refinement tool",
        "prompt debugging tool",
        "better ai prompts",
      ],
      longTail: [
        "fix a prompt that gives vague answers",
        "make an ai prompt more specific and reliable",
        "improve a chatgpt prompt that is not working",
        "add constraints and output format to a prompt",
        "rewrite a prompt for more consistent results",
        "see what changed after optimizing a prompt",
        "shorten a prompt without losing instructions",
        "turn a vague request into a clear instruction",
        "optimize a prompt for a coding assistant",
        "why my ai prompt keeps ignoring instructions",
      ],
      entities: [
        "prompt engineering",
        "clarity",
        "constraints",
        "output format",
        "specificity",
        "instruction following",
        "token efficiency",
        "system prompt",
        "context",
        "edge case",
        "prompt iteration",
        "large language model",
      ],
      questions: [
        "Does this work for image prompts?",
        "Will the optimized prompt work on any AI?",
        "How much does a run cost?",
        "Why does my prompt give inconsistent results?",
        "What does the prompt optimizer actually change?",
      ],
      intent: "commercial",
    },
    benefits: [
      {
        title: "See what changed",
        body: "Every run lists the specific improvements, so the prompt improver teaches you the pattern instead of just handing back output.",
      },
      {
        title: "Keeps your intent",
        body: "The optimizer sharpens your prompt rather than replacing it with a generic template.",
      },
      {
        title: "Side-by-side",
        body: "Your original stays on screen next to the optimized version, so you can see exactly what the prompt engineering tool changed.",
      },
    ],
    howItWorks: [
      "Paste the prompt that is underperforming.",
      "Optionally describe what it should produce.",
      "Generate the optimized version.",
      "Copy the new prompt and compare results.",
    ],
    example: {
      label: "Example prompt",
      value: "Write me a blog post about marketing.",
    },
    faq: [
      {
        question: "Does this work for image prompts?",
        answer:
          "Yes, though it is tuned for text prompts. For image work, describe the goal in the optional field so the optimizer keeps the right structure.",
      },
      {
        question: "Will the optimized prompt work on any AI?",
        answer:
          "The output is plain text and portable. Different models still respond differently, so test it where you plan to use it.",
      },
      {
        question: "How much does a run cost?",
        answer:
          "10 credits per optimization, which covers the rewritten prompt and the list of changes.",
      },
      {
        question: "Why does my prompt give inconsistent results?",
        answer:
          "Usually because it leaves something open — no output format, no constraints, or a task that can be read two ways. Those are the areas the optimizer reports on.",
      },
      {
        question: "What does the prompt optimizer actually change?",
        answer:
          "It returns the rewritten prompt plus three to six labelled changes across clarity, context, structure, constraints, output format and specificity, so you can see the reasoning.",
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "seo-meta-generator",
    name: "SEO Meta Generator",
    tagline: "Write titles and meta descriptions that fit.",
    description:
      "Generate an SEO title, meta description, slug and Open Graph copy with live character counts.",
    category: "seo",
    icon: "Search",
    creditCost: 10,
    component: "seo-generator",
    outputType: "structured",
    outputSchema: "seoMeta",
    maxInputChars: 5000,
    systemPrompt: `You write on-page SEO metadata.

Return JSON with exactly these keys: seo_title, meta_description, slug, og_title, og_description.

Hard requirements:
- seo_title: 50-60 characters including spaces. Include the primary keyword naturally, ideally near the front. Do not append a brand name unless the user supplied one.
- meta_description: 140-160 characters including spaces. One or two sentences, active voice, describing what the page gives the reader. Include the primary keyword once, naturally.
- slug: lowercase, hyphen-separated, 3-6 words, no stop-word padding, no dates, no trailing punctuation.
- og_title: up to 60 characters, may be punchier and less keyword-driven than seo_title.
- og_description: up to 110 characters, written for a social card.

Never keyword-stuff. Never promise rankings. Count characters carefully — staying inside the ranges matters more than being clever.`,
    fields: [
      {
        name: "topic",
        label: "Page topic",
        type: "textarea",
        rows: 3,
        required: true,
        placeholder: "A comparison guide to AI productivity tools for small teams",
        maxLength: 1000,
      },
      {
        name: "primaryKeyword",
        label: "Primary keyword",
        type: "text",
        required: true,
        placeholder: "AI productivity tools",
        maxLength: 120,
      },
      {
        name: "secondaryKeywords",
        label: "Secondary keywords",
        type: "text",
        placeholder: "AI tools for teams, productivity software",
        maxLength: 300,
        helpText: "Comma separated. Optional.",
      },
      {
        name: "intent",
        label: "Search intent",
        type: "select",
        defaultValue: "informational",
        options: [
          { label: "Informational", value: "informational" },
          { label: "Commercial", value: "commercial" },
          { label: "Transactional", value: "transactional" },
          { label: "Navigational", value: "navigational" },
        ],
      },
      {
        name: "pageType",
        label: "Page type",
        type: "select",
        defaultValue: "blog-post",
        options: [
          { label: "Blog post", value: "blog-post" },
          { label: "Landing page", value: "landing-page" },
          { label: "Product page", value: "product-page" },
          { label: "Category page", value: "category-page" },
          { label: "Homepage", value: "homepage" },
          { label: "Documentation", value: "documentation" },
        ],
      },
    ],
    seoTitle: "Meta Description Generator — SEO Titles and Tags | Oply",
    seoDescription:
      "A meta description generator and SEO title generator with live character counts. Oply's meta tag generator also writes the URL slug and Open Graph copy.",
    featured: true,
    sortOrder: 6,
    enabled: true,
    related: ["schema-generator", "blog-outline-generator", "product-description-generator"],
    keywords: {
      primary: "meta description generator",
      secondary: [
        "seo title generator",
        "meta tag generator",
        "title tag generator",
        "page title generator",
        "open graph tag generator",
        "serp snippet tool",
        "seo metadata tool",
        "url slug generator",
      ],
      longTail: [
        "write a meta description under 160 characters",
        "generate an seo title for a blog post",
        "meta description generator with character count",
        "write title tags for a product page",
        "create open graph title and description",
        "generate a url slug from a page topic",
        "meta tags for a commercial landing page",
        "write metadata for a category page",
        "seo title and description for documentation pages",
        "meta description for an ecommerce product listing",
      ],
      entities: [
        "meta description",
        "title tag",
        "SERP",
        "search snippet",
        "click-through rate",
        "focus keyword",
        "character limit",
        "Open Graph",
        "URL slug",
        "on-page SEO",
        "search intent",
        "truncation",
        "content management system",
        "structured data",
        "rich results",
      ],
      questions: [
        "What length should a meta description be?",
        "How long should an SEO title tag be?",
        "Will this improve my rankings?",
        "Does the meta description generator use my focus keyword?",
        "Does it generate a URL slug and Open Graph tags?",
        "Can I generate metadata in another language?",
      ],
      intent: "commercial",
    },
    benefits: [
      {
        title: "Character counts you can trust",
        body: "Every field in the meta description generator shows its length against the recommended limit, so nothing gets truncated in results.",
      },
      {
        title: "Open Graph included",
        body: "The SEO title generator, the URL slug and the social card copy all come out of the same run as the description.",
      },
      {
        title: "Intent-aware",
        body: "Commercial and informational pages get different phrasing from the meta tag generator rather than one generic template.",
      },
    ],
    howItWorks: [
      "Describe the page and its primary keyword.",
      "Pick the search intent and page type.",
      "Generate the metadata set.",
      "Copy each field into your CMS.",
    ],
    example: {
      label: "Example keyword",
      value: "AI productivity tools",
    },
    faq: [
      {
        question: "What length should a meta description be?",
        answer:
          "Around 140-160 characters is the usual guidance, since search engines truncate longer text. Oply targets that range and shows you the count.",
      },
      {
        question: "How long should an SEO title tag be?",
        answer:
          "Roughly 50-60 characters, because search results cut off longer titles. The generator aims at that range and reports the length of every field.",
      },
      {
        question: "Will this improve my rankings?",
        answer:
          "Well-written metadata can improve click-through rate, but no tool can guarantee rankings and Oply will not claim otherwise.",
      },
      {
        question: "Does the meta description generator use my focus keyword?",
        answer:
          "It places the primary keyword you enter once, naturally, in the title and the description. Secondary keywords are optional and are used only where they fit.",
      },
      {
        question: "Does it generate a URL slug and Open Graph tags?",
        answer:
          "Yes. One run returns the SEO title, meta description, slug, Open Graph title and Open Graph description, each with its own copy button.",
      },
      {
        question: "Can I generate metadata in another language?",
        answer:
          "Yes. Write your topic and keyword in that language and the output will follow it.",
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "schema-generator",
    name: "Schema Generator",
    tagline: "Generate clean JSON-LD structured data.",
    description:
      "Build valid schema.org JSON-LD for articles, products, FAQs, businesses and more.",
    category: "seo",
    icon: "Braces",
    creditCost: 10,
    component: "schema-generator",
    outputType: "json",
    maxInputChars: 8000,
    extraActions: ["download"],
    systemPrompt: `You generate schema.org structured data as JSON-LD.

Output a single JSON object (not an array, unless the type genuinely requires @graph) that:
- starts with "@context": "https://schema.org" and the correct "@type"
- uses only properties that exist on that type in schema.org
- includes only fields the user actually supplied — never invent URLs, prices, dates, ratings, review counts or author names
- omits empty properties entirely rather than emitting empty strings
- formats dates as ISO 8601

Do not add aggregateRating or review unless the user supplied real values. Return only the JSON object.`,
    fields: [
      {
        name: "schemaType",
        label: "Schema type",
        type: "select",
        required: true,
        defaultValue: "Article",
        options: [
          { label: "Article", value: "Article" },
          { label: "Product", value: "Product" },
          { label: "FAQ", value: "FAQPage" },
          { label: "LocalBusiness", value: "LocalBusiness" },
          { label: "Organization", value: "Organization" },
          { label: "Person", value: "Person" },
          { label: "Event", value: "Event" },
          { label: "SoftwareApplication", value: "SoftwareApplication" },
          { label: "Breadcrumb", value: "BreadcrumbList" },
          { label: "WebSite", value: "WebSite" },
        ],
      },
      {
        name: "name",
        label: "Name / headline",
        type: "text",
        required: true,
        placeholder: "Minimalist Leather Wallet",
        maxLength: 300,
      },
      {
        name: "url",
        label: "URL",
        type: "text",
        placeholder: "https://example.com/products/leather-wallet",
        maxLength: 500,
      },
      {
        name: "details",
        label: "Details",
        type: "textarea",
        rows: 8,
        required: true,
        placeholder:
          "Description, author, dates, price, address, opening hours, FAQ questions and answers — whatever applies to this type.",
        maxLength: 8000,
        helpText:
          "Only supply real values. Anything you leave out is omitted rather than invented.",
      },
    ],
    seoTitle: "Schema Markup Generator — JSON-LD Structured Data | Oply",
    seoDescription:
      "Oply's schema markup generator is a JSON-LD generator and structured data generator for Article, Product, FAQ and LocalBusiness. Copy or download the output.",
    featured: false,
    sortOrder: 7,
    enabled: true,
    related: ["seo-meta-generator", "product-description-generator", "blog-outline-generator"],
    keywords: {
      primary: "schema markup generator",
      secondary: [
        "json-ld generator",
        "structured data generator",
        "schema.org generator",
        "faq schema generator",
        "product schema generator",
        "article schema generator",
        "breadcrumb schema generator",
        "local business schema tool",
      ],
      longTail: [
        "generate json-ld for a product page",
        "create faqpage structured data for a blog post",
        "write schema markup for a local business",
        "add structured data to a website page",
        "generate breadcrumb markup for a category page",
        "json-ld for an article with author and date",
        "check structured data with the rich results test",
        "schema markup for a software application page",
        "download structured data as a json file",
        "where to put json-ld on a page",
      ],
      entities: [
        "schema.org",
        "JSON-LD",
        "structured data",
        "rich results",
        "FAQPage",
        "Article",
        "Product",
        "LocalBusiness",
        "BreadcrumbList",
        "Rich Results Test",
        "microdata",
        "search snippet",
        "validator",
        "on-page SEO",
        "content management system",
      ],
      questions: [
        "Does adding schema guarantee rich results?",
        "Which schema.org types are supported?",
        "Is the output validated?",
        "Where do I put the JSON-LD?",
        "What is the difference between JSON-LD and microdata?",
        "Can I download the structured data as a file?",
      ],
      intent: "commercial",
    },
    benefits: [
      {
        title: "Ten schema.org types",
        body: "The JSON-LD generator covers Article, Product, FAQ, LocalBusiness, Organization, Person, Event, SoftwareApplication, Breadcrumb and WebSite.",
      },
      {
        title: "No invented values",
        body: "The schema markup generator omits properties you did not supply instead of filling them with placeholder data or invented ratings.",
      },
      {
        title: "Copy or download",
        body: "Take the output of the structured data generator as text, or download a .json file to hand to a developer.",
      },
    ],
    howItWorks: [
      "Choose the schema type.",
      "Enter the name and the details that apply.",
      "Generate the JSON-LD.",
      "Copy or download it, then validate it before publishing.",
    ],
    example: {
      label: "Example",
      value: "Product — Minimalist leather wallet",
    },
    faq: [
      {
        question: "Does adding schema guarantee rich results?",
        answer:
          "No. Valid structured data makes a page eligible for some rich result types, but search engines decide what to show. Always test with an official validator before relying on it.",
      },
      {
        question: "Which schema.org types are supported?",
        answer:
          "Article, Product, FAQPage, LocalBusiness, Organization, Person, Event, SoftwareApplication, BreadcrumbList and WebSite.",
      },
      {
        question: "Is the output validated?",
        answer:
          "Oply checks that the output is well-formed JSON and shows you the parsed result. Run it through Google's Rich Results Test or the Schema.org validator for a full check.",
      },
      {
        question: "Where do I put the JSON-LD?",
        answer:
          "Inside a script tag with type=\"application/ld+json\" in the head or body of the page it describes.",
      },
      {
        question: "What is the difference between JSON-LD and microdata?",
        answer:
          "Both express structured data. JSON-LD sits in one script tag away from your markup, while microdata is written as attributes inside the HTML. Google recommends JSON-LD.",
      },
      {
        question: "Can I download the structured data as a file?",
        answer:
          "Yes. Every result copies as text or downloads as a .json file you can hand to a developer.",
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "product-description-generator",
    name: "Product Description Generator",
    tagline: "Write product copy that actually sells the product.",
    description:
      "Generate short and long descriptions, bullets, SEO tags and a CTA from your product details.",
    category: "ecommerce",
    icon: "ShoppingBag",
    creditCost: 15,
    component: "structured-output",
    outputType: "structured",
    outputSchema: "productDescription",
    maxInputChars: 6000,
    systemPrompt: `You write e-commerce product copy.

Return JSON with exactly these keys: short_description, long_description, bullet_points, seo_title, meta_description, tags, cta.

Requirements:
- short_description: 1-2 sentences, roughly 200-300 characters, suitable for a listing card.
- long_description: 2-4 short paragraphs in markdown. Lead with the benefit, support with the features supplied.
- bullet_points: 4-6 strings, each a concrete feature-and-benefit pair. No trailing periods.
- seo_title: 50-60 characters, includes the product name.
- meta_description: 140-160 characters.
- tags: 6-10 short lowercase strings for search and filtering.
- cta: one short button-length call to action, under 30 characters.

Use only the features and benefits supplied. Do not invent materials, dimensions, certifications, prices or shipping claims.`,
    fields: [
      {
        name: "productName",
        label: "Product name",
        type: "text",
        required: true,
        placeholder: "Minimalist leather wallet",
        maxLength: 200,
      },
      {
        name: "productType",
        label: "Product type",
        type: "text",
        placeholder: "Accessories / wallets",
        maxLength: 200,
      },
      {
        name: "features",
        label: "Features",
        type: "textarea",
        rows: 5,
        required: true,
        placeholder:
          "Full-grain leather, 6 card slots, RFID blocking, 8mm thick, hand-stitched",
        maxLength: 2000,
      },
      {
        name: "benefits",
        label: "Benefits",
        type: "textarea",
        rows: 3,
        placeholder: "Fits in a front pocket, ages well, protects contactless cards",
        maxLength: 1500,
      },
      {
        name: "audience",
        label: "Target audience",
        type: "text",
        placeholder: "Men aged 25-45 who carry few cards",
        maxLength: 300,
      },
      {
        name: "brandTone",
        label: "Brand tone",
        type: "select",
        defaultValue: "premium",
        options: [
          { label: "Premium", value: "premium" },
          { label: "Friendly", value: "friendly" },
          { label: "Minimal", value: "minimal" },
          { label: "Playful", value: "playful" },
          { label: "Technical", value: "technical" },
          { label: "Luxury", value: "luxury" },
        ],
      },
    ],
    seoTitle: "Product Description Generator — AI Product Copy | Oply",
    seoDescription:
      "Oply's product description generator is an ecommerce copywriting tool and product copy generator: short and long copy, bullets, SEO tags and a CTA per run.",
    featured: true,
    sortOrder: 8,
    enabled: true,
    related: ["seo-meta-generator", "ai-rewriter", "ai-writer"],
    keywords: {
      primary: "product description generator",
      secondary: [
        "ecommerce copywriting tool",
        "shopify product description generator",
        "amazon listing generator",
        "product copy generator",
        "product listing writer",
        "ai product description writer",
        "product bullet point generator",
        "store listing copy tool",
      ],
      longTail: [
        "write a product description for shopify",
        "generate bullet points for an amazon listing",
        "product copy from a list of features",
        "write a short and long product description",
        "product description with an seo title and tags",
        "write listing copy for a handmade product",
        "turn product specs into selling copy",
        "product description in a premium brand tone",
        "write a call to action for a product page",
        "product copy for a marketplace listing",
      ],
      entities: [
        "e-commerce",
        "product listing",
        "features and benefits",
        "bullet points",
        "Shopify",
        "WooCommerce",
        "marketplace listing",
        "conversion copywriting",
        "brand tone",
        "product title",
        "call to action",
        "meta description",
        "copywriting",
        "on-page SEO",
      ],
      questions: [
        "What does one generation include?",
        "Will it invent product specifications?",
        "Does it work for Shopify and Amazon listings?",
        "Can I generate copy for a whole catalog?",
        "Can I set the brand tone?",
        "Is the copy unique per product?",
      ],
      intent: "commercial",
    },
    benefits: [
      {
        title: "A full listing, not one paragraph",
        body: "The product description generator returns short copy, long copy, bullet points, SEO tags and a CTA in a single run.",
      },
      {
        title: "Sticks to your specs",
        body: "It works from the features you supply and will not invent materials, sizes or certifications.",
      },
      {
        title: "Ready to paste",
        body: "Each block copies separately, so the ecommerce copywriting tool drops straight into Shopify, WooCommerce or a marketplace listing.",
      },
    ],
    howItWorks: [
      "Enter the product name and its real features.",
      "Add the audience and brand tone.",
      "Generate the full copy set.",
      "Copy each block into your store.",
    ],
    example: {
      label: "Example product",
      value: "Minimalist leather wallet",
    },
    faq: [
      {
        question: "What does one generation include?",
        answer:
          "A short description, a long description, four to six bullet points, an SEO title, a meta description, six to ten tags and a call to action.",
      },
      {
        question: "Will it invent product specifications?",
        answer:
          "It is instructed not to. Supply accurate features and it will write around them; leave a detail out and it is omitted rather than guessed.",
      },
      {
        question: "Does it work for Shopify and Amazon listings?",
        answer:
          "Yes. It doubles as a Shopify product description generator and an Amazon listing generator — each block copies on its own, so descriptions, bullet points and tags paste straight in.",
      },
      {
        question: "Can I generate copy for a whole catalog?",
        answer:
          "One product per generation today. Bulk generation is on the roadmap — each run costs 15 credits.",
      },
      {
        question: "Can I set the brand tone?",
        answer:
          "Six tones are available — premium, friendly, minimal, playful, technical and luxury — and the copy is written to match the one you pick.",
      },
      {
        question: "Is the copy unique per product?",
        answer:
          "Each generation is produced from your inputs, so different products produce different copy. Review it before publishing.",
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "reply-generator",
    name: "Reply Generator",
    tagline: "Draft the right reply in seconds.",
    description:
      "Paste a message and get a reply in the tone you need — professional, friendly, firm or supportive.",
    category: "business",
    icon: "MessageSquareReply",
    creditCost: 5,
    component: "reply",
    outputType: "structured",
    outputSchema: "reply",
    maxInputChars: 10000,
    systemPrompt: `You draft replies to messages.

Return JSON with exactly these keys: short, standard, detailed — three versions of the same reply.

- short: 1-2 sentences. For chat or a quick acknowledgement.
- standard: a normal email-length reply, 3-6 sentences.
- detailed: a fuller reply that addresses each point raised, with a line break between paragraphs.

Rules:
- Write in first person as the recipient replying. No subject line unless the original clearly is an email thread, and no placeholder signature.
- Answer what was actually asked. If the message asks something you cannot know (a date, a price, a status), write the sentence so the user only has to fill in the specific value, marked like [DATE].
- Match the requested tone. "Firm" means clear and boundaried, never rude.
- Never apologize excessively or over-promise.`,
    fields: [
      {
        name: "message",
        label: "Message to reply to",
        type: "textarea",
        rows: 8,
        required: true,
        placeholder: "Client asking whether the website will be ready Friday.",
        maxLength: 8000,
      },
      {
        name: "context",
        label: "Relationship / context",
        type: "text",
        placeholder: "Long-term client, project is two days behind",
        maxLength: 500,
      },
      {
        name: "tone",
        label: "Tone",
        type: "select",
        defaultValue: "professional",
        options: [
          { label: "Professional", value: "professional" },
          { label: "Friendly", value: "friendly" },
          { label: "Short", value: "short" },
          { label: "Polite", value: "polite" },
          { label: "Firm", value: "firm" },
          { label: "Customer Support", value: "support" },
        ],
      },
    ],
    seoTitle: "AI Reply Generator — Draft Email Replies | Oply",
    seoDescription:
      "An AI reply generator for email, tickets and client messages. Use it as an email reply generator or customer support reply generator — three lengths per run.",
    featured: true,
    sortOrder: 9,
    enabled: true,
    related: ["ai-rewriter", "ai-writer", "ai-summarizer"],
    keywords: {
      primary: "ai reply generator",
      secondary: [
        "email reply generator",
        "email response generator",
        "customer support reply generator",
        "professional email writer",
        "client reply generator",
        "message reply writer",
        "respond to an email with ai",
        "follow up email writer",
      ],
      longTail: [
        "write a professional reply to a client email",
        "how to politely decline a request by email",
        "draft a customer support reply from a ticket",
        "reply to an unhappy customer message",
        "write a firm but polite follow up email",
        "respond to a client asking about a deadline",
        "short friendly reply to a chat message",
        "draft three versions of the same reply",
        "reply to a message in a matching tone",
        "write a reply that sets a clear boundary",
      ],
      entities: [
        "email etiquette",
        "tone of voice",
        "customer support",
        "follow-up",
        "client communication",
        "support ticket",
        "polite decline",
        "professional email",
        "message draft",
        "placeholder",
        "business communication",
        "editing",
      ],
      questions: [
        "Does Oply read my inbox?",
        "Can it match the tone of the original message?",
        "Will it invent dates or prices I did not give it?",
        "How do I politely decline a request by email?",
        "Can I use this for customer support?",
        "How much does a reply cost?",
      ],
      intent: "commercial",
    },
    benefits: [
      {
        title: "Three lengths at once",
        body: "The AI reply generator returns short, standard and detailed versions from one run, so you can pick the one that fits the channel.",
      },
      {
        title: "Tone you control",
        body: "Firm when you need a boundary, supportive when it is a support ticket — the email reply generator matches the tone you pick, not a house style.",
      },
      {
        title: "Marks what it cannot know",
        body: "Dates, prices and statuses come back as clearly marked placeholders instead of confident guesses.",
      },
    ],
    howItWorks: [
      "Paste the message you received.",
      "Add the relationship or situation.",
      "Choose a tone and generate.",
      "Pick a length and copy it.",
    ],
    example: {
      label: "Example message",
      value: "Client asking whether the website will be ready Friday.",
    },
    faq: [
      {
        question: "Does Oply read my inbox?",
        answer:
          "No. There is no email integration — you paste the message you want to reply to, and nothing else is accessed.",
      },
      {
        question: "Can it match the tone of the original message?",
        answer:
          "You choose the tone — professional, friendly, short, polite, firm or customer support — and add the relationship in the context field so the reply lands the way you intend.",
      },
      {
        question: "Will it invent dates or prices I did not give it?",
        answer:
          "No. Anything it cannot know comes back as a clearly marked placeholder such as [DATE], so you fill in the real value before sending.",
      },
      {
        question: "How do I politely decline a request by email?",
        answer:
          "Paste the request and set the tone to polite or firm. The reply generator drafts a clear no with a reason and, where one applies, an alternative.",
      },
      {
        question: "Can I use this for customer support?",
        answer:
          "Yes — the Customer Support tone makes it a usable customer support reply generator. Review each reply before sending; it is a draft, not an autoresponder.",
      },
      {
        question: "How much does a reply cost?",
        answer:
          "5 credits, which covers all three lengths.",
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "blog-outline-generator",
    name: "Blog Outline Generator",
    tagline: "Plan the post before you write it.",
    description:
      "Get an H1, intro angle, H2 and H3 structure, key points, conclusion and FAQ ideas.",
    category: "seo",
    icon: "ListTree",
    creditCost: 15,
    component: "structured-output",
    outputType: "structured",
    outputSchema: "blogOutline",
    maxInputChars: 4000,
    systemPrompt: `You plan blog post structures.

Return JSON with exactly these keys: h1, introduction_idea, sections, conclusion, faq_ideas.

- h1: one working title, under 70 characters, containing the primary keyword naturally.
- introduction_idea: 2-3 sentences describing the angle and hook the intro should take. Describe it; do not write the intro.
- sections: an array of 4-7 objects, each { h2, key_points, subsections }, where key_points is an array of 2-4 short strings and subsections is an array of 0-3 H3 strings. Order them so the post builds an argument rather than listing topics.
- conclusion: 1-2 sentences on what the closing section should do.
- faq_ideas: 3-5 questions a reader would realistically search for after reading.

Cover the topic properly for the stated goal and audience. Do not pad with generic sections like "Introduction" or "Conclusion" inside sections.`,
    fields: [
      {
        name: "topic",
        label: "Topic",
        type: "textarea",
        rows: 3,
        required: true,
        placeholder: "How small teams choose an AI productivity stack",
        maxLength: 1000,
      },
      {
        name: "audience",
        label: "Target audience",
        type: "text",
        placeholder: "Operations leads at 10-50 person companies",
        maxLength: 300,
      },
      {
        name: "primaryKeyword",
        label: "Primary keyword",
        type: "text",
        placeholder: "AI productivity tools",
        maxLength: 120,
      },
      {
        name: "goal",
        label: "Content goal",
        type: "select",
        defaultValue: "educate",
        options: [
          { label: "Educate", value: "educate" },
          { label: "Rank in search", value: "rank" },
          { label: "Convert readers", value: "convert" },
          { label: "Compare options", value: "compare" },
          { label: "Build authority", value: "authority" },
        ],
      },
    ],
    seoTitle: "Blog Outline Generator — AI Content Outlines | Oply",
    seoDescription:
      "A blog outline generator and article outline generator: H1, intro angle, H2 and H3 structure, key points and FAQ ideas. Doubles as a content brief generator.",
    featured: false,
    sortOrder: 10,
    enabled: true,
    related: ["ai-writer", "seo-meta-generator", "ai-summarizer"],
    keywords: {
      primary: "blog outline generator",
      secondary: [
        "article outline generator",
        "content outline tool",
        "blog post structure generator",
        "blog post plan generator",
        "heading structure generator",
        "content brief generator",
        "blog structure tool",
        "post outline maker",
      ],
      longTail: [
        "create an outline for a blog post",
        "generate h2 and h3 headings for an article",
        "plan a blog post around a primary keyword",
        "content outline for a comparison article",
        "blog outline with faq ideas at the end",
        "structure a long article before writing it",
        "turn a topic into a section by section plan",
        "outline a post for a specific audience",
        "content brief for a writer to follow",
        "how many sections should a blog post have",
      ],
      entities: [
        "content brief",
        "article structure",
        "H2",
        "H3",
        "heading hierarchy",
        "topic cluster",
        "search intent",
        "introduction hook",
        "conclusion",
        "FAQ section",
        "content strategy",
        "long-form content",
        "on-page SEO",
        "key points",
      ],
      questions: [
        "Can I turn the outline into a full post?",
        "Does it write the H2 and H3 headings for me?",
        "How many sections does it generate?",
        "What is a content brief?",
        "Does the outline include FAQ ideas?",
        "Does it research the topic?",
      ],
      intent: "informational",
    },
    benefits: [
      {
        title: "Structure before prose",
        body: "The blog outline generator settles what the post argues, and in what order, before you spend time on sentences.",
      },
      {
        title: "H2s and H3s together",
        body: "Each section comes with key points and optional subsections, so the heading hierarchy is already sound before you write a word.",
      },
      {
        title: "FAQ ideas included",
        body: "Every run of the article outline generator ends with realistic follow-up questions you can answer on the page or turn into future posts.",
      },
    ],
    howItWorks: [
      "Enter the topic, audience and keyword.",
      "Choose what the post should achieve.",
      "Generate the outline.",
      "Copy it, or send the sections to the AI Writer.",
    ],
    example: {
      label: "Example topic",
      value: "How small teams choose an AI productivity stack",
    },
    faq: [
      {
        question: "Can I turn the outline into a full post?",
        answer:
          "Yes — copy a section into the AI Writer with the key points as instructions, and write the post one section at a time.",
      },
      {
        question: "Does it write the H2 and H3 headings for me?",
        answer:
          "Yes. Each section comes back with an H2, two to four key points and up to three H3 subsections, so the heading hierarchy is already sound.",
      },
      {
        question: "How many sections does it generate?",
        answer:
          "Between four and seven H2 sections, each with key points and up to three H3 subsections.",
      },
      {
        question: "What is a content brief?",
        answer:
          "A short plan a writer works from: the angle, the audience, the heading structure and the points each section has to cover. That is exactly what this content brief generator returns.",
      },
      {
        question: "Does the outline include FAQ ideas?",
        answer:
          "Yes. Every outline ends with three to five follow-up questions you can answer on the page or turn into separate posts.",
      },
      {
        question: "Does it research the topic?",
        answer:
          "No. It structures the topic from your inputs and does not browse the web, so verify any specifics you add later.",
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "ai-logo-icon-generator",
    name: "AI Logo Generator",
    tagline: "Design a logo from a brand name and a few style keywords.",
    description:
      "Turn a brand name and style keywords into a downloadable logo, with a transparent background option.",
    category: "images",
    icon: "Shapes",
    creditCost: 55,
    component: "image-generator",
    outputType: "image",
    imageOutput: {
      defaultSize: { width: 1024, height: 1024 },
      backgroundField: "background",
      backgroundValues: { transparent: "transparent", white: "opaque" },
    },
    systemPrompt: `You design a single logo mark from a brand name and style direction.

Compose a clean, printable logo: balanced, legible at small sizes, and free of watermarks, placeholder text or stray artifacts. Use only the brand name, style keywords and colour preference supplied — do not invent a tagline, industry claim or symbol unrelated to the brief. If a colour preference is given, use it as the dominant palette; otherwise choose colours that fit the requested style.`,
    fields: [
      {
        name: "brandName",
        label: "Brand name",
        type: "text",
        required: true,
        placeholder: "Nova Robotics",
        maxLength: 60,
      },
      {
        name: "styleKeywords",
        label: "Style keywords",
        type: "text",
        required: true,
        placeholder: "minimalist, geometric, tech",
        maxLength: 200,
        helpText: "A few words describing the look you want.",
      },
      {
        name: "style",
        label: "Style",
        type: "select",
        defaultValue: "minimalist-flat",
        options: [
          { label: "Minimalist Flat", value: "minimalist-flat" },
          { label: "Emblem / Badge", value: "emblem-badge" },
          { label: "Wordmark + Icon", value: "wordmark-icon" },
          { label: "Mascot", value: "mascot" },
          { label: "Abstract Geometric", value: "abstract-geometric" },
        ],
      },
      {
        name: "colorPreference",
        label: "Colour preference",
        type: "text",
        placeholder: "Blue and white",
        maxLength: 100,
        helpText: "Optional. Leave blank to let the style guide the colours.",
      },
      {
        name: "background",
        label: "Background",
        type: "select",
        defaultValue: "transparent",
        options: [
          { label: "Transparent", value: "transparent" },
          { label: "White", value: "white" },
        ],
      },
    ],
    maxInputChars: 500,
    extraActions: ["download"],
    seoTitle: "AI Logo Generator — Design a Logo in Seconds | Oply",
    seoDescription:
      "Oply's AI logo generator is a logo maker and icon generator: enter a brand name and style keywords, then download a transparent-background PNG.",
    featured: false,
    sortOrder: 11,
    enabled: true,
    related: ["ai-thumbnail-generator"],
    keywords: {
      primary: "ai logo generator",
      secondary: [
        "logo maker",
        "ai logo maker",
        "icon generator",
        "brand logo generator",
        "free logo generator",
        "logo design tool",
        "custom logo generator",
        "startup logo generator",
      ],
      longTail: [
        "generate a logo for a startup",
        "create a minimalist logo with ai",
        "design a logo from a brand name",
        "make a transparent background logo",
        "generate an app icon with ai",
        "create a logo without hiring a designer",
        "ai tool to design a brand logo",
        "generate logo options from style keywords",
        "make a geometric abstract logo",
        "design an emblem style logo",
      ],
      entities: [
        "logo design",
        "brand identity",
        "wordmark",
        "emblem",
        "icon design",
        "transparent background",
        "brand colors",
        "graphic design",
        "typography",
        "visual identity",
        "PNG",
      ],
      questions: [
        "Can I get exclusive rights to an AI-generated logo?",
        "Will the logo be unique to my brand?",
        "What file format do I get?",
        "Can I regenerate if I don't like the result?",
        "Does it check for trademark conflicts?",
      ],
      intent: "commercial",
    },
    benefits: [
      {
        title: "From a name to a mark in one run",
        body: "Enter a brand name and a few style keywords and the logo generator composes a mark around them — no design software required.",
      },
      {
        title: "Transparent background included",
        body: "Choose a transparent or white background so the logo drops straight onto a site, app icon or business card.",
      },
      {
        title: "Five styles to start from",
        body: "Minimalist flat, emblem, wordmark and icon, mascot, or abstract geometric — pick the direction closest to your brand.",
      },
    ],
    howItWorks: [
      "Enter your brand name and a few style keywords.",
      "Pick a style and, optionally, a colour preference.",
      "Generate the logo.",
      "Download the PNG, or regenerate for a different result.",
    ],
    example: {
      label: "Example brief",
      value: "Nova Robotics · minimalist, geometric, tech",
    },
    faq: [
      {
        question: "Can I get exclusive rights to an AI-generated logo?",
        answer:
          "Oply doesn't provide legal advice on image rights. This is a design tool, not a legal or trademark service — talk to a professional if exclusivity matters for your brand.",
      },
      {
        question: "Will the logo be unique to my brand?",
        answer:
          "Each generation is produced fresh from your brand name and style keywords, but similar briefs can produce similar-looking results. Generate a few variations and compare them.",
      },
      {
        question: "What file format do I get?",
        answer:
          "A 1024×1024 PNG, with a transparent or white background depending on what you choose before generating.",
      },
      {
        question: "Can I regenerate if I don't like the result?",
        answer:
          "Yes. Regenerate runs a fresh generation from the same brief, at the same credit cost as the first run.",
      },
      {
        question: "Does it check for trademark conflicts?",
        answer:
          "No. It designs a mark from your brief and does not search trademark databases — run your own check before using a logo commercially.",
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "ai-thumbnail-generator",
    name: "AI Thumbnail Generator",
    tagline: "Design a bold thumbnail from a video title.",
    description:
      "Turn a video title, style and platform into a downloadable thumbnail sized to fit.",
    category: "images",
    icon: "Youtube",
    creditCost: 60,
    component: "image-generator",
    outputType: "image",
    imageOutput: {
      sizeField: "platform",
      sizes: {
        youtube: { width: 1280, height: 720 },
        "youtube-shorts": { width: 1080, height: 1920 },
      },
      defaultSize: { width: 1280, height: 720 },
      background: "auto",
    },
    systemPrompt: `You design a single YouTube thumbnail image from a video title and style brief.

Compose a bold, high-contrast image that reads clearly at small sizes: strong subject, simple background, no clutter. Reflect the requested style and, where given, the video's subject from the context field. Do not invent a channel name, subscriber count or logo that was not supplied.

If asked to include the title text, render it large, legible and high-contrast — but keep the composition working even if the rendered text is imperfect, since text inside a generated image is not always reliable.`,
    fields: [
      {
        name: "title",
        label: "Video title",
        type: "text",
        required: true,
        placeholder: "10 Productivity Hacks That Actually Work",
        maxLength: 150,
      },
      {
        name: "context",
        label: "What's the video about? (optional)",
        type: "textarea",
        rows: 3,
        placeholder: "A quick-tips video for remote workers",
        maxLength: 500,
      },
      {
        name: "platform",
        label: "Platform",
        type: "select",
        required: true,
        defaultValue: "youtube",
        options: [
          { label: "YouTube (1280×720)", value: "youtube" },
          { label: "YouTube Shorts (1080×1920)", value: "youtube-shorts" },
        ],
      },
      {
        name: "style",
        label: "Style",
        type: "select",
        defaultValue: "bold-bright",
        options: [
          { label: "Bold & Bright", value: "bold-bright" },
          { label: "Minimal", value: "minimal" },
          { label: "Cinematic", value: "cinematic" },
          { label: "Tech & Gaming", value: "tech-gaming" },
          { label: "Tutorial Clean", value: "tutorial-clean" },
          { label: "Vlog Lifestyle", value: "vlog-lifestyle" },
        ],
      },
      {
        name: "includeTitleText",
        label: "Include the title as text on the image",
        type: "select",
        defaultValue: "no",
        options: [
          { label: "No", value: "no" },
          { label: "Yes", value: "yes" },
        ],
        helpText:
          "Text rendered inside an AI image is not always accurate. Off by default so the thumbnail never ships with garbled text.",
      },
    ],
    maxInputChars: 700,
    extraActions: ["download"],
    seoTitle: "AI Thumbnail Generator — YouTube Thumbnail Maker | Oply",
    seoDescription:
      "Oply's AI thumbnail generator is a YouTube thumbnail maker for videos and Shorts: pick a style, generate, and download a bold, click-worthy thumbnail.",
    featured: false,
    sortOrder: 12,
    enabled: true,
    related: ["ai-social-post-graphic"],
    keywords: {
      primary: "ai thumbnail generator",
      secondary: [
        "youtube thumbnail maker",
        "thumbnail maker",
        "ai thumbnail maker",
        "youtube thumbnail generator",
        "video thumbnail creator",
        "custom thumbnail generator",
        "thumbnail design tool",
      ],
      longTail: [
        "generate a youtube thumbnail with ai",
        "create a bold thumbnail for a video",
        "make a thumbnail for a youtube short",
        "design a tutorial video thumbnail",
        "generate a gaming video thumbnail",
        "create a thumbnail without using photoshop",
        "make a thumbnail from a video title",
        "design a cinematic style video thumbnail",
        "generate a vlog style thumbnail image",
      ],
      entities: [
        "YouTube thumbnail",
        "click-through rate",
        "video SEO",
        "thumbnail dimensions",
        "aspect ratio",
        "YouTube Shorts",
        "video marketing",
        "graphic design",
        "composition",
      ],
      questions: [
        "What size is a YouTube thumbnail?",
        "Will the AI put my title text on the thumbnail accurately?",
        "Can I make a thumbnail for YouTube Shorts?",
        "How many credits does this cost?",
        "Can I regenerate a thumbnail I don't like?",
      ],
      intent: "commercial",
    },
    benefits: [
      {
        title: "Sized to fit, every time",
        body: "Choose YouTube or YouTube Shorts and the thumbnail generator produces the exact 1280×720 or 1080×1920 pixels the platform expects.",
      },
      {
        title: "Six styles to match your channel",
        body: "Bold & Bright, Minimal, Cinematic, Tech & Gaming, Tutorial Clean or Vlog Lifestyle — pick the one that matches your channel's look.",
      },
      {
        title: "Text off by default, on request",
        body: "Rendered text inside an AI image is not always reliable, so title text stays off unless you turn it on.",
      },
    ],
    howItWorks: [
      "Enter the video title and, optionally, what it's about.",
      "Choose the platform and a style.",
      "Generate the thumbnail.",
      "Download it, or regenerate for a different result.",
    ],
    example: {
      label: "Example title",
      value: "10 Productivity Hacks That Actually Work · Bold & Bright · YouTube",
    },
    faq: [
      {
        question: "What size is a YouTube thumbnail?",
        answer:
          "YouTube's recommended size is 1280×720 pixels. YouTube Shorts uses the vertical 1080×1920 frame instead — this generator produces both.",
      },
      {
        question: "Will the AI put my title text on the thumbnail accurately?",
        answer:
          "Not reliably — text rendered inside a generated image can come out garbled. It is off by default; turn it on only if you plan to review the result closely.",
      },
      {
        question: "Can I make a thumbnail for YouTube Shorts?",
        answer: "Yes — choose YouTube Shorts as the platform for a 1080×1920 vertical thumbnail.",
      },
      {
        question: "How many credits does this cost?",
        answer: "60 credits per generation, including any regenerations.",
      },
      {
        question: "Can I regenerate a thumbnail I don't like?",
        answer: "Yes. Regenerate runs a fresh generation from the same brief, at the same credit cost.",
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "ai-social-post-graphic",
    name: "AI Social Post Graphic",
    tagline: "Turn a caption into a sized, on-brand social graphic.",
    description:
      "Generate a social media graphic sized for the platform and format you're posting to, from a caption and a style.",
    category: "images",
    icon: "Share2",
    creditCost: 60,
    component: "image-generator",
    outputType: "image",
    imageOutput: {
      sizeField: "aspectRatio",
      sizes: {
        square: { width: 1080, height: 1080 },
        portrait: { width: 1080, height: 1350 },
        story: { width: 1080, height: 1920 },
        landscape: { width: 1200, height: 630 },
        pin: { width: 1000, height: 1500 },
      },
      defaultSize: { width: 1080, height: 1080 },
      background: "auto",
    },
    systemPrompt: `You design a single social media post graphic from a caption and a style brief.

Compose an image that supports the caption's message without needing to render the caption as text on the image — a strong visual that fits the platform and format, in the requested style. Do not invent a brand name, logo or claim that was not supplied.`,
    fields: [
      {
        name: "caption",
        label: "Caption",
        type: "textarea",
        rows: 3,
        required: true,
        placeholder: "Our new collection just dropped — cozy, sustainable, made to last.",
        maxLength: 300,
      },
      {
        name: "platform",
        label: "Platform",
        type: "select",
        defaultValue: "instagram",
        options: [
          { label: "Instagram", value: "instagram" },
          { label: "Facebook", value: "facebook" },
          { label: "X (Twitter)", value: "x" },
          { label: "LinkedIn", value: "linkedin" },
          { label: "Pinterest", value: "pinterest" },
          { label: "TikTok", value: "tiktok" },
        ],
      },
      {
        name: "aspectRatio",
        label: "Format",
        type: "select",
        required: true,
        defaultValue: "square",
        options: [
          { label: "Square 1:1 (1080×1080)", value: "square" },
          { label: "Portrait 4:5 (1080×1350)", value: "portrait" },
          { label: "Story / Reel 9:16 (1080×1920)", value: "story" },
          { label: "Landscape (1200×630)", value: "landscape" },
          { label: "Pin 2:3 (1000×1500)", value: "pin" },
        ],
      },
      {
        name: "style",
        label: "Style",
        type: "select",
        defaultValue: "bold",
        options: [
          { label: "Bold", value: "bold" },
          { label: "Minimal", value: "minimal" },
          { label: "Photographic", value: "photographic" },
          { label: "Illustrated", value: "illustrated" },
        ],
      },
    ],
    maxInputChars: 500,
    extraActions: ["download"],
    seoTitle: "AI Social Post Graphic Generator | Oply",
    seoDescription:
      "Oply's AI social post graphic generator is a social media graphic maker and Instagram post generator: turn a caption into a sized, on-brand graphic.",
    featured: false,
    sortOrder: 13,
    enabled: true,
    related: ["ai-thumbnail-generator"],
    keywords: {
      primary: "ai social post graphic generator",
      secondary: [
        "social media graphic maker",
        "instagram post generator",
        "social post image generator",
        "ai instagram graphic maker",
        "social media image generator",
        "content graphic generator",
        "social post design tool",
      ],
      longTail: [
        "generate an instagram post graphic with ai",
        "create a square social media graphic",
        "make a story image for instagram",
        "design a pinterest pin with ai",
        "generate a facebook post image",
        "create a linkedin post graphic",
        "make a social graphic from a caption",
        "generate a photographic style social post",
        "design an illustrated social media graphic",
      ],
      entities: [
        "social media graphic",
        "Instagram post",
        "aspect ratio",
        "Story format",
        "Pinterest pin",
        "engagement",
        "visual content",
        "social media marketing",
        "brand consistency",
        "graphic design",
      ],
      questions: [
        "What size should an Instagram post be?",
        "Can I generate a story or reel size graphic?",
        "Does it work for Pinterest pins?",
        "Can I use my own caption text?",
        "How many credits does this cost?",
      ],
      intent: "commercial",
    },
    benefits: [
      {
        title: "Sized for the format you need",
        body: "Square, portrait, story or reel, landscape, or a Pinterest pin — pick the format and the graphic comes out at the right pixels.",
      },
      {
        title: "Four visual styles",
        body: "Bold, minimal, photographic or illustrated — matched to your caption and platform.",
      },
      {
        title: "One caption, one graphic",
        body: "Write the caption once and generate the visual to go with it, instead of starting from a blank canvas.",
      },
    ],
    howItWorks: [
      "Write the caption for your post.",
      "Choose the platform, format and style.",
      "Generate the graphic.",
      "Download it, or regenerate for a different result.",
    ],
    example: {
      label: "Example caption",
      value: "Our new collection just dropped — cozy, sustainable, made to last.",
    },
    faq: [
      {
        question: "What size should an Instagram post be?",
        answer:
          "Instagram's feed formats are 1080×1080 (square) or 1080×1350 (portrait) — both are available as a format option here.",
      },
      {
        question: "Can I generate a story or reel size graphic?",
        answer: "Yes — choose the Story / Reel format for a 1080×1920 vertical graphic.",
      },
      {
        question: "Does it work for Pinterest pins?",
        answer: "Yes — the Pin format produces a 1000×1500 graphic sized for Pinterest.",
      },
      {
        question: "Can I use my own caption text?",
        answer:
          "Your caption guides what the graphic depicts, but the generator does not reliably render caption text onto the image itself — add text in your platform's own post composer if you need it.",
      },
      {
        question: "How many credits does this cost?",
        answer: "60 credits per generation, including any regenerations.",
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "ai-product-photo-generator",
    name: "AI Product Photo Generator",
    tagline: "Restage a product photo for the platform you sell on.",
    description:
      "Upload a product photo and generate a new setting around it — studio white, a lifestyle scene, or a platform-sized listing image.",
    category: "images",
    icon: "Camera",
    creditCost: 110,
    component: "image-generator",
    outputType: "image",
    imageOutput: {
      sizeField: "platform",
      sizes: {
        amazon: { width: 1000, height: 1000 },
        shopify: { width: 2000, height: 2000 },
        "instagram-shop": { width: 1080, height: 1080 },
      },
      defaultSize: { width: 1000, height: 1000 },
      inputImageField: "productImage",
      background: "auto",
    },
    systemPrompt: `You restage a product photo for e-commerce, using the uploaded image as the subject.

Keep the product itself as the clear subject and change only the setting around it, in line with the requested background. Do not add packaging, labels, text or claims that were not in the source image or the supplied context. This is a generative restaging, not a pixel-exact crop — keep the product recognisable, but treat fine detail as approximate.`,
    fields: [
      {
        name: "productImage",
        label: "Product photo",
        type: "image",
        required: true,
      },
      {
        name: "background",
        label: "Background",
        type: "select",
        required: true,
        defaultValue: "studio-white",
        options: [
          { label: "Studio White", value: "studio-white" },
          { label: "Lifestyle Scene", value: "lifestyle-scene" },
          { label: "Outdoor Natural Light", value: "outdoor-natural" },
          { label: "Marble & Luxury Surface", value: "marble-luxury" },
          { label: "Solid Color Backdrop", value: "solid-color" },
          { label: "Custom", value: "custom" },
        ],
      },
      {
        name: "productContext",
        label: "Product details (optional)",
        type: "textarea",
        rows: 3,
        placeholder: "A ceramic pour-over coffee dripper, matte black",
        maxLength: 300,
        helpText: "Describe the product or the scene you want — useful for any background choice, required for Custom.",
      },
      {
        name: "platform",
        label: "Platform",
        type: "select",
        required: true,
        defaultValue: "amazon",
        options: [
          { label: "Amazon (1000×1000)", value: "amazon" },
          { label: "Shopify / Website (2000×2000)", value: "shopify" },
          { label: "Instagram Shop (1080×1080)", value: "instagram-shop" },
        ],
      },
    ],
    maxInputChars: 500,
    extraActions: ["download"],
    seoTitle: "AI Product Photo Generator | Oply",
    seoDescription:
      "Oply's AI product photo generator is a product photography generator and ecommerce photo generator: upload a photo, pick a background, get a platform-sized image.",
    featured: false,
    sortOrder: 14,
    enabled: true,
    related: ["ai-background-remover", "product-description-generator"],
    keywords: {
      primary: "ai product photo generator",
      secondary: [
        "product photography generator",
        "ai product photography",
        "shopify product photo generator",
        "amazon product image generator",
        "product background generator",
        "product photo editor",
        "ecommerce photo generator",
      ],
      longTail: [
        "generate a product photo with ai",
        "create a studio product photo online",
        "make an amazon product listing photo",
        "generate a lifestyle product photo",
        "create a white background product photo",
        "design a product photo for shopify",
        "generate a marble background product shot",
        "make a product photo look professionally staged",
      ],
      entities: [
        "product photography",
        "studio lighting",
        "ecommerce listing",
        "white background",
        "lifestyle photography",
        "product staging",
        "Amazon listing image",
        "conversion rate",
        "visual merchandising",
      ],
      questions: [
        "Does Amazon require a white background?",
        "Can I use my own product photo as a starting point?",
        "What image sizes do I get?",
        "Will it change my actual product?",
        "How many credits does this cost?",
      ],
      intent: "commercial",
    },
    benefits: [
      {
        title: "Start from your real product",
        body: "Upload the photo you already have — the product photo generator restages the setting around it instead of starting from nothing.",
      },
      {
        title: "Sized for where you sell",
        body: "Amazon, Shopify or a website, and Instagram Shop each get their own exact pixel size.",
      },
      {
        title: "Six background directions",
        body: "Studio white, a lifestyle scene, outdoor natural light, marble, a solid color, or your own custom description.",
      },
    ],
    howItWorks: [
      "Upload a photo of your product.",
      "Choose a background and, optionally, describe the product or scene.",
      "Pick the platform size and generate.",
      "Download the result, or regenerate for a different take.",
    ],
    example: {
      before: "A product photo with a cluttered kitchen counter behind it",
      label: "Example result",
      value: "The same product, restaged on a clean studio white background",
    },
    faq: [
      {
        question: "Does Amazon require a white background?",
        answer:
          "Amazon's main product image policy calls for a pure white background. Choose Studio White and the Amazon platform size to match it.",
      },
      {
        question: "Can I use my own product photo as a starting point?",
        answer:
          "Yes — upload a photo of your product and describe the background you want. This is a generative restaging, not a guaranteed pixel-exact crop, so review the result before using it commercially.",
      },
      {
        question: "What image sizes do I get?",
        answer:
          "Amazon (1000×1000), Shopify or a website (2000×2000), or Instagram Shop (1080×1080) — pick the platform and the output matches.",
      },
      {
        question: "Will it change my actual product?",
        answer:
          "It is instructed to keep your product as the subject and change only the setting around it, but this is a generative model rather than a background-only crop — always review the result before publishing.",
      },
      {
        question: "How many credits does this cost?",
        answer: "110 credits per generation, including any regenerations.",
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "ai-background-remover",
    name: "AI Background Remover",
    tagline: "Remove or replace the background behind your subject.",
    description:
      "Upload an image and remove the background, replace it with a solid color, or describe a new scene.",
    category: "images",
    icon: "Eraser",
    creditCost: 90,
    component: "image-generator",
    outputType: "image",
    imageOutput: {
      defaultSize: { width: 1024, height: 1024 },
      inputImageField: "sourceImage",
      skipExactFit: true,
      backgroundField: "mode",
      backgroundValues: {
        remove: "transparent",
        "solid-color": "opaque",
        scene: "opaque",
      },
    },
    systemPrompt: `You edit the background of an uploaded image, keeping the main subject intact.

If asked to remove the background, produce a clean cutout of the subject on a transparent background. If asked to replace it with a solid color or a described scene, keep the subject as the clear foreground and compose the new background around it. Do not alter the subject itself beyond what removing or replacing the background requires.`,
    fields: [
      {
        name: "sourceImage",
        label: "Image",
        type: "image",
        required: true,
      },
      {
        name: "mode",
        label: "Mode",
        type: "select",
        required: true,
        defaultValue: "remove",
        options: [
          { label: "Remove Background (Transparent)", value: "remove" },
          { label: "Replace with Solid Color", value: "solid-color" },
          { label: "Replace with Scene Description", value: "scene" },
        ],
      },
      {
        name: "replacementColor",
        label: "Replacement color",
        type: "text",
        placeholder: "Sky blue",
        maxLength: 60,
        showWhen: { field: "mode", equals: ["solid-color"] },
      },
      {
        name: "replacementScene",
        label: "Describe the new background",
        type: "textarea",
        rows: 3,
        placeholder: "A sunlit wooden desk with soft shadows",
        maxLength: 300,
        showWhen: { field: "mode", equals: ["scene"] },
      },
    ],
    maxInputChars: 400,
    extraActions: ["download"],
    seoTitle: "AI Background Remover — Remove or Replace | Oply",
    seoDescription:
      "Oply's AI background remover is a background removal tool and background replacer: remove it to transparent, or replace it with a color or scene.",
    featured: false,
    sortOrder: 15,
    enabled: true,
    related: ["ai-product-photo-generator", "ai-rewriter"],
    keywords: {
      primary: "ai background remover",
      secondary: [
        "background removal tool",
        "remove image background",
        "background replacer",
        "ai background eraser",
        "transparent background maker",
        "photo background remover",
        "change image background",
      ],
      longTail: [
        "remove the background from a photo online",
        "replace a photo background with ai",
        "make a product photo background transparent",
        "change a photo background to a solid color",
        "generate a new background for a photo",
        "remove a background without using photoshop",
        "create a transparent png from a photo",
        "isolate a subject from its background",
      ],
      entities: [
        "background removal",
        "image matting",
        "transparent PNG",
        "photo editing",
        "compositing",
        "alpha channel",
        "product photography",
        "image inpainting",
      ],
      questions: [
        "Does this perfectly cut out the subject like a dedicated background remover?",
        "Can I replace the background with a colour instead of removing it?",
        "Can I describe a new scene for the background?",
        "What file format do I get?",
        "How many credits does this cost?",
      ],
      intent: "commercial",
    },
    benefits: [
      {
        title: "Three ways to change a background",
        body: "Remove it to transparent, swap it for a solid color, or describe a whole new scene.",
      },
      {
        title: "Keeps the subject as the focus",
        body: "The subject stays intact while only the background around it changes.",
      },
      {
        title: "One upload, download-ready",
        body: "Upload an image, pick a mode, and download a PNG sized to match your original.",
      },
    ],
    howItWorks: [
      "Upload the image you want to edit.",
      "Choose remove, solid color, or a described scene.",
      "Generate the result.",
      "Download it, or regenerate for a different take.",
    ],
    example: {
      before: "A product photo with a cluttered kitchen counter behind it",
      label: "Example result",
      value: "The same product, isolated on a transparent background",
    },
    faq: [
      {
        question: "Does this perfectly cut out the subject like a dedicated background remover?",
        answer:
          "Not always. This is a generative-edit approximation, not pixel-perfect matting — check fine detail like hair or transparent edges before using the result commercially.",
      },
      {
        question: "Can I replace the background with a colour instead of removing it?",
        answer: "Yes — choose Replace with Solid Color and enter the colour you want.",
      },
      {
        question: "Can I describe a new scene for the background?",
        answer:
          "Yes — choose Replace with Scene Description and describe the setting you want behind the subject.",
      },
      {
        question: "What file format do I get?",
        answer:
          "A PNG file. Transparent mode produces an alpha-channel PNG; the two replace modes produce a flat PNG with the new background.",
      },
      {
        question: "How many credits does this cost?",
        answer: "90 credits per generation, including any regenerations.",
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Coming soon (display only — never rendered as usable tools)         */
/* ------------------------------------------------------------------ */

export interface ComingSoonTool {
  name: string;
  description: string;
  category: string;
  icon: string;
}

export const comingSoonTools: ComingSoonTool[] = [
  {
    name: "AI Email Writer",
    description: "Draft outreach, follow-ups and updates from a short brief.",
    category: "business",
    icon: "Mail",
  },
  {
    name: "FAQ Generator",
    description: "Turn a page or product into the questions readers actually ask.",
    category: "seo",
    icon: "HelpCircle",
  },
  {
    name: "Alt Text Generator",
    description: "Write accessible, descriptive alt text for images at scale.",
    category: "seo",
    icon: "Image",
  },
  {
    name: "YouTube Title Generator",
    description: "Title and thumbnail text options for a video topic.",
    category: "creator",
    icon: "Youtube",
  },
  {
    name: "Social Caption Generator",
    description: "Platform-shaped captions from one piece of source content.",
    category: "marketing",
    icon: "Share2",
  },
  {
    name: "Ad Copy Generator",
    description: "Headlines and body copy for search and social campaigns.",
    category: "marketing",
    icon: "Target",
  },
  {
    name: "Landing Page Copy",
    description: "Hero, features, objections and CTA for a single offer.",
    category: "marketing",
    icon: "LayoutTemplate",
  },
  {
    name: "Proposal Generator",
    description: "Scope, deliverables and timeline from a project brief.",
    category: "business",
    icon: "FileText",
  },
];

/* ------------------------------------------------------------------ */
/* Registry helpers                                                    */
/* ------------------------------------------------------------------ */

export const toolMap = new Map(tools.map((t) => [t.slug, t]));

export function getTool(slug: string): ToolDefinition | undefined {
  return toolMap.get(slug);
}

export function getEnabledTools(): ToolDefinition[] {
  return tools
    .filter((t) => t.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getFeaturedTools(limit = 6): ToolDefinition[] {
  return getEnabledTools()
    .filter((t) => t.featured)
    .slice(0, limit);
}

export function getToolsByCategory(categorySlug: string): ToolDefinition[] {
  return getEnabledTools().filter((t) => t.category === categorySlug);
}

/** Categories that actually contain at least one enabled tool. */
export function getActiveCategorySlugs(): string[] {
  return Array.from(new Set(getEnabledTools().map((t) => t.category)));
}

export function isNewTool(
  tool: Pick<ToolDefinition, "newUntil">,
  now = new Date(),
): boolean {
  return Boolean(tool.newUntil && new Date(tool.newUntil) > now);
}

/**
 * True when a conditional field should be shown/used for the given input —
 * e.g. Background Remover's "replacement colour" only applies when its mode
 * is set to "Replace with Solid Color". Shared by the workspace's field list
 * (what renders) and buildUserPrompt (what reaches the model), so a hidden
 * field's stale value never leaks into a generation it doesn't apply to.
 */
export function isFieldVisible(
  field: ToolField,
  input: Record<string, string>,
): boolean {
  if (!field.showWhen) return true;
  return field.showWhen.equals.includes(input[field.showWhen.field] ?? "");
}

/**
 * The browser-safe shape of a tool. `systemPrompt` and `outputSchema` are
 * server concerns and are deliberately dropped.
 */
export type PublicTool = Omit<ToolDefinition, "systemPrompt" | "outputSchema">;

export function toPublicTool(tool: ToolDefinition): PublicTool {
  const { systemPrompt: _p, outputSchema: _s, ...rest } = tool;
  return rest;
}

export function getPublicTools(): PublicTool[] {
  return getEnabledTools().map(toPublicTool);
}

/**
 * Relevance search over name, category and the tool's semantic keyword map.
 *
 * Name and category still outrank everything, so typing a tool's name never
 * loses to a keyword match. Below them the keyword layers are weighted by how
 * specific they are: owning a head term beats being a synonym, which beats
 * merely co-occurring with a concept. This is what makes "paraphrase" find the
 * AI Rewriter even though the word appears nowhere in its name or description.
 */
export function searchTools(query: string): ToolDefinition[] {
  const q = query.trim().toLowerCase();
  if (!q) return getEnabledTools();

  const hits = (terms: string[]) =>
    terms.some((term) => term.toLowerCase().includes(q));

  return getEnabledTools()
    .map((tool) => {
      const haystack = [
        tool.name,
        tool.slug.replace(/-/g, " "),
        tool.description,
        tool.tagline,
        tool.category,
      ]
        .join(" ")
        .toLowerCase();
      let score = 0;
      if (tool.name.toLowerCase().startsWith(q)) score += 100;
      if (tool.name.toLowerCase().includes(q)) score += 50;
      if (tool.category.includes(q)) score += 25;
      if (tool.keywords.primary.toLowerCase().includes(q)) score += 80;
      if (hits(tool.keywords.secondary)) score += 40;
      if (hits(tool.keywords.longTail) || hits(tool.keywords.entities)) score += 15;
      if (haystack.includes(q)) score += 10;
      return { tool, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.tool.sortOrder - b.tool.sortOrder)
    .map((r) => r.tool);
}

/**
 * The flat keyword list a page emits as `<meta name="keywords">`. Ordered
 * most-relevant-first and capped, because a 40-term list is noise.
 */
export function toolMetaKeywords(tool: ToolDefinition, limit = 15): string[] {
  return Array.from(
    new Set([
      tool.keywords.primary,
      ...tool.keywords.secondary,
      ...tool.keywords.longTail,
    ]),
  ).slice(0, limit);
}
