"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { NotionSeshPreview } from "@/components/NotionSeshPreview";
import { parseMarkdownToBlocks, jsonToNotionBlocks } from "@/lib/parity/blockFactory";
import { buildNotionPayload, blocksToMarkdown } from "@/lib/parity/serialize";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const SUPABASE_FUNCTION_URL = "https://cghzhnznfqjasjtimslq.supabase.co/functions/v1/convert-to-notion";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnaHpobnpuZnFqYXNqdGltc2xxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMzI1MzAsImV4cCI6MjA4NTkwODUzMH0.xLuIIaIU9dChoiST8R1yYgGhDdIhArCVMfNme4usH1U";

type Phase = "idle" | "processing" | "ready" | "error";
type CopyFeedback = null | "notion" | "markdown";

export function PdfToNotionTool() {
  const [blocks, setBlocks] = useState<any[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [copyFeedback, setCopyFeedback] = useState<CopyFeedback>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [fileName, setFileName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  const feedbackTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (phase === "ready") {
      const t = setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const flashFeedback = (type: CopyFeedback) => {
    clearTimeout(feedbackTimer.current);
    setCopyFeedback(type);
    feedbackTimer.current = setTimeout(() => setCopyFeedback(null), 2000);
  };

  const handleFile = useCallback(async (file: File) => {
    setBlocks([]);
    setErrorMessage("");
    setCopyFeedback(null);
    setFileName(file.name);
    setPhase("processing");
    setProgress({ current: 0, total: 0 });

    try {
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
      setPhase("ready");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "PDF conversion failed.");
      setPhase("error");
    }
  }, []);

  const handleCopyNotion = () => {
    try {
      const payload = buildNotionPayload(blocks);
      const md = blocksToMarkdown(blocks);
      const listener = (e: Event) => {
        const ce = e as ClipboardEvent;
        ce.preventDefault();
        ce.stopImmediatePropagation();
        ce.clipboardData?.setData("text/_notion-blocks-v3-production", payload);
        ce.clipboardData?.setData("text/plain", md);
      };
      document.addEventListener("copy", listener, true);
      try {
        document.execCommand("copy");
        flashFeedback("notion");
      } finally {
        document.removeEventListener("copy", listener, true);
      }
    } catch {
      /* copy failed silently */
    }
  };

  const handleCopyMarkdown = async () => {
    try {
      const md = blocksToMarkdown(blocks);
      await navigator.clipboard.writeText(md);
      flashFeedback("markdown");
    } catch {
      /* copy failed silently */
    }
  };

  const handleReset = () => {
    setBlocks([]);
    setPhase("idle");
    setCopyFeedback(null);
    setErrorMessage("");
    setFileName("");
    setProgress({ current: 0, total: 0 });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragOver(true);
    }
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDragOver(false);
    }
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
    if (file && file.type === "application/pdf") {
      handleFile(file);
    }
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
  ].filter(Boolean).join(" ");

  return (
    <>
      <section className={`flex flex-col gap-4 ${phase === "ready" ? "pb-20" : ""}`}>
        <div
          className={dropZoneClass}
          onClick={() => phase === "idle" && fileInputRef.current?.click()}
          onDragEnter={phase === "idle" ? onDragEnter : undefined}
          onDragLeave={phase === "idle" ? onDragLeave : undefined}
          onDragOver={phase === "idle" ? onDragOver : undefined}
          onDrop={phase === "idle" ? onDrop : undefined}
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
        </div>

        {phase === "ready" && blocks.length > 0 && (
          <div className="animate-slideUp" ref={resultRef}>
            <Card>
              <CardContent>
                <NotionSeshPreview blocks={blocks} />
              </CardContent>
            </Card>
          </div>
        )}
      </section>

      {/* Fixed bottom action bar */}
      {phase === "ready" && blocks.length > 0 && createPortal(
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border px-4 py-3 animate-barSlideUp z-50">
          <div className="max-w-2xl mx-auto flex items-center justify-center gap-2">
            <Button
              variant={copyFeedback === "notion" ? "success" : "default"}
              size="lg"
              onClick={handleCopyNotion}
            >
              {copyFeedback === "notion" ? (
                <>
                  <svg className="animate-checkPop" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                  Copied!
                </>
              ) : (
                "Copy to Notion"
              )}
            </Button>
            <Button
              variant={copyFeedback === "markdown" ? "success" : "outline"}
              size="lg"
              onClick={handleCopyMarkdown}
            >
              {copyFeedback === "markdown" ? (
                <>
                  <svg className="animate-checkPop" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                  Copied!
                </>
              ) : (
                "Copy as Markdown"
              )}
            </Button>
          </div>
        </div>
      , document.body)}
    </>
  );
}
