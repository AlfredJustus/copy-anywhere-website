import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

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
    <main className="mx-auto max-w-[760px] px-6 py-12 pb-20 flex flex-col gap-7">
      {/* Hero */}
      <section className="text-center pt-14 pb-8 px-8">
        <Image
          src="/logo.svg"
          alt="Copy Anywhere"
          width={64}
          height={64}
          className="rounded-2xl shadow-[0_4px_20px_rgba(35,25,18,0.08)] mx-auto"
          priority
        />
        <h1 className="font-sans text-[52px] font-extrabold leading-none tracking-[-0.05em] mt-5">
          Copy Anywhere
        </h1>
        <p className="mt-3.5 text-muted-foreground text-[19px] leading-relaxed max-w-[44ch] mx-auto">
          Perfect formatting, everywhere you paste. The most accurate converters
          for Notion, Obsidian, and more.
        </p>
      </section>

      {/* Tools */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-muted-foreground">
          Conversion tools
        </h2>
        <div className="flex flex-col gap-4">
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="flex items-start gap-5 bg-card border border-border rounded-[20px] p-6 shadow-[var(--shadow)] no-underline text-foreground relative transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)] hover:border-primary/25 max-sm:flex-col max-sm:gap-3.5 max-sm:p-5"
            >
              <div className="shrink-0 w-11 h-11 flex items-center justify-center bg-secondary rounded-xl text-primary p-2.5 [&_svg]:w-6 [&_svg]:h-6">
                {tool.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold leading-snug">{tool.title}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">
                  {tool.description}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {tool.badges.map((b) => (
                    <Badge key={b}>{b}</Badge>
                  ))}
                </div>
              </div>
              <span className="absolute top-6 right-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary whitespace-nowrap max-sm:static max-sm:mt-2">
                {tool.cta}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="M12 5l7 7-7 7" />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
