"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ClipboardPaste, FileText, ImageIcon } from "lucide-react";
import { UniversalTool } from "@/components/UniversalTool";
import { LogoIcon } from "@/components/LogoIcon";
import { FORMATS, CWS_LISTING_URL } from "@/lib/config/models";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FORMAT_ENTRIES = Object.entries(FORMATS) as [string, (typeof FORMATS)[keyof typeof FORMATS]][];

const FAQ_ITEMS = [
  {
    q: "What content can I format with Copy Anywhere?",
    a: "Literally anything. Paste from ChatGPT, Claude, Gemini, Grok, DeepSeek, or any other AI chatbot. Copy from websites, blogs, documentation, or emails. Drop a PDF or an image. Copy Anywhere handles it all — math, code blocks, tables, and rich text come through perfectly.",
  },
  {
    q: "How do I paste ChatGPT into Notion without losing formatting?",
    a: "Paste your ChatGPT output into the box above. Copy Anywhere converts it into native Notion blocks — headings, code blocks, tables, and math all transfer perfectly. Just paste the result into Notion.",
  },
  {
    q: "Does it work with math equations and LaTeX?",
    a: "Yes. Math equations are preserved as proper LaTeX when you paste into Notion or Obsidian. Both inline math and display equations are supported, including complex notation like matrices and aligned equations.",
  },
  {
    q: "Can I convert a PDF to Notion or Markdown?",
    a: "Yes — drop a PDF (up to 10 pages) into the converter. Each page is OCR'd and converted to structured blocks you can paste directly into Notion, Obsidian, or Google Docs.",
  },
  {
    q: "What's the difference between the website and the Chrome extension?",
    a: "The website lets you paste, drop PDFs, or drop images for conversion. The Chrome extension works in the background — whenever you copy text from an AI chat, it automatically formats it so you can paste directly into Notion, Obsidian, or Google Docs.",
  },
];

const FORMAT_ROUTES: Record<string, string> = {
  notion: "/notion",
  markdown: "/obsidian",
  "google-docs": "/google-docs",
  pdf: "/pdf-download",
};

export default function Home() {
  const [phase, setPhase] = useState<string>("idle");
  const showHero = phase === "idle" || phase === "processing";
  const resetRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const handler = () => resetRef.current?.();
    window.addEventListener("site-header:logo-click", handler);
    return () => window.removeEventListener("site-header:logo-click", handler);
  }, []);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10 flex flex-col gap-6 sm:gap-8">
      {showHero && (
        <>
          {/* Hero tagline */}
          <section className="text-center flex flex-col items-center gap-3">
            <h1 className="page-title text-3xl sm:text-4xl text-balance leading-tight">
              Paste or drop anything.{" "}
              We format it for you.
            </h1>
            <p className="text-muted-foreground text-base max-w-lg text-balance">
              Paste from any website, drop a PDF, or drop an image — math, code, and tables land perfectly in Notion, Obsidian, or Google Docs.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
              <span>Math, code blocks, and tables stay intact</span>
            </div>
          </section>

          {/* Input → Output flow */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            {/* Input methods */}
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex items-center justify-center size-10 rounded-xl bg-muted">
                  <ClipboardPaste className="size-5 text-muted-foreground" />
                </div>
                <span className="text-[11px] font-medium text-muted-foreground">Paste</span>
              </div>
              <span className="text-[11px] text-muted-foreground/60 self-center -translate-y-1">or</span>
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex items-center justify-center size-10 rounded-xl bg-muted">
                  <FileText className="size-5 text-muted-foreground" />
                </div>
                <span className="text-[11px] font-medium text-muted-foreground">Drop PDF</span>
              </div>
              <span className="text-[11px] text-muted-foreground/60 self-center -translate-y-1">or</span>
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex items-center justify-center size-10 rounded-xl bg-muted">
                  <ImageIcon className="size-5 text-muted-foreground" />
                </div>
                <span className="text-[11px] font-medium text-muted-foreground">Drop image</span>
              </div>
            </div>

            {/* Arrow */}
            <svg className="text-muted-foreground shrink-0 hidden sm:block" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
            </svg>
            <svg className="text-muted-foreground shrink-0 sm:hidden rotate-90" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
            </svg>

            {/* Output formats — linked to dedicated pages */}
            <div className="flex items-center gap-4">
              {FORMAT_ENTRIES.map(([key, f]) => (
                <Link key={key} href={FORMAT_ROUTES[key]} className="flex flex-col items-center gap-1.5 no-underline hover:opacity-80 transition-opacity">
                  <LogoIcon src={f.logo} alt={f.label} size={40} className="ring-2 ring-background" />
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {key === "markdown" ? "Obsidian" : key === "google-docs" ? "Docs" : f.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Universal tool */}
      <UniversalTool onPhaseChange={setPhase} onReset={(fn) => { resetRef.current = fn; }} />

      {/* Extension CTA — hidden when showing results */}
      {showHero && (
        <>
          <section className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-border bg-card px-5 py-4 mt-4 opacity-90">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.svg"
                alt=""
                width={28}
                height={28}
                className="rounded-lg shadow-logo shrink-0"
              />
              <div>
                <p className="text-sm font-semibold">Want this built into your browser?</p>
                <p className="text-xs text-muted-foreground">Copy from AI chats with one click — no pasting needed.</p>
              </div>
            </div>
            <a
              href={CWS_LISTING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="21.17" y1="8" x2="12" y2="8"/><line x1="3.95" y1="6.06" x2="8.54" y2="14"/><line x1="10.88" y1="21.94" x2="15.46" y2="14"/></svg>
              Get Chrome extension
            </a>
          </section>

          {/* FAQ */}
          <section className="mt-8">
            <h2 className="text-xl font-semibold text-center mb-4">Frequently Asked Questions</h2>
            <Accordion defaultValue={[]} className="w-full">
              {FAQ_ITEMS.map((item, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-left text-sm">{item.q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          {/* FAQ JSON-LD */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: FAQ_ITEMS.map((item) => ({
                  "@type": "Question",
                  name: item.q,
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: item.a,
                  },
                })),
              }),
            }}
          />
        </>
      )}
    </main>
  );
}
