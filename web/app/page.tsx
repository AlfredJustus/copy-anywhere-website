import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardAction } from "@/components/ui/card";

const tools = [
  {
    title: "ChatGPT to Notion",
    description:
      "Paste any ChatGPT conversation and get perfectly formatted Notion blocks. Supports math, code, tables, nested lists, and rich text.",
    href: "/convert/chatgpt",
    cta: "Open converter",
    badges: ["Math & LaTeX", "Code blocks", "Tables", "Rich text", "Nested lists"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="2" width="6" height="4" rx="1" />
        <path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
        <path d="M9 14l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "PDF to Notion",
    description:
      "Upload any PDF and convert it to Notion blocks with OCR-powered accuracy. Formulas, tables, and formatting preserved.",
    href: "/pdf-to-notion",
    cta: "Open converter",
    badges: ["OCR powered", "Math & LaTeX", "Tables", "Code blocks", "Rich text"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10 flex flex-col gap-8">
      {/* Hero */}
      <section className="text-center pt-10 pb-4">
        <Image
          src="/logo.svg"
          alt="Copy Anywhere"
          width={56}
          height={56}
          className="rounded-xl shadow-logo mx-auto"
          priority
        />
        <h1 className="font-serif text-4xl font-bold tracking-tight mt-4">
          Copy Anywhere
        </h1>
        <p className="mt-2 text-muted-foreground text-sm leading-relaxed max-w-md mx-auto">
          Perfect formatting, everywhere you paste. The most accurate converters
          for Notion, Obsidian, and more.
        </p>
      </section>

      {/* Tools */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">
          Conversion tools
        </h2>
        <div className="flex flex-col gap-3">
          {tools.map((tool) => (
            <Link key={tool.href} href={tool.href} className="no-underline text-inherit">
              <Card className="transition-all hover:ring-primary/25 hover:shadow-card">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 size-9 flex items-center justify-center bg-secondary rounded-lg text-primary [&_svg]:size-5">
                      {tool.icon}
                    </div>
                    <CardTitle className="text-base font-semibold">{tool.title}</CardTitle>
                  </div>
                  <CardAction>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                      {tool.cta}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14" />
                        <path d="M12 5l7 7-7 7" />
                      </svg>
                    </span>
                  </CardAction>
                  <CardDescription>{tool.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    {tool.badges.map((b) => (
                      <Badge key={b} variant="secondary">{b}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
