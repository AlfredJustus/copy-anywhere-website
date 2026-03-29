import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { LogoIcon } from "@/components/LogoIcon";
import { MODELS, FORMATS, CWS_LISTING_URL } from "@/lib/config/models";

const converterBadges = ["Math & LaTeX", "Code blocks", "Tables", "Rich text", "Nested lists"];

export const metadata: Metadata = {
  title: "All Tools – Copy Anywhere",
  description:
    "Browse every converter: ChatGPT, Claude, Gemini, DeepSeek, and Grok to Notion, Markdown, or Google Docs. Plus PDF converters.",
};

export default function ToolsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10 flex flex-col gap-8">
      {/* Header */}
      <section className="pt-6 pb-2">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
          </svg>
          Back to Copy Anywhere
        </Link>
        <h1 className="font-serif text-3xl font-bold tracking-tight">All Tools</h1>
        <p className="mt-2 text-muted-foreground text-sm leading-relaxed max-w-md">
          Every converter in one place. Pick a source and destination to get started.
        </p>
      </section>

      {/* Converters grouped by output format */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">
          Converters
        </h2>
        <div className="flex flex-col gap-3">
          {Object.entries(FORMATS).map(([fmtSlug, fmt]) => (
            <Card key={fmtSlug} className="transition-all hover:shadow-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <LogoIcon src={fmt.logo} alt="" size={36} shape="rounded" invertDark={fmtSlug === "notion"} />
                  <CardTitle className="text-base font-semibold">Copy to {fmt.label}</CardTitle>
                </div>
                <CardDescription>
                  Paste perfectly as {fmt.seo}. Math, code, tables, and rich text preserved.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-1.5">
                  {Object.entries(MODELS).map(([modelSlug, model]) => (
                    <Link
                      key={modelSlug}
                      href={`/convert/${modelSlug}/${fmtSlug}`}
                      className="no-underline text-inherit flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-secondary/60 transition-colors group"
                    >
                      <LogoIcon src={model.logo} alt="" size={20} shape="bare" />
                      <span className="text-sm font-medium">{model.label} to {fmt.label}</span>
                      <svg
                        width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        className="ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ))}
                </div>
                <div className="border-t border-border mt-1.5 pt-1.5">
                  <Link
                    href={`/pdf/${fmtSlug}`}
                    className="no-underline text-inherit flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-secondary/60 transition-colors group"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-primary">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                    <span className="text-sm font-medium">PDF to {fmt.label}</span>
                    <svg
                      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className="ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                  <Link
                    href={`/image/${fmtSlug}`}
                    className="no-underline text-inherit flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-secondary/60 transition-colors group"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-primary">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <span className="text-sm font-medium">Image to {fmt.label}</span>
                    <svg
                      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className="ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border">
                  {converterBadges.map((b) => (
                    <Badge key={b} variant="secondary">{b}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Chrome Extension CTA */}
      <section className="text-center py-6 border-t border-border mt-2">
        <p className="text-base font-semibold text-foreground">
          What if ⌘C just worked?
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Copy from any AI. Paste into Notion, Docs, or Obsidian. Already formatted.
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
