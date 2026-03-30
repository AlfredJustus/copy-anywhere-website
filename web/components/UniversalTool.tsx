"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useRef, useEffect, useCallback } from "react";
import { ResultPreview } from "@/components/ResultPreview";
import { parseHtmlToBlocks } from "@/lib/parity/htmlParser";
import { parseMarkdownToBlocks, jsonToNotionBlocks } from "@/lib/parity/blockFactory";
import { ocrImage, readFileAsBase64, checkQuota, RateLimitError } from "@/lib/ocr";
import { type FormatSlug, CWS_LISTING_URL } from "@/lib/config/models";
import { Button } from "@/components/ui/button";

type Phase = "idle" | "processing" | "ready" | "error" | "rate-limited";
type InputSource = "clipboard" | "pdf" | "image";


interface UniversalToolProps {
  formatSlug?: FormatSlug;
  onPhaseChange?: (phase: Phase) => void;
  onReset?: (resetFn: () => void) => void;
}

export function UniversalTool({ formatSlug, onPhaseChange, onReset }: UniversalToolProps) {
  const [blocks, setBlocks] = useState<any[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [inputSource, setInputSource] = useState<InputSource>("clipboard");
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [fileName, setFileName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [statusText, setStatusText] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const zoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onPhaseChange?.(phase);
  }, [phase, onPhaseChange]);

  // ── Clipboard pipeline ──

  const parseClipboard = useCallback((html: string, plain: string): any[] | null => {
    let parsed: any[] | null = null;
    if (html) parsed = parseHtmlToBlocks(html);
    if (!parsed) {
      const text = plain || "";
      const intermediate = parseMarkdownToBlocks(text);
      parsed = jsonToNotionBlocks(intermediate);
    }
    return parsed;
  }, []);

  const handleClipboard = useCallback((html: string, plain: string) => {
    if (!html && !plain) return;
    setInputSource("clipboard");
    setPhase("processing");
    setStatusText("Converting paste\u2026");

    const parsed = parseClipboard(html, plain);
    if (!parsed || parsed.length === 0) {
      setPhase("idle");
      return;
    }

    setTimeout(() => {
      setBlocks(parsed);
      setPhase("ready");
    }, 400);
  }, [parseClipboard]);

  // ── PDF pipeline ──

  const handlePdf = useCallback(async (file: File) => {
    setBlocks([]);
    setErrorMessage("");

    setInputSource("pdf");
    setFileName(file.name);
    setPhase("processing");
    setProgress({ current: 0, total: 0 });
    setStatusText("Loading PDF\u2026");

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

      // Rasterize and OCR pages concurrently: start each OCR request
      // as soon as its page is rasterized so rendering and network overlap.
      let completed = 0;
      const ocrPromises: Promise<string>[] = [];
      for (let i = 1; i <= pdf.numPages; i += 1) {
        setStatusText(`Processing page ${i} of ${pdf.numPages}\u2026`);
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Failed to create canvas context.");
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        await page.render({ canvas, canvasContext: context, viewport }).promise;
        const base64 = canvas.toDataURL("image/png").split(",")[1];

        // Fire OCR immediately, don't await — it runs while next page rasterizes
        ocrPromises.push(
          ocrImage(base64, "pdf", i).then((markdown) => {
            completed += 1;
            setProgress({ current: completed, total: pdf.numPages });
            setStatusText(`Processed ${completed} of ${pdf.numPages} pages\u2026`);
            return markdown;
          })
        );
      }

      const pageMarkdown = await Promise.all(ocrPromises);

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

  // ── Image pipeline ──

  const handleImage = useCallback(async (file: File) => {
    setBlocks([]);
    setErrorMessage("");

    setInputSource("image");
    setFileName(file.name);
    setPhase("processing");
    setStatusText("Reading image\u2026");

    try {
      const quota = await checkQuota();
      if (quota.remainingImage <= 0) {
        setErrorMessage("Daily image limit reached (5 per day). Try again tomorrow.");
        setPhase("rate-limited");
        return;
      }

      const base64 = await readFileAsBase64(file);
      const markdown = await ocrImage(base64, "image");

      if (!markdown.trim()) {
        setErrorMessage("No text detected in this image. Make sure the image contains readable text.");
        setPhase("error");
        return;
      }

      const intermediate = parseMarkdownToBlocks(markdown);
      const notionBlocks = jsonToNotionBlocks(intermediate);
      setBlocks(notionBlocks);
      setPhase("ready");
    } catch (error) {
      if (error instanceof RateLimitError) {
        setErrorMessage(error.message);
        setPhase("rate-limited");
      } else {
        setErrorMessage(error instanceof Error ? error.message : "Image conversion failed.");
        setPhase("error");
      }
    }
  }, []);

  // ── Global paste listener ──

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (phase === "processing") return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;

      e.preventDefault();
      const files = e.clipboardData?.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file.type === "application/pdf") return handlePdf(file);
        if (file.type.startsWith("image/")) return handleImage(file);
      }
      const html = e.clipboardData?.getData("text/html") || "";
      const plain = e.clipboardData?.getData("text/plain") || "";
      handleClipboard(html, plain);
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [phase, handlePdf, handleImage, handleClipboard]);

  // ── Drag & drop (global — works anywhere on page) ──

  useEffect(() => {
    if (phase === "processing") return;

    let counter = 0;

    const onDragEnter = (e: DragEvent) => {
      e.preventDefault();
      counter += 1;
      if (e.dataTransfer?.types.includes("Files")) setIsDragOver(true);
    };

    const onDragLeave = (e: DragEvent) => {
      e.preventDefault();
      counter -= 1;
      if (counter === 0) setIsDragOver(false);
    };

    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      counter = 0;
      setIsDragOver(false);

      const file = e.dataTransfer?.files?.[0];
      if (!file) return;
      if (file.type === "application/pdf") return handlePdf(file);
      if (file.type.startsWith("image/")) return handleImage(file);
      setErrorMessage(`Unsupported file type: ${file.name.split(".").pop()?.toUpperCase() || file.type}. Try a PDF or image instead.`);
      setPhase("error");
    };

    document.addEventListener("dragenter", onDragEnter);
    document.addEventListener("dragleave", onDragLeave);
    document.addEventListener("dragover", onDragOver);
    document.addEventListener("drop", onDrop);
    return () => {
      document.removeEventListener("dragenter", onDragEnter);
      document.removeEventListener("dragleave", onDragLeave);
      document.removeEventListener("dragover", onDragOver);
      document.removeEventListener("drop", onDrop);
    };
  }, [phase, handlePdf, handleImage]);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type === "application/pdf") handlePdf(file);
    else if (file.type.startsWith("image/")) handleImage(file);
    else {
      setErrorMessage(`Unsupported file type: ${file.name.split(".").pop()?.toUpperCase() || file.type}. Try a PDF or image instead.`);
      setPhase("error");
    }
  }, [handlePdf, handleImage]);

  const handleReset = useCallback(() => {
    setBlocks([]);
    setPhase("idle");
    setErrorMessage("");
    setFileName("");
    setStatusText("");
    setProgress({ current: 0, total: 0 });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  useEffect(() => {
    onReset?.(handleReset);
  }, [onReset, handleReset]);

  // ── Zone class ──

  const zoneClass = [
    "universal-zone",
    phase === "idle" ? (isDragOver ? "universal-zone--dragover" : "universal-zone--idle") : "",
    phase === "processing" ? "universal-zone--processing" : "",
    phase === "ready" ? "hidden" : "",
    phase === "error" ? "universal-zone--error" : "",
    phase === "rate-limited" ? "drop-zone--rate-limited" : "",
  ].filter(Boolean).join(" ");

  return (
    <>
      {/* Full-screen drop overlay */}
      {isDragOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm border-2 border-dashed border-accent rounded-none pointer-events-none">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex items-center justify-center size-16 rounded-2xl bg-accent/10">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-foreground">Drop anywhere</p>
            <p className="text-sm text-muted-foreground">PDF or image — we&apos;ll handle the rest</p>
          </div>
        </div>
      )}

      <section className="flex flex-col gap-4">
        <div
          ref={zoneRef}
          className={zoneClass}
          tabIndex={0}
          aria-label="Paste content or drop a file to convert"
          onClick={() => (phase === "idle" || phase === "error") && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,image/*"
            className="drop-zone-input"
            onChange={onFileChange}
            tabIndex={-1}
          />

          {phase === "idle" && (
            <>
              <div className="universal-zone-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="2" width="6" height="4" rx="1" />
                  <path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
                  <path d="M9 14l2 2 4-4" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-foreground">
                Paste from any AI chat, or drop a file
              </p>
              <p className="mt-1.5 text-sm text-muted-foreground text-center text-balance leading-relaxed">
                <kbd className="inline-block px-1.5 py-0.5 font-mono text-[11px] font-medium bg-muted border border-border rounded">⌘V</kbd>
                {" to paste — or drag and drop a PDF or image"}
              </p>
            </>
          )}

          {phase === "processing" && (
            <div className="universal-zone-processing">
              {inputSource === "pdf" && progress.total > 0 ? (
                <div className="pdf-progress-wrap">
                  <p className="pdf-progress-label">{statusText}</p>
                  <div className="pdf-progress-bar">
                    <div
                      className="pdf-progress-fill"
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    />
                  </div>
                  <p className="pdf-progress-file">{fileName}</p>
                </div>
              ) : (
                <div className="processing-indicator" role="status" aria-live="polite">
                  <div className="processing-dots">
                    <span /><span /><span />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">{statusText}</p>
                </div>
              )}
            </div>
          )}

          {/* Collapsed ready state removed — result preview is visible below */}

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

        {/* Result: sticky toolbar + document preview */}
        {phase === "ready" && blocks.length > 0 && (
          <>
            <ResultPreview blocks={blocks} formatSlug={formatSlug} onReset={handleReset} />
            {!formatSlug && (
              <section className="text-center py-6 border-t border-border mt-2">
                <p className="text-base font-semibold text-foreground">
                  Want this built into your browser?
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Copy from any AI chat. Paste anywhere. Already formatted.
                </p>
                <a
                  href={CWS_LISTING_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-4 px-6 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold transition-opacity hover:opacity-90"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="21.17" y1="8" x2="12" y2="8"/><line x1="3.95" y1="6.06" x2="8.54" y2="14"/><line x1="10.88" y1="21.94" x2="15.46" y2="14"/></svg>
                  Get the Chrome Extension
                </a>
              </section>
            )}
          </>
        )}
      </section>
    </>
  );
}
