"use client";

import { useMemo, useState } from "react";

import { NotionSeshPreview } from "@/components/NotionSeshPreview";
import { convertToBlocks } from "@/lib/core/convert";

type OcrResponse = {
  markdown: string;
  provider?: "gemini" | "mathpix";
  error?: string;
};

async function copyNotionMime(payload: string) {
  const blob = new Blob([payload], { type: "text/_notion-blocks-v3-production" });
  const item = new ClipboardItem({
    "text/_notion-blocks-v3-production": blob,
    "text/plain": new Blob([payload], { type: "text/plain" }),
  });
  await navigator.clipboard.write([item]);
}

export function PdfToNotionTool() {
  const [status, setStatus] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [isWorking, setIsWorking] = useState(false);

  const result = useMemo(() => convertToBlocks(markdown, "markdown"), [markdown]);

  const handleFile = async (file: File) => {
    setStatus("");
    setIsWorking(true);
    try {
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
      pdfjs.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.296/pdf.worker.min.mjs";

      const data = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data });
      const pdf = await loadingTask.promise;
      if (pdf.numPages > 10) {
        setStatus("This PDF has more than 10 pages. Please upload 10 pages or fewer.");
        setIsWorking(false);
        return;
      }

      const pageMarkdown: string[] = [];
      for (let i = 1; i <= pdf.numPages; i += 1) {
        setStatus(`Processing page ${i} of ${pdf.numPages}...`);
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Failed to create canvas context.");
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        await page.render({ canvas, canvasContext: context, viewport }).promise;

        const image = canvas.toDataURL("image/png");
        const resp = await fetch("/api/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image }),
        });
        const payload = (await resp.json()) as OcrResponse;
        if (!resp.ok || payload.error) {
          throw new Error(payload.error || `OCR failed on page ${i}.`);
        }
        pageMarkdown.push(payload.markdown || "");
      }

      const combined = pageMarkdown
        .map((text, idx) => `## Page ${idx + 1}\n\n${text || ""}`.trim())
        .join("\n\n");
      setMarkdown(combined);
      setStatus(`Done. Converted ${pdf.numPages} page(s).`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "PDF conversion failed.");
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <section className="converter-shell">
      <div className="converter-grid">
        <article className="card">
          <h2>Upload PDF</h2>
          <p className="muted">
            Upload a full PDF (max 10 pages). Each page is OCR-processed with Gemini first, then Mathpix fallback.
          </p>
          <input
            type="file"
            accept="application/pdf"
            disabled={isWorking}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              await handleFile(file);
            }}
          />
          <p className="status-note">{status}</p>
        </article>

        <article className="card">
          <h2>Notion payload</h2>
          <p className="muted">Copy this as Notion blocks MIME.</p>
          <textarea className="output-textarea" readOnly value={result.notionPayload} />
          <div className="button-row">
            <button
              className="btn"
              disabled={!result.blocks.length}
              onClick={async () => {
                try {
                  await copyNotionMime(result.notionPayload);
                  setStatus("Copied Notion payload to clipboard.");
                } catch {
                  setStatus("Copy failed in this browser. Copy JSON manually.");
                }
              }}
            >
              Copy to Notion MIME
            </button>
            <button className="btn btn-ghost" disabled={!markdown} onClick={() => setMarkdown("")}>
              Clear
            </button>
          </div>
        </article>
      </div>

      <article className="card preview-card">
        <h2>Rendered preview (NotionSesh display style)</h2>
        <NotionSeshPreview blocks={result.blocks} />
      </article>
    </section>
  );
}
