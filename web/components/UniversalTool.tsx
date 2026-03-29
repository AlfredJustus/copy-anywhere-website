"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { NotionSeshPreview } from "@/components/NotionSeshPreview";
import { LogoIcon } from "@/components/LogoIcon";
import { parseHtmlToBlocks } from "@/lib/parity/htmlParser";
import { parseMarkdownToBlocks, jsonToNotionBlocks } from "@/lib/parity/blockFactory";
import { blocksToMarkdown, buildNotionPayload, getBlockData } from "@/lib/parity/serialize";
import { buildClipboardHtmlFromBlocks } from "@/lib/parity/htmlClipboard";
import { ocrImage, readFileAsBase64 } from "@/lib/ocr";
import { FORMATS, type FormatSlug } from "@/lib/config/models";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Phase = "idle" | "processing" | "ready" | "error";
type InputSource = "clipboard" | "pdf" | "image";

const sanitizeLatex = (s: string) => s;

const FORMAT_LOGOS: { key: FormatSlug; logo: string }[] = [
  { key: "notion", logo: FORMATS.notion.logo },
  { key: "markdown", logo: FORMATS.markdown.logo },
  { key: "google-docs", logo: FORMATS["google-docs"].logo },
];

const CheckIcon = () => (
  <svg className="animate-checkPop" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
);

interface UniversalToolProps {
  formatSlug?: FormatSlug;
}

