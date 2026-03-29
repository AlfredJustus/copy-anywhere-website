import { ConverterApp } from "@/components/ConverterApp";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { LogoIcon } from "@/components/LogoIcon";
import {
  MODELS, FORMATS, CWS_LISTING_URL,
  isValidModel, isValidFormat,
  type ModelSlug, type FormatSlug,
} from "@/lib/config/models";
import type { Metadata } from "next";

type Props = { params: Promise<{ model: string; format: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { model, format } = await params;
  const modelSlug = model.toLowerCase();
  const formatSlug = format.toLowerCase();

  if (!isValidModel(modelSlug) || !isValidFormat(formatSlug)) {
    return { title: "Converter – Copy Anywhere" };
  }

  const m = MODELS[modelSlug];
  const f = FORMATS[formatSlug];

  return {
    title: `${m.label} to ${f.label} – Copy Anywhere`,
    description: `Copy math, code, tables, and formatted text from ${m.seo}. Paste perfectly as ${f.seo}. Free online tool.`,
  };
}

export function generateStaticParams() {
  return Object.keys(MODELS).flatMap((model) =>
    Object.keys(FORMATS).map((format) => ({ model, format }))
  );
}

const otherFormats = (current: FormatSlug) =>
  (Object.entries(FORMATS) as [FormatSlug, (typeof FORMATS)[FormatSlug]][])
    .filter(([slug]) => slug !== current);

export default async function ModelFormatPage({ params }: Props) {
  const { model, format } = await params;
  const modelSlug = model.toLowerCase() as ModelSlug;
  const formatSlug = format.toLowerCase() as FormatSlug;

  if (!isValidModel(modelSlug)) redirect("/convert/chatgpt/notion");
  if (!isValidFormat(formatSlug)) redirect(`/convert/${modelSlug}/notion`);

  const m = MODELS[modelSlug];
  const f = FORMATS[formatSlug];

  return (
    <main className="mx-auto max-w-2xl px-6 py-10 flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col items-center text-center gap-3">
        <Link
          href="/"
          className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
        >
          &larr; Back to tools
        </Link>

        <div className="flex items-center gap-3">
          <LogoIcon src={m.logo} alt={m.label} size={40} shape="rounded" />
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
            <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
          </svg>
          <LogoIcon src={f.logo} alt={f.label} size={40} shape="rounded" invertDark={formatSlug === "notion"} />
        </div>

        <h1 className="font-serif text-3xl font-bold tracking-tight">
          {m.label} to {f.label}
        </h1>

        <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
          Copy math, code, tables, and rich text from {m.label}. Paste with perfect formatting into {f.label}.
        </p>

        <div className="flex flex-wrap justify-center gap-1.5">
          <Badge variant="outline">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 7V4H6l6 8-6 8h12v-3" /></svg>
            Math &amp; LaTeX
          </Badge>
          <Badge variant="outline">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
            Code blocks
          </Badge>
          <Badge variant="outline">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M3 15h18" /><path d="M9 3v18" /></svg>
            Tables
          </Badge>
          <Badge variant="outline">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
            Rich text
          </Badge>
          <Badge variant="outline">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
            Nested lists
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground">
          Also available:{" "}
          {otherFormats(formatSlug).map(([slug, fmt], i) => (
            <span key={slug}>
              {i > 0 && " | "}
              <Link
                href={`/convert/${modelSlug}/${slug}`}
                className="underline underline-offset-2 hover:text-foreground"
              >
                {fmt.label}
              </Link>
            </span>
          ))}
        </p>
      </header>

      {/* Converter tool */}
      <ConverterApp modelSlug={modelSlug} formatSlug={formatSlug} />

      {/* SEO content */}
      <article className="flex flex-col gap-6 text-sm text-muted-foreground leading-relaxed mt-4">
        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">How it works</h2>
          <ol className="list-decimal list-inside flex flex-col gap-1.5">
            <li>Copy content from {m.label} (select text and press ⌘C / Ctrl+C)</li>
            <li>Paste on this page — click the paste zone or press ⌘V / Ctrl+V anywhere</li>
            <li>Click &ldquo;Copy to {f.label}&rdquo; and paste into {f.label}</li>
          </ol>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">What&apos;s supported</h2>
          <ul className="list-disc list-inside flex flex-col gap-1.5">
            <li>Math and LaTeX equations — rendered perfectly in {f.label}</li>
            <li>Code blocks with syntax highlighting</li>
            <li>Tables with headers and alignment</li>
            <li>Nested lists (ordered and unordered, any depth)</li>
            <li>Bold, italic, strikethrough, links, and inline code</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">Why use this</h2>
          <p>
            Copy-pasting directly from {m.label} to {f.label} strips formatting, breaks math
            equations, and ruins tables. Copy Anywhere preserves every detail — so your content
            looks exactly how {m.label} rendered it, right inside {f.label}.
          </p>
        </section>
      </article>

      {/* Extension CTA */}
      <section className="text-center py-6 border-t border-border mt-2">
        <p className="text-base font-semibold text-foreground">
          You wouldn&apos;t need this page.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          ⌘C in {m.label}. Paste into {f.label}. Already formatted.
        </p>
        <a
          href={CWS_LISTING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-4 px-6 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold transition-opacity hover:opacity-90"
        >
          Get the Chrome Extension
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
        </a>
      </section>
    </main>
  );
}
