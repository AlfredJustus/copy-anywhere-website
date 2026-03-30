"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
import { NotionSeshPreview } from "@/components/NotionSeshPreview";
import { parseMarkdownToBlocks, jsonToNotionBlocks } from "@/lib/parity/blockFactory";
import { buildNotionPayload, blocksToMarkdown } from "@/lib/parity/serialize";

const SUPABASE_FUNCTION_URL = "https://cghzhnznfqjasjtimslq.supabase.co/functions/v1/convert-to-notion";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnaHpobnpuZnFqYXNqdGltc2xxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMzI1MzAsImV4cCI6MjA4NTkwODUzMH0.xLuIIaIU9dChoiST8R1yYgGhDdIhArCVMfNme4usH1U";

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
  const [blocks, setBlocks] = useState<any[]>([]);
  const [isWorking, setIsWorking] = useState(false);

  const handleFile = async (file: File) => {
    setStatus("");
    setBlocks([]);
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

        const imageDataUrl = canvas.toDataURL("image/png");
        const base64 = imageDataUrl.split(",")[1];

        const resp = await fetch(SUPABASE_FUNCTION_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
            "apikey": SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ image: base64 }),
        });
        const payload = await resp.json();
        if (!resp.ok || payload.error) {
          throw new Error(payload.error || `OCR failed on page ${i}.`);
        }
        pageMarkdown.push(payload.markdown || "");
      }

      const combined = pageMarkdown
        .map((text, idx) => `## Page ${idx + 1}\n\n${text || ""}`.trim())
        .join("\n\n");

      const intermediate = parseMarkdownToBlocks(combined);
      const notionBlocks = jsonToNotionBlocks(intermediate);
      setBlocks(notionBlocks);
      setStatus(`Done. Converted ${pdf.numPages} page(s).`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "PDF conversion failed.");
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <section className="converter-section">
      <div className="card">
        <h2>Upload PDF</h2>
        <p className="muted">Upload a PDF (max 10 pages). Each page is processed via OCR.</p>
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
        {status && <p className="status-note">{status}</p>}
      </div>

      {blocks.length > 0 && (
        <>
          <div className="result-section">
            <NotionSeshPreview blocks={blocks} />
          </div>

          <div className="copy-row">
            <button
              className="btn"
              onClick={async () => {
                try {
                  await copyNotionMime(buildNotionPayload(blocks));
                  setStatus("Copied to Notion!");
                } catch { setStatus("Copy failed."); }
              }}
            >
              Copy to Notion
            </button>
            <button
              className="btn btn-ghost"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(blocksToMarkdown(blocks));
                  setStatus("Copied as Markdown!");
                } catch { setStatus("Copy failed."); }
              }}
            >
              Copy as Markdown
            </button>
          </div>
        </>
      )}
    </section>
  );
}
