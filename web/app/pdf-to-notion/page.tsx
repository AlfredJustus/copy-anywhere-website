import { PdfToNotionTool } from "@/components/PdfToNotionTool";
import Link from "next/link";

export default function PdfToNotionPage() {
  return (
    <main className="page-shell">
      <header className="page-header">
        <Link className="text-link" href="/">
          Back home
        </Link>
        <h1>PDF to Notion</h1>
        <p className="muted">Upload up to 10 pages, convert with Gemini + Mathpix fallback, and copy Notion blocks.</p>
      </header>
      <PdfToNotionTool />
    </main>
  );
}
