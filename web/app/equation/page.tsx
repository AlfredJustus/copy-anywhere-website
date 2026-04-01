import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { EquationEditor } from "@/components/EquationEditor";
import { CWS_LISTING_URL, SITE_URL } from "@/lib/config/models";
import { PageFAQ } from "@/components/PageFAQ";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";
import { HowToSchema } from "@/components/HowToSchema";

const FAQ_ITEMS = [
  {
    q: "How do I type an equation?",
    a: "Click the equation field and start typing. Use standard LaTeX commands or the visual keyboard to insert special symbols. The equation renders in real-time as you type.",
  },
  {
    q: "Can I copy the equation to Notion?",
    a: "Yes. Click \"Copy to Notion\" and paste directly into Notion. It becomes a native Notion equation block that renders with KaTeX.",
  },
  {
    q: "What LaTeX commands are supported?",
    a: "All standard LaTeX math commands including fractions, integrals, matrices, summations, Greek letters, roots, and more. The editor is powered by MathLive.",
  },
];

export const metadata: Metadata = {
  title: "Visual LaTeX Equation Editor – Copy Anywhere",
  description:
    "Type math visually and get LaTeX output instantly. Copy equations to Notion, Obsidian, or Google Docs with one click. Free online tool.",
  alternates: { canonical: `${SITE_URL}/equation` },
  openGraph: {
    title: "Visual LaTeX Equation Editor – Copy Anywhere",
    description:
      "Type math visually and get LaTeX output instantly. Copy equations to Notion, Obsidian, or Google Docs with one click.",
  },
};

export default function EquationPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10 flex flex-col gap-6">
      <BreadcrumbSchema items={[{ name: "Equation Editor", href: "/equation" }]} />
      <HowToSchema
        name="How to create and copy LaTeX equations"
        description="Type math visually and copy equations to Notion, Obsidian, or Google Docs with one click."
        steps={[
          { name: "Type your equation", text: "Click the equation field and start typing. Use LaTeX commands or the visual keyboard." },
          { name: "Preview in real-time", text: "Your equation renders live as you type." },
          { name: "Copy to your destination", text: "Click the copy button for your target format — Notion, Obsidian, or Google Docs." },
        ]}
      />
      {/* Header */}
      <header className="flex flex-col items-center text-center gap-3">
        <div className="size-10 flex items-center justify-center rounded-lg bg-secondary text-primary [&_svg]:size-6">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 7V4H6l6 8-6 8h12v-3" />
          </svg>
        </div>

        <h1 className="page-title text-3xl">Visual LaTeX Editor</h1>

        <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
          Type math naturally. Get LaTeX instantly.
        </p>

        <div className="flex flex-wrap justify-center gap-1.5">
          <Badge variant="outline">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 7V4H6l6 8-6 8h12v-3" /></svg>
            LaTeX output
          </Badge>
          <Badge variant="outline">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="9" y2="9"/><line x1="4" x2="20" y1="15" y2="15"/><line x1="10" x2="8" y1="3" y2="21"/><line x1="16" x2="14" y1="3" y2="21"/></svg>
            Symbols &amp; Greek
          </Badge>
          <Badge variant="outline">
            <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="6" r="1"/><line x1="5" x2="19" y1="12" y2="12"/><circle cx="12" cy="18" r="1"/></svg>
            Fractions &amp; roots
          </Badge>
          <Badge variant="outline">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.33-6 4Z"/></svg>
            Integrals &amp; sums
          </Badge>
        </div>
      </header>

      {/* Editor */}
      <EquationEditor />

      {/* SEO content */}
      <article className="flex flex-col gap-6 text-sm text-muted-foreground leading-relaxed mt-4">
        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">How it works</h2>
          <ol className="list-decimal list-inside flex flex-col gap-1.5">
            <li>Click the editor and start typing math &mdash; use the symbol keyboard for special notation</li>
            <li>Your equation renders in real time as you type</li>
            <li>Copy the LaTeX, or copy directly to Notion, Obsidian, or Google Docs</li>
          </ol>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">What&apos;s supported</h2>
          <ul className="list-disc list-inside flex flex-col gap-1.5">
            <li>Fractions, exponents, subscripts, and roots</li>
            <li>Greek letters, operators, and special symbols</li>
            <li>Integrals, summations, limits, and products</li>
            <li>Matrices and systems of equations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">Why use this</h2>
          <p>
            Writing LaTeX by hand is error-prone and hard to read. This editor lets you
            build equations visually &mdash; like a graphing calculator &mdash; and gives you
            the LaTeX to paste wherever you need it.
          </p>
        </section>
      </article>

      <PageFAQ items={FAQ_ITEMS} />

      {/* Extension CTA */}
      <section className="text-center py-6 border-t border-border mt-2">
        <p className="text-base font-semibold text-foreground">
          Need to copy full AI conversations?
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Copy from ChatGPT or Claude. Paste into Notion, Docs, or Obsidian. Already formatted.
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
