"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useRef, useCallback, useEffect } from "react";
import { NotionSeshPreview } from "@/components/NotionSeshPreview";
import { CopyActionBar } from "@/components/CopyActionBar";
import { parseMarkdownToBlocks, jsonToNotionBlocks } from "@/lib/parity/blockFactory";
import { ocrImage, readFileAsBase64 } from "@/lib/ocr";
import { type FormatSlug } from "@/lib/config/models";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Phase = "idle" | "processing" | "ready" | "error";

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
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (phase === "ready") {
      const t = setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const handleFile = useCallback(async (file: File) => {
    setBlocks([]);
    setErrorMessage("");
    setFileName(file.name);
    setPhase("processing");

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
      if (phase !== "idle") return;
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
  ].filter(Boolean).join(" ");

  return (
    <>
      <section className={`flex flex-col gap-4 ${phase === "ready" ? "pb-20" : ""}`}>
        <div
          className={dropZoneClass}
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

      {phase === "ready" && blocks.length > 0 && (
        <CopyActionBar blocks={blocks} formatSlug={formatSlug} />
      )}
    </>
  );
}
