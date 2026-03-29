import { NotionImportTool } from "@/components/NotionImportTool";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { LogoIcon } from "@/components/LogoIcon";
import { CWS_LISTING_URL } from "@/lib/config/models";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Export Notion Pages to Google Docs – Copy Anywhere",
  description:
    "Paste a public Notion page link and copy the content to Google Docs or Obsidian. Math, code, tables, and formatting preserved.",
  alternates: { canonical: "/notion-import" },
  openGraph: {
    title: "Export Notion Pages to Google Docs – Copy Anywhere",
    description:
      "Paste a public Notion page link and copy the content to Google Docs or Obsidian. Math, code, tables, and formatting preserved.",
  },
};

export default function NotionImportPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10 flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col items-center text-center gap-3">
        <LogoIcon src="/logos/notion-logo.svg" alt="Notion" size={48} shape="rounded" invertDark />

        <h1 className="font-serif text-3xl font-bold tracking-tight">
          Export Notion Pages to Google Docs
        </h1>

        <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
          Paste a public Notion page link and copy the entire page to Google Docs
          or Obsidian. Math, tables, code, and formatting come along for the ride.
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
      <NotionImportTool />

      {/* SEO content */}
      <article className="flex flex-col gap-6 text-sm text-muted-foreground leading-relaxed mt-4">
        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">How it works</h2>
          <ol className="list-decimal list-inside flex flex-col gap-1.5">
            <li>Publish your Notion page to the web (Share &rarr; Publish)</li>
            <li>Paste the page link above</li>
            <li>Click &ldquo;Google Docs&rdquo; to paste into Docs, or &ldquo;Markdown&rdquo; to paste into Obsidian</li>
          </ol>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">Where you can paste</h2>
          <ul className="list-disc list-inside flex flex-col gap-1.5">
            <li><strong>Google Docs</strong> — copies styled HTML that pastes with full formatting</li>
            <li><strong>Obsidian</strong> — copies clean Markdown with equations, code fences, and tables</li>
            <li>Any Markdown editor, Word, or rich-text app</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">What&apos;s supported</h2>
          <ul className="list-disc list-inside flex flex-col gap-1.5">
            <li>Math and LaTeX equations</li>
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
            original Notion blocks and rebuilds them so everything pastes perfectly into
            Google Docs or Obsidian.
          </p>
        </section>
      </article>

      {/* Extension CTA */}
      <section className="text-center py-6 border-t border-border mt-2">
        <p className="text-base font-semibold text-foreground">
          Works for AI chats too.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          ⌘C in ChatGPT or Claude. Paste into Notion, Docs, or Obsidian. Already formatted.
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