export function UniversalTool({ formatSlug }: UniversalToolProps) {
  const [blocks, setBlocks] = useState<any[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [inputSource, setInputSource] = useState<InputSource>("clipboard");
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [fileName, setFileName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [statusText, setStatusText] = useState("");

  const feedbackTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const resultRef = useRef<HTMLDivElement>(null);
  const zoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (phase === "ready") {
      const t = setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const flashCopied = () => {
    clearTimeout(feedbackTimer.current);
    setCopied(true);
    feedbackTimer.current = setTimeout(() => setCopied(false), 2000);
  };

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
    setCopied(false);
    setInputSource("pdf");
    setFileName(file.name);
    setPhase("processing");
    setProgress({ current: 0, total: 0 });
    setStatusText("Loading PDF\u2026");

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
        setStatusText(`Processing PDF page ${i} of ${pdf.numPages}\u2026`);

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
        const markdown = await ocrImage(base64);
        pageMarkdown.push(markdown);
      }

      const combined = pageMarkdown
        .map((text) => (text || "").trim())
        .filter(Boolean)
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

  // ── Image pipeline ──

  const handleImage = useCallback(async (file: File) => {
    setBlocks([]);
    setErrorMessage("");
    setCopied(false);
    setInputSource("image");
    setFileName(file.name);
    setPhase("processing");
    setStatusText("Reading image\u2026");

    try {
      const base64 = await readFileAsBase64(file);
      const markdown = await ocrImage(base64);
      const intermediate = parseMarkdownToBlocks(markdown);
      const notionBlocks = jsonToNotionBlocks(intermediate);
      setBlocks(notionBlocks);
      setPhase("ready");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Image conversion failed.");
      setPhase("error");
    }
  }, []);

  // ── Input detection ──

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const files = e.clipboardData.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === "application/pdf") return handlePdf(file);
      if (file.type.startsWith("image/")) return handleImage(file);
    }
    const html = e.clipboardData.getData("text/html");
    const plain = e.clipboardData.getData("text/plain");
    handleClipboard(html, plain);
  }, [handlePdf, handleImage, handleClipboard]);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (phase !== "idle") return;
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

  // ── Drag & drop ──

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
    if (!file) return;
    if (file.type === "application/pdf") return handlePdf(file);
    if (file.type.startsWith("image/")) return handleImage(file);
  }, [handlePdf, handleImage]);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type === "application/pdf") handlePdf(file);
    else if (file.type.startsWith("image/")) handleImage(file);
  }, [handlePdf, handleImage]);

  // ── Unified copy: writes all MIME types at once ──

  const handleCopy = async () => {
    try {
      const notionPayload = buildNotionPayload(blocks);
      const md = blocksToMarkdown(blocks);
      const html = await buildClipboardHtmlFromBlocks(blocks, getBlockData, sanitizeLatex);

      const listener = (e: Event) => {
        const ce = e as ClipboardEvent;
        ce.preventDefault();
        ce.stopImmediatePropagation();
        ce.clipboardData?.setData("text/_notion-blocks-v3-production", notionPayload);
        if (html) ce.clipboardData?.setData("text/html", html);
        ce.clipboardData?.setData("text/plain", md);
        ce.clipboardData?.setData("text/markdown", md);
      };
      document.addEventListener("copy", listener, true);
      try {
        document.execCommand("copy");
        flashCopied();
      } finally {
        document.removeEventListener("copy", listener, true);
      }
    } catch { /* */ }
  };

  const handleReset = () => {
    setBlocks([]);
    setPhase("idle");
    setCopied(false);
    setErrorMessage("");
    setFileName("");
    setStatusText("");
    setProgress({ current: 0, total: 0 });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Ready-state label ──

  const readyLabel =
    inputSource === "pdf" ? `${fileName} converted` :
    inputSource === "image" ? "Image converted" :
    "Clipboard content converted";

  // ── Zone class ──

  const zoneClass = [
    "universal-zone",
    phase === "idle" ? (isDragOver ? "universal-zone--dragover" : "universal-zone--idle") : "",
    phase === "processing" ? "universal-zone--processing" : "",
    phase === "ready" ? "universal-zone--collapsed" : "",
    phase === "error" ? "universal-zone--error" : "",
  ].filter(Boolean).join(" ");

  // When formatSlug is set, reorder so that format's logo appears first
  const orderedLogos = formatSlug
    ? [...FORMAT_LOGOS].sort((a, b) => (a.key === formatSlug ? -1 : b.key === formatSlug ? 1 : 0))
    : FORMAT_LOGOS;

  return (
    <>
      <section className={`flex flex-col gap-4 ${phase === "ready" ? "pb-20" : ""}`}>
        <div
          ref={zoneRef}
          className={zoneClass}
          tabIndex={0}
          onClick={() => phase === "idle" && fileInputRef.current?.click()}
          onPaste={phase === "idle" ? handlePaste : undefined}
          onDragEnter={phase === "idle" ? onDragEnter : undefined}
          onDragLeave={phase === "idle" ? onDragLeave : undefined}
          onDragOver={phase === "idle" ? onDragOver : undefined}
          onDrop={phase === "idle" ? onDrop : undefined}
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
                <div className="processing-indicator">
                  <div className="processing-dots">
                    <span /><span /><span />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">{statusText}</p>
                </div>
              )}
            </div>
          )}

          {phase === "ready" && (
            <div className="paste-zone-collapsed-inner">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <span>{readyLabel}</span>
              <Button variant="outline" size="sm" className="ml-auto" onClick={handleReset}>
                Start over
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

        {/* Preview */}
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

      {/* Fixed bottom action bar — single unified copy button */}
      {phase === "ready" && blocks.length > 0 && createPortal(
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border px-4 py-3 animate-barSlideUp z-50">
          <div className="max-w-2xl mx-auto flex items-center justify-center">
            <Button
              variant={copied ? "success" : "default"}
              size="lg"
              className="gap-2.5 px-5 h-10"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <CheckIcon />
                  Copied!
                </>
              ) : (
                <>
                  <span className="flex items-center -space-x-1">
                    {orderedLogos.map(({ key, logo }) => (
                      <LogoIcon
                        key={key}
                        src={logo}
                        alt=""
                        size={20}
                        shape="bare"
                        invertDark={key === "notion"}
                      />
                    ))}
                  </span>
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>
      , document.body)}
    </>
  );
}
