import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { LogoIcon } from "@/components/LogoIcon";
import { UniversalTool } from "@/components/UniversalTool";
import { MODELS, FORMATS, CWS_LISTING_URL } from "@/lib/config/models";
import { Badge } from "@/components/ui/badge";
import { PageFAQ } from "@/components/PageFAQ";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";
import { HowToSchema } from "@/components/HowToSchema";

const FAQ_ITEMS = [
  {
    q: "How do I paste formatted content into Google Docs?",
    a: "Copy your content with the Google Docs option in Copy Anywhere, then press Cmd+V (or Ctrl+V) in Google Docs. Formatting, tables, and math equations are all preserved as styled HTML.",
  },
  {
    q: "How are equations rendered in Google Docs?",
    a: "Equations are rendered as high-quality SVG images via MathJax, which paste directly into Google Docs as inline images. They look crisp at any zoom level.",
  },
  {
    q: "Can I paste a full AI conversation into Google Docs?",
    a: "Yes. The entire conversation — including code blocks with syntax highlighting, tables, and math — pastes with proper formatting into Google Docs.",
  },
  {
    q: "Do tables keep their structure?",
    a: "Yes. Tables paste as native Google Docs tables with borders, headers, and cell content intact.",
  },
];

const f = FORMATS["google-docs"];
const formatSlug = "google-docs";
const converterBadges = ["Math & LaTeX", "Code blocks", "Tables", "Rich text", "Nested lists"];

export const metadata: Metadata = {
  title: `Paste Anything into ${f.label} – Copy Anywhere`,
  description: `Paste from any website, drop a PDF, or drop an image. Get ${f.seo} with math, code, and tables preserved.`,
  alternates: { canonical: "/google-docs" },
  openGraph: {
    title: `Paste Anything into ${f.label} – Copy Anywhere`,
    description: `Paste from any website, drop a PDF, or drop an image. Get ${f.seo} with math, code, and tables preserved.`,
  },
};

export default function GoogleDocsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10 flex flex-col gap-6">
      <BreadcrumbSchema items={[{ name: "Google Docs", href: "/google-docs" }]} />
      <HowToSchema
        name="How to paste anything into Google Docs with formatting"
        description="Convert any content into formatted HTML that pastes perfectly into Google Docs with math, code, and tables."
        steps={[
          { name: "Copy your content", text: "Select and copy content from any website, AI chat, PDF, or image." },
          { name: "Paste into Copy Anywhere", text: "Paste or drop your content into the converter on this page." },
          { name: "Copy to Google Docs", text: "Click the 'Copy to Google Docs' button to copy the formatted HTML." },
          { name: "Paste into Google Docs", text: "Press Cmd+V (or Ctrl+V) in Google Docs. Your content appears with all formatting intact." },
        ]}
      />
      <header className="flex flex-col items-center text-center gap-3">
        <LogoIcon src={f.logo} alt={f.label} size={48} shape="rounded" />
        <h1 className="page-title text-3xl">
          Paste Anything into {f.label}
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
          Paste from any website, drop a PDF, or drop an image. Math, code, and tables land perfectly in {f.label}.
        </p>
      </header>

      <UniversalTool formatSlug={formatSlug} />

      {/* Specific converters */}
      <section className="flex flex-col gap-3 mt-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">
          All {f.label} converters
        </h2>
        <div className="flex flex-col gap-1.5 rounded-xl border border-border bg-card p-2">
          {Object.entries(MODELS).map(([modelSlug, model]) => (
            <Link
              key={modelSlug}
              href={`/convert/${modelSlug}/${formatSlug}`}
              className="no-underline text-inherit flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-secondary/60 transition-colors group"
            >
              <LogoIcon src={model.logo} alt="" size={20} shape="bare" />
              <span className="text-sm font-medium">{model.label} to {f.label}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
          <div className="border-t border-border mt-1 pt-1">
            <Link
              href={`/pdf/${formatSlug}`}
              className="no-underline text-inherit flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-secondary/60 transition-colors group"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-primary">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <span className="text-sm font-medium">PDF to {f.label}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href={`/image/${formatSlug}`}
              className="no-underline text-inherit flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-secondary/60 transition-colors group"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-primary">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span className="text-sm font-medium">Image to {f.label}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href={`/notion-import/${formatSlug}`}
              className="no-underline text-inherit flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-secondary/60 transition-colors group"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-primary">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              <span className="text-sm font-medium">Notion page to {f.label}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/equation/google-docs"
              className="no-underline text-inherit flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-secondary/60 transition-colors group"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-primary">
                <path d="M18 7V4H6l6 8-6 8h12v-3" />
              </svg>
              <span className="text-sm font-medium">Equation to {f.label}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-1 px-1">
          {converterBadges.map((b) => (
            <Badge key={b} variant="secondary">{b}</Badge>
          ))}
        </div>
      </section>

      <PageFAQ items={FAQ_ITEMS} />

      <section className="text-center py-6 border-t border-border mt-2">
        <p className="text-base font-semibold text-foreground">
          Want this built into your browser?
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Copy from any website. Paste into {f.label}. Already formatted.
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
