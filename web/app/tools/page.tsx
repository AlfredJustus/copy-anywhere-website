import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LogoIcon } from "@/components/LogoIcon";
import { FORMATS, CWS_LISTING_URL } from "@/lib/config/models";

const FORMAT_PAGES: { slug: string; route: string; label: string; description: string }[] = [
  { slug: "notion", route: "/notion", label: "Notion", description: "Paste as native Notion blocks — math, code, tables, and rich text preserved." },
  { slug: "markdown", route: "/obsidian", label: "Obsidian", description: "Get clean Markdown for Obsidian or any editor. Equations and formatting intact." },
  { slug: "google-docs", route: "/google-docs", label: "Google Docs", description: "Paste formatted content directly into Google Docs with tables, math, and styling." },
  { slug: "pdf", route: "/pdf-download", label: "PDF", description: "Turn any AI conversation into a clean, shareable PDF with LaTeX-rendered math." },
];


export const metadata: Metadata = {
  title: "Browse All Converters – Copy Anywhere",
  description:
    "Browse every converter: paste, PDF, or image to Notion, Obsidian, Google Docs, or PDF. Math, code, and tables preserved.",
  alternates: { canonical: "/tools" },
  openGraph: {
    title: "Browse All Converters – Copy Anywhere",
    description:
      "Browse every converter: paste, PDF, or image to Notion, Obsidian, Google Docs, or PDF. Math, code, and tables preserved.",
  },
};

export default function ToolsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10 flex flex-col gap-8">
      {/* Header */}
      <section className="pb-2">
        <h1 className="font-serif text-3xl font-bold tracking-tight">Browse All Converters</h1>
        <p className="mt-2 text-muted-foreground text-sm leading-relaxed max-w-md">
          Pick a destination. Each tool handles paste, PDF, and image input.
        </p>
      </section>

      {/* Format cards */}
      <section className="flex flex-col gap-3">
        {FORMAT_PAGES.map(({ slug, route, label, description }) => {
          const fmt = FORMATS[slug as keyof typeof FORMATS];
          return (
            <Link key={slug} href={route} className="no-underline text-inherit">
              <Card className="transition-all hover:shadow-lg hover:ring-accent/30 group">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <LogoIcon src={fmt.logo} alt="" size={40} shape="rounded" invertDark={slug === "notion"} />
                    <div className="flex flex-col gap-0.5">
                      <CardTitle className="text-base font-semibold group-hover:text-accent-foreground transition-colors">
                        {slug === "pdf" ? `Save as ${label}` : `Copy to ${label}`}
                      </CardTitle>
                      <CardDescription>{description}</CardDescription>
                    </div>
                    <svg
                      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className="ml-auto shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
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
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="21.17" y1="8" x2="12" y2="8"/><line x1="3.95" y1="6.06" x2="8.54" y2="14"/><line x1="10.88" y1="21.94" x2="15.46" y2="14"/></svg>
          Get the Chrome Extension
        </a>
      </section>
    </main>
  );
}
