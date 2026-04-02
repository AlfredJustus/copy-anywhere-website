import type { Metadata } from "next";
import Link from "next/link";
import { FORMATS, buildFormatMetadata } from "@/lib/config/models";
import { FormatLandingPage } from "@/components/FormatLandingPage";

const f = FORMATS["google-docs"];

export const metadata: Metadata = buildFormatMetadata(f.label, f.seo, "/google-docs");

export default function GoogleDocsPage() {
  return (
    <FormatLandingPage
      formatSlug="google-docs"
      displayName={f.label}
      logo={f.logo}
      canonicalPath="/google-docs"
      howTo={{
        name: "How to paste anything into Google Docs with formatting",
        description: "Convert any content into formatted HTML that pastes perfectly into Google Docs with math, code, and tables.",
        steps: [
          { name: "Copy your content", text: "Select and copy content from any website, AI chat, PDF, or image." },
          { name: "Paste into Copy Anywhere", text: "Paste or drop your content into the converter on this page." },
          { name: "Copy to Google Docs", text: "Click the 'Copy to Google Docs' button to copy the formatted HTML." },
          { name: "Paste into Google Docs", text: "Press Cmd+V (or Ctrl+V) in Google Docs. Your content appears with all formatting intact." },
        ],
      }}
      headerDescription={`Paste from any website, drop a PDF, or drop an image. Math, code, and tables land perfectly in ${f.label}.`}
      faqItems={[
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
      ]}
      extraConverterLinks={
        <Link
          href="/notion-import/google-docs"
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
      }
    />
  );
}
