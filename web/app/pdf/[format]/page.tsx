import { PdfConverterTool } from "@/components/PdfConverterTool";
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

  if (!isValidFormat(formatSlug)) {
    return { title: "PDF Converter – Copy Anywhere" };
  }

  const f = FORMATS[formatSlug];

  const title = `Convert Any PDF to ${f.label} – Copy Anywhere`;
  const description = `Upload any PDF and convert it to ${f.seo} with OCR-powered accuracy. Math, code, tables, and formatting preserved. Free online tool.`;
  const url = `${SITE_URL}/pdf/${formatSlug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url },
  };
}

export function generateStaticParams() {
  return Object.keys(FORMATS).filter((f) => f !== "pdf").map((format) => ({ format }));
}

export default async function PdfFormatPage({ params }: Props) {
  const { format } = await params;
  const formatSlug = format.toLowerCase() as FormatSlug;

  if (!isValidFormat(formatSlug) || formatSlug === "pdf") redirect("/pdf/notion");

  const f = FORMATS[formatSlug];

  return (
    <main className="mx-auto max-w-2xl px-6 py-10 flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col items-center text-center gap-3">
        <div className="flex items-center gap-3">
          <div className="size-10 flex items-center justify-center rounded-lg bg-secondary text-primary [&_svg]:size-6">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
            <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
          </svg>
          <LogoIcon src={f.logo} alt={f.label} size={40} shape="rounded"  />
        </div>

        <h1 className="page-title text-3xl">
          Convert any PDF to {f.label}
        </h1>

        <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
          Upload any PDF and convert it to {f.seo} with OCR-powered accuracy. Math, tables, and formatting preserved.
        </p>

        <div className="flex flex-wrap justify-center gap-1.5">
          <Badge variant="outline">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>
            OCR powered
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
          <Badge variant="outline">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
            Rich text
          </Badge>
        </div>

      </header>

      {/* Converter tool */}
      <PdfConverterTool formatSlug={formatSlug} />

      {/* SEO content */}
      <article className="flex flex-col gap-6 text-sm text-muted-foreground leading-relaxed mt-4">
        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">How it works</h2>
          <ol className="list-decimal list-inside flex flex-col gap-1.5">
            <li>Drop or select a PDF file (up to 10 pages)</li>
            <li>Each page is OCR-processed to extract text, math, and tables</li>
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
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">Why use this</h2>
          <p>
            PDFs lock content in a fixed layout that doesn&apos;t paste cleanly into {f.label}.
            Copy Anywhere uses OCR to extract and reformat everything — so your math, tables,
            and rich text look perfect inside {f.label}.
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
