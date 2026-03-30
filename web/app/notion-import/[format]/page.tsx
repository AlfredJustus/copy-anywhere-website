import { NotionImportTool } from "@/components/NotionImportTool";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { LogoIcon } from "@/components/LogoIcon";
import {
  FORMATS, CWS_LISTING_URL, SITE_URL,
  isValidFormat,
  type FormatSlug,
} from "@/lib/config/models";
import type { Metadata } from "next";

type Props = { params: Promise<{ format: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { format } = await params;
  const formatSlug = format.toLowerCase();

  if (!isValidFormat(formatSlug) || formatSlug === "notion") {
    return { title: "Notion Import – Copy Anywhere" };
  }

  const f = FORMATS[formatSlug];

  const title = `Export Notion Pages to ${f.label} – Copy Anywhere`;
  const description = `Import any public Notion page and convert it to ${f.seo}. Math, code, tables, and formatting preserved. Free online tool.`;
  const url = `${SITE_URL}/notion-import/${formatSlug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url },
  };
}

const ALLOWED_FORMATS: FormatSlug[] = ["google-docs", "pdf"];

export function generateStaticParams() {
  return ALLOWED_FORMATS.map((format) => ({ format }));
}

export default async function NotionImportFormatPage({ params }: Props) {
  const { format } = await params;
  const formatSlug = format.toLowerCase() as FormatSlug;

  if (!ALLOWED_FORMATS.includes(formatSlug)) redirect("/notion-import");

  const f = FORMATS[formatSlug];

  return (
    <main className="mx-auto max-w-2xl px-6 py-10 flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col items-center text-center gap-3">
        <div className="flex items-center gap-3">
          <LogoIcon src="/logos/notion-logo.svg" alt="Notion" size={40} shape="rounded" />
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
            <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
          </svg>
          <LogoIcon src={f.logo} alt={f.label} size={40} shape="rounded" />
        </div>

        <h1 className="font-serif text-3xl font-bold tracking-tight">
          Export Notion Pages to {f.label}
        </h1>

        <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
          Import any public Notion page and convert it to {f.seo}. Math, tables, and formatting preserved.
        </p>

        <div className="flex flex-wrap justify-center gap-1.5">
          <Badge variant="outline">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
            Public pages
          </Badge>
          <Badge variant="outline">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 7V4H6l6 8-6 8h12v-3" /></svg>
            Math &amp; LaTeX
          </Badge>
          <Badge variant="outline">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M3 15h18" /><path d="M9 3v18" /></svg>
            Tables
          </Badge>
          <Badge variant="outline">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
            Code blocks
          </Badge>
        </div>
      </header>

      {/* Converter tool */}
      <NotionImportTool formatSlug={formatSlug} />

      {/* SEO content */}
      <article className="flex flex-col gap-6 text-sm text-muted-foreground leading-relaxed mt-4">
        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">How it works</h2>
          <ol className="list-decimal list-inside flex flex-col gap-1.5">
            <li>Publish your Notion page to the web (Share &rarr; Publish)</li>
            <li>Paste the page link above</li>
            <li>Click &ldquo;{f.label}&rdquo; to copy, then paste into {f.label}</li>
          </ol>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">What&apos;s supported</h2>
          <ul className="list-disc list-inside flex flex-col gap-1.5">
            <li>Math and LaTeX equations — rendered perfectly in {f.label}</li>
            <li>Code blocks with syntax highlighting</li>
            <li>Tables with headers and alignment</li>
            <li>Bold, italic, links, and structured text</li>
            <li>Headings, lists, quotes, and dividers</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">Why use this</h2>
          <p>
            Moving content out of Notion usually means losing formatting — equations break,
            tables collapse, and code blocks lose their structure. Copy Anywhere reads the
            original Notion blocks and rebuilds them in {f.label}-native format so
            everything pastes perfectly.
          </p>
        </section>
      </article>

      {/* Extension CTA */}
      <section className="text-center py-6 border-t border-border mt-2">
        <p className="text-base font-semibold text-foreground">
          Works for AI chats too.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          ⌘C in ChatGPT or Claude. Paste into {f.label}. Already formatted.
        </p>
        <a
          href={CWS_LISTING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-4 px-6 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold transition-opacity hover:opacity-90"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="21.17" y1="8" x2="12" y2="8"/><line x1="3.95" y1="6.06" x2="8.54" y2="14"/><line x1="10.88" y1="21.94" x2="15.46" y2="14"/></svg>
          Get the Chrome Extension
        </a>
      </section>
    </main>
  );
}
