import Link from "next/link";
import Image from "next/image";

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
    <main className="home-shell">
      {/* Hero */}
      <section className="home-hero">
        <Image
          src="/logo.svg"
          alt="Copy Anywhere"
          width={64}
          height={64}
          className="home-hero-logo"
          priority
        />
        <h1 className="home-hero-title">Copy Anywhere</h1>
        <p className="home-hero-sub">
          Perfect formatting, everywhere you paste. The most accurate converters
          for Notion, Obsidian, and more.
        </p>
      </section>

      {/* Tools */}
      <section className="tools-section">
        <h2 className="tools-heading">Conversion tools</h2>
        <div className="tools-grid">
          {tools.map((tool) => (
            <Link key={tool.href} href={tool.href} className="tool-card">
              <div className="tool-card-icon">{tool.icon}</div>
              <div className="tool-card-body">
                <h3 className="tool-card-title">{tool.title}</h3>
                <p className="tool-card-desc">{tool.description}</p>
                <div className="tool-card-badges">
                  {tool.badges.map((b) => (
                    <span key={b} className="cap-pill">
                      {b}
                    </span>
                  ))}
                </div>
              </div>
              <span className="tool-card-cta">
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
