"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useRef, useCallback, useEffect } from "react";
import { ResultPreview } from "@/components/ResultPreview";
import { parseMarkdownToBlocks, jsonToNotionBlocks } from "@/lib/parity/blockFactory";
import { ocrImage, checkQuota, RateLimitError } from "@/lib/ocr";
import { type FormatSlug } from "@/lib/config/models";
import { Button } from "@/components/ui/button";

type Phase = "idle" | "processing" | "ready" | "error" | "rate-limited";

interface PdfConverterToolProps {
  formatSlug?: FormatSlug;
}

export function PdfConverterTool({ formatSlug = "notion" }: PdfConverterToolProps) {
  const [blocks, setBlocks] = useState<any[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [fileName, setFileName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const handleFile = useCallback(async (file: File) => {
    setBlocks([]);
    setErrorMessage("");
    setFileName(file.name);
    setPhase("processing");
    setProgress({ current: 0, total: 0 });

    try {
      const quota = await checkQuota();
      if (quota.remainingPdf <= 0) {
        setErrorMessage("Daily PDF limit reached (2 per day). Try again tomorrow.");
        setPhase("rate-limited");
        return;
      }

      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
      pdfjs.GlobalWorkerOptions.workerSrc =
        "https://unpkg.com/pdfjs-dist@5.5.207/legacy/build/pdf.worker.min.mjs";

      const data = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data });
      const pdf = await loadingTask.promise;

      if (pdf.numPages > 10) {
        setErrorMessage("This PDF has more than 10 pages. Please upload 10 pages or fewer.");
        setPhase("error");
        return;
      }

      setProgress({ current: 0, total: pdf.numPages });

      const pageMarkdown: string[] = [];
      for (let i = 1; i <= pdf.numPages; i += 1) {
        setProgress({ current: i, total: pdf.numPages });
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
        const markdown = await ocrImage(base64, "pdf", i);
        pageMarkdown.push(markdown);
      }

      const combined = pageMarkdown
        .map((text) => (text || "").trim())
        .filter(Boolean)
        .join("\n\n")
        .replace(/^\s*Page\s+\d+\s*$/gim, "")
        .replace(/^\s*\d{1,4}\s*$/gm, "")
        .trim();

      if (!combined) {
        setErrorMessage("No text detected in this PDF. Make sure the file contains readable text, not just images.");
        setPhase("error");
        return;
      }

      const intermediate = parseMarkdownToBlocks(combined);
      const notionBlocks = jsonToNotionBlocks(intermediate);
      setBlocks(notionBlocks);
      setPhase("ready");
    } catch (error) {
      if (error instanceof RateLimitError) {
        setErrorMessage(error.message);
        setPhase("rate-limited");
      } else {
        setErrorMessage(error instanceof Error ? error.message : "PDF conversion failed.");
        setPhase("error");
      }
    }
  }, []);

  const handleReset = () => {
    setBlocks([]);
    setPhase("idle");
    setErrorMessage("");
    setFileName("");
    setProgress({ current: 0, total: 0 });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.types.includes("Files")) setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) setIsDragOver(false);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type === "application/pdf") handleFile(file);
  }, [handleFile]);

  const onFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleFile(file);
  }, [handleFile]);

  const dropZoneClass = [
    "drop-zone",
    phase === "idle" ? (isDragOver ? "drop-zone--dragover" : "drop-zone--idle") : "",
    phase === "processing" ? "drop-zone--processing" : "",
    phase === "ready" ? "drop-zone--collapsed" : "",
    phase === "error" ? "drop-zone--error" : "",
    phase === "rate-limited" ? "drop-zone--rate-limited" : "",
  ].filter(Boolean).join(" ");

  return (
    <section className="flex flex-col gap-4">
      <div
        className={dropZoneClass}
        onClick={() => (phase === "idle" || phase === "error") && fileInputRef.current?.click()}
        onDragEnter={phase === "idle" || phase === "error" ? onDragEnter : undefined}
        onDragLeave={phase === "idle" || phase === "error" ? onDragLeave : undefined}
        onDragOver={phase === "idle" || phase === "error" ? onDragOver : undefined}
        onDrop={phase === "idle" || phase === "error" ? onDrop : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="drop-zone-input"
          onChange={onFileChange}
          tabIndex={-1}
        />

        {phase === "idle" && (
          <>
            <div className="drop-zone-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <path d="M12 18v-6" />
                <path d="M9 15l3-3 3 3" />
              </svg>
            </div>
            <p className="text-base font-semibold text-foreground">Drop your PDF here</p>
            <p className="mt-1 text-xs text-muted-foreground">or click to browse &mdash; max 10 pages</p>
          </>
        )}

        {phase === "processing" && (
          <div className="pdf-progress-wrap">
            <p className="pdf-progress-label">
              Processing page {progress.current} of {progress.total}&#8230;
            </p>
            <div className="pdf-progress-bar">
              <div
                className="pdf-progress-fill"
                style={{ width: progress.total ? `${(progress.current / progress.total) * 100}%` : "0%" }}
              />
            </div>
            <p className="pdf-progress-file">{fileName}</p>
          </div>
        )}

        {phase === "ready" && (
          <div className="drop-zone-collapsed-inner">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <span>{fileName} converted</span>
            <Button variant="outline" size="sm" className="ml-auto" onClick={handleReset}>
              Upload new
            </Button>
          </div>
        )}

        {phase === "error" && (
          <div className="drop-zone-error-inner">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <p className="drop-zone-error-msg">{errorMessage}</p>
            <Button variant="outline" size="sm" onClick={handleReset}>
              Try again
            </Button>
          </div>
        )}

        {phase === "rate-limited" && (
          <div className="rate-limit-inner">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="rate-limit-msg">{errorMessage}</p>
            <p className="rate-limit-sub">
              Free usage resets daily at midnight UTC. Sign up for higher limits coming soon.
            </p>
            <Button variant="outline" size="sm" onClick={handleReset}>
              Go back
            </Button>
          </div>
        )}
      </div>

      {/* Result */}
      {phase === "ready" && blocks.length > 0 && (
        <ResultPreview blocks={blocks} formatSlug={formatSlug} onReset={handleReset} />
      )}
    </section>
  );
}
