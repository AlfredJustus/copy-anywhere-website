import Link from "next/link";

export default function Home() {
  const models = [
    { slug: "chatgpt", name: "ChatGPT" },
    { slug: "gemini", name: "Gemini" },
    { slug: "claude", name: "Claude" },
    { slug: "deepseek", name: "DeepSeek" },
    { slug: "xai", name: "xAI" },
  ];

  return (
    <main className="home-shell">
      <section className="hero-card">
        <p className="hero-kicker">Copy Anywhere Website</p>
        <h1>Fix formatting from AI and PDF to Markdown or Notion.</h1>
        <p className="hero-sub">
          Built on the newer parser/renderer foundation from Copy Anywhere, with NotionSesh-inspired display preview.
        </p>
        <div className="hero-actions">
          <Link className="btn" href="/convert/chatgpt">
            Open universal LLM converter
          </Link>
          <Link className="btn btn-ghost" href="/pdf-to-notion">
            Open PDF to Notion
          </Link>
        </div>
      </section>

      <section className="home-grid">
        <article className="card">
          <h2>Model-specific entry pages</h2>
          <p className="muted">
            These routes support user acquisition while sharing one conversion engine.
          </p>
          <div className="chip-list">
            {models.map((model) => (
              <Link className="chip-link" key={model.slug} href={`/convert/${model.slug}`}>
                {model.name} converter
              </Link>
            ))}
          </div>
        </article>

        <article className="card">
          <h2>Core launch tools</h2>
          <ul className="feature-list">
            <li>LLM HTML/markdown to Markdown output</li>
            <li>LLM HTML/markdown to Notion blocks JSON + MIME copy</li>
            <li>PDF to Notion conversion with 10-page limit and OCR fallback</li>
            <li>Live rendered preview for every conversion</li>
          </ul>
          <Link className="text-link" href="/convert/chatgpt">
            Start converting
          </Link>
        </article>
      </section>
    </main>
  );
}
