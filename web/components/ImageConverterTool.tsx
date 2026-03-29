"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useRef, useCallback, useEffect } from "react";
import { ResultPreview } from "@/components/ResultPreview";
import { parseMarkdownToBlocks, jsonToNotionBlocks } from "@/lib/parity/blockFactory";
import { ocrImage, readFileAsBase64, checkQuota, RateLimitError } from "@/lib/ocr";
import { type FormatSlug } from "@/lib/config/models";
import { Button } from "@/components/ui/button";

type Phase = "idle" | "processing" | "ready" | "error" | "rate-limited";

interface ImageConverterToolProps {
  formatSlug?: FormatSlug;
}

export function ImageConverterTool({ formatSlug = "notion" }: ImageConverterToolProps) {
  const [blocks, setBlocks] = useState<any[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
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

  const handleReset = () => {
    setBlocks([]);
    setPhase("idle");
    setErrorMessage("");
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Paste support ──

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const files = e.clipboardData.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("image/")) handleFile(file);
    }
  }, [handleFile]);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (phase !== "idle" && phase !== "error") return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;

      e.preventDefault();
      const files = e.clipboardData?.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file.type.startsWith("image/")) handleFile(file);
      }
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [phase, handleFile]);

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
    if (file && file.type.startsWith("image/")) handleFile(file);
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
        tabIndex={0}
        onClick={() => (phase === "idle" || phase === "error") && fileInputRef.current?.click()}
        onPaste={phase === "idle" || phase === "error" ? handlePaste : undefined}
        onDragEnter={phase === "idle" || phase === "error" ? onDragEnter : undefined}
        onDragLeave={phase === "idle" || phase === "error" ? onDragLeave : undefined}
        onDragOver={phase === "idle" || phase === "error" ? onDragOver : undefined}
        onDrop={phase === "idle" || phase === "error" ? onDrop : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="drop-zone-input"
          onChange={onFileChange}
          tabIndex={-1}
        />

        {phase === "idle" && (
          <>
            <div className="drop-zone-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <p className="text-base font-semibold text-foreground">Drop or paste your image here</p>
            <p className="mt-1 text-xs text-muted-foreground">
              <kbd className="inline-block px-1 py-px font-mono text-[10px] font-medium bg-muted border border-border rounded-sm">⌘V</kbd>
              {" to paste — or click to browse. PNG, JPG, WEBP, and more"}
            </p>
          </>
        )}

        {phase === "processing" && (
          <div className="processing-indicator">
            <div className="processing-dots">
              <span /><span /><span />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Reading image&hellip;</p>
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
