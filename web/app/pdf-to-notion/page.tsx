import { PdfToNotionTool } from "@/components/PdfToNotionTool";
import Link from "next/link";

export default function PdfToNotionPage() {
  return (
    <main className="page-shell">
      <header className="page-header">
        <Link className="text-link" href="/">
          &larr; Home
        </Link>
        <h1 className="page-title">PDF to Notion</h1>
        <p className="page-sub">Upload up to 10 pages, convert via OCR, and copy Notion blocks.</p>
      </header>
      <PdfToNotionTool />
    </main>
  );
}
