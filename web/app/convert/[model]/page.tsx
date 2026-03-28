import { ConverterApp } from "@/components/ConverterApp";
import Link from "next/link";

const MODEL_LABELS: Record<string, string> = {
  chatgpt: "ChatGPT",
  gemini: "Gemini",
  claude: "Claude",
  deepseek: "DeepSeek",
  xai: "xAI",
};

export default async function ModelConverterPage({
  params,
}: {
  params: Promise<{ model: string }>;
}) {
  const { model } = await params;
  const modelKey = model.toLowerCase();
  const modelLabel = MODEL_LABELS[modelKey] || model;

  return (
    <main className="page-shell">
      <header className="page-header">
        <Link className="text-link" href="/">
          Back home
        </Link>
        <h1>{modelLabel} to Markdown / Notion</h1>
        <p className="muted">Paste copied content and convert using shared parser logic.</p>
      </header>
      <ConverterApp modelLabel={modelLabel} defaultOutput="markdown" />
    </main>
  );
}
