import Link from "next/link";
import Image from "next/image";
import { UniversalTool } from "@/components/UniversalTool";
import { LogoIcon } from "@/components/LogoIcon";
import { MODELS, FORMATS, CWS_LISTING_URL } from "@/lib/config/models";

const MODEL_ENTRIES = Object.values(MODELS);
const FORMAT_ENTRIES = Object.entries(FORMATS) as [string, (typeof FORMATS)[keyof typeof FORMATS]][];

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-6 flex flex-col gap-8">
      {/* Top bar */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Image
            src="/logo.svg"
            alt="Copy Anywhere"
            width={32}
            height={32}
            className="rounded-lg shadow-logo"
            priority
          />
          <span className="font-serif text-lg font-semibold tracking-tight">
            Copy Anywhere
          </span>
        </div>
        <Link
          href="/tools"
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Browse all converters
        </Link>
      </header>

      {/* Hero tagline */}
      <section className="text-center flex flex-col items-center gap-3">
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-balance leading-tight">
          Copy from any AI, PDF, or image
        </h1>
        <p className="text-muted-foreground text-base max-w-lg text-balance">
          Paste a conversation, drop a PDF, or upload an image — formatting, math, code, and tables are preserved.
        </p>
      </section>

      {/* Input → Output flow */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
        <div className="flex items-center -space-x-2">
          <span className="flex items-center justify-center size-7 rounded-full bg-muted ring-1 ring-border ring-2 ring-background text-[11px] font-bold text-muted-foreground" title="PDFs, images, and more">
            +
          </span>
          {[...MODEL_ENTRIES].reverse().map((m) => (
            <LogoIcon key={m.label} src={m.logo} alt={m.label} size={28} className="ring-2 ring-background" />
          ))}
        </div>

        <svg className="text-muted-foreground shrink-0 hidden sm:block" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
        </svg>
        <svg className="text-muted-foreground shrink-0 sm:hidden rotate-90" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
        </svg>

        <div className="flex items-center -space-x-2">
          {FORMAT_ENTRIES.map(([key, f]) => (
            <LogoIcon key={key} src={f.logo} alt={f.label} size={28} invertDark={key === "notion"} className="ring-2 ring-background" />
          ))}
        </div>
      </div>

      {/* Universal tool */}
      <UniversalTool />

      {/* Extension CTA */}
      <section className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-border bg-card px-5 py-4">
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
    </main>
  );
}
