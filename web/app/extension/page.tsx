import type { Metadata } from "next";
import Image from "next/image";
import { CWS_LISTING_URL } from "@/lib/config/models";

export const metadata: Metadata = {
  title: "Chrome Extension – Copy Anywhere",
  description:
    "Install once, forget about it. Copy formatted math, tables, code, and rich text from any AI chat or website. Paste perfectly into Notion, Google Docs, or Obsidian.",
  alternates: { canonical: "/extension" },
  openGraph: {
    title: "Chrome Extension – Copy Anywhere",
    description:
      "Install once, forget about it. Copy formatted math, tables, code, and rich text from any AI chat or website.",
  },
};

export default function ExtensionPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 flex flex-col gap-20">
      {/* Hero */}
      <section className="flex flex-col items-center text-center gap-6">
        <div className="extension-hero-tile">
          <h1 className="extension-hero-title">Copy anything.<br />Paste anywhere.</h1>

          <div className="flex justify-center items-end gap-2.5">
            <div className="extension-type-card extension-type-math">
              <span className="font-serif text-[31px] italic font-semibold tracking-tighter">
                x&sup2; + y&sup2;
              </span>
            </div>
            <div className="extension-type-card extension-type-code">
              <svg stroke="currentColor" fill="currentColor" height="24" width="24" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <polygon points="31 16 24 23 22.59 21.59 28.17 16 22.59 10.41 24 9 31 16"/>
                <polygon points="1 16 8 9 9.41 10.41 3.83 16 9.41 21.59 8 23 1 16"/>
                <rect x="5.91" y="15" width="20.17" height="2" transform="translate(-3.6 27.31) rotate(-75)"/>
              </svg>
            </div>
            <div className="extension-type-card extension-type-table">
              <svg viewBox="0 0 64 44" xmlns="http://www.w3.org/2000/svg" fill="none" className="w-[62px] h-[44px]">
                <rect x="1.5" y="1.5" width="61" height="41" rx="10" fill="#FCFEFF" stroke="#A9BBCB" strokeWidth="2"/>
                <path d="M6 16.5H58" stroke="#A9BBCB" strokeWidth="2" strokeLinecap="round"/>
                <path d="M6 27.5H58" stroke="#A9BBCB" strokeWidth="2" strokeLinecap="round"/>
                <path d="M23.5 6V38" stroke="#A9BBCB" strokeWidth="2" strokeLinecap="round"/>
                <path d="M40.5 6V38" stroke="#A9BBCB" strokeWidth="2" strokeLinecap="round"/>
                <rect x="8.5" y="8.5" width="12.5" height="5" rx="2.5" fill="#E7F0F8"/>
                <rect x="26" y="8" width="12" height="6" rx="3" fill="#D4734A"/>
                <rect x="43" y="8.5" width="11.5" height="5" rx="2.5" fill="#E7F0F8"/>
                <rect x="8.5" y="19.5" width="12.5" height="5" rx="2.5" fill="#EEF4F9"/>
                <rect x="26" y="19.5" width="12" height="5" rx="2.5" fill="#EEF4F9"/>
                <rect x="43" y="19.5" width="11.5" height="5" rx="2.5" fill="#E7F0F8"/>
                <rect x="8.5" y="30.5" width="12.5" height="5" rx="2.5" fill="#EEF4F9"/>
                <rect x="26" y="30.5" width="12" height="5" rx="2.5" fill="#EEF4F9"/>
                <rect x="43" y="30.5" width="11.5" height="5" rx="2.5" fill="#EEF4F9"/>
              </svg>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            <span className="extension-editor-chip">
              <Image src="/logos/docs.svg" alt="" width={14} height={14} />
              Google Docs
            </span>
            <span className="extension-editor-chip">
              <Image src="/logos/notion-logo.svg" alt="" width={14} height={14} />
              Notion
            </span>
            <span className="extension-editor-chip">
              <Image src="/logos/obsidian-logo.svg" alt="" width={14} height={14} />
              Obsidian
            </span>
            <span className="extension-editor-chip">
              Any editor
            </span>
          </div>
        </div>

        <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
          Math, tables, code, and formatted text for your document editor.
        </p>

        <a
          href={CWS_LISTING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold transition-opacity hover:opacity-90"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="21.17" y1="8" x2="12" y2="8"/><line x1="3.95" y1="6.06" x2="8.54" y2="14"/><line x1="10.88" y1="21.94" x2="15.46" y2="14"/></svg>
          Get the Chrome Extension
        </a>
      </section>

      {/* Install once */}
      <section className="flex flex-col items-center text-center gap-6 border-t border-border pt-20">
        <div className="flex items-center gap-1.5">
          <kbd className="inline-flex items-center justify-center h-11 min-w-[44px] px-3.5 rounded-xl bg-card border border-border border-b-[3px] text-lg font-extrabold shadow-sm">&#8984;</kbd>
          <span className="text-muted-foreground font-bold">/</span>
          <kbd className="inline-flex items-center justify-center h-11 min-w-[44px] px-3.5 rounded-xl bg-card border border-border border-b-[3px] text-lg font-extrabold shadow-sm">Ctrl</kbd>
          <kbd className="inline-flex items-center justify-center h-11 min-w-[44px] px-3.5 rounded-xl bg-card border border-border border-b-[3px] text-lg font-extrabold shadow-sm">C</kbd>
        </div>
        <h2 className="font-sans text-3xl sm:text-4xl font-extrabold tracking-tight">
          Install it once. Forget about it.
        </h2>
        <p className="text-muted-foreground text-lg leading-relaxed max-w-sm">
          Works in the background. Just paste and it&apos;s done.
        </p>
      </section>

      {/* Capture */}
      <section className="flex flex-col items-center text-center gap-6 border-t border-border pt-20">
        <h2 className="font-sans text-3xl sm:text-4xl font-extrabold tracking-tight">
          Capture images and PDFs.
        </h2>
        <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
          Select what you need. AI extracts clean text, math, and structure.
        </p>

        <div className="relative w-full max-w-[920px] aspect-[900/460] rounded-2xl shadow-lg overflow-hidden border border-border bg-white">
          <Image
            src="/mathPDF.png"
            alt="PDF with math equations"
            fill
            className="object-cover object-[center_20%]"
          />
          <div className="absolute top-[26%] left-[5%] w-[90%] h-[65%] border-[3.5px] border-primary rounded-xl z-10 extension-selection-pulse">
            <div className="absolute -bottom-[35px] -right-5 bg-foreground p-2.5 rounded-2xl shadow-lg border border-primary/20">
              <span className="block bg-primary text-primary-foreground px-5 py-3.5 rounded-xl text-sm font-extrabold">
                AI Extract
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mt-2">
          <span className="extension-feature-pill">PDFs and Slides</span>
          <span className="extension-feature-pill">Smart OCR</span>
          <span className="extension-feature-pill">Perfect Formatting</span>
        </div>
      </section>

      {/* AI chats */}
      <section className="flex flex-col items-center text-center gap-6 border-t border-border pt-20">
        <h2 className="font-sans text-3xl sm:text-4xl font-extrabold tracking-tight">
          Works with AI chats too.
        </h2>
        <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
          Fully functional with Gemini, xAI, DeepSeek, Claude, and ChatGPT.
        </p>

        <div className="flex flex-wrap justify-center gap-5 sm:gap-7 mt-2">
          {[
            { src: "/logos/gemini.svg", alt: "Gemini" },
            { src: "/logos/xai.svg", alt: "xAI" },
            { src: "/logos/deepseek.svg", alt: "DeepSeek" },
            { src: "/logos/claude.svg", alt: "Claude" },
            { src: "/logos/openai.svg", alt: "ChatGPT" },
          ].map(({ src, alt }) => (
            <div
              key={alt}
              className="w-[120px] sm:w-[156px] h-[100px] sm:h-[132px] grid place-items-center rounded-3xl bg-card border border-border shadow-sm"
            >
              <Image src={src} alt={alt} width={72} height={72} className="w-14 sm:w-[72px] h-14 sm:h-[72px] object-contain" />
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="flex flex-col items-center text-center gap-4 border-t border-border pt-16 pb-4">
        <p className="text-base font-semibold text-foreground">
          Ready to try it?
        </p>
        <a
          href={CWS_LISTING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold transition-opacity hover:opacity-90"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="21.17" y1="8" x2="12" y2="8"/><line x1="3.95" y1="6.06" x2="8.54" y2="14"/><line x1="10.88" y1="21.94" x2="15.46" y2="14"/></svg>
          Get the Chrome Extension
        </a>
      </section>
    </main>
  );
}
