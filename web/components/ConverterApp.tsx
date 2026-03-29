"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback } from "react";
import { ResultPreview } from "@/components/ResultPreview";
import { parseHtmlToBlocks } from "@/lib/parity/htmlParser";
import { parseMarkdownToBlocks, jsonToNotionBlocks } from "@/lib/parity/blockFactory";
import { MODELS, type ModelSlug, type FormatSlug } from "@/lib/config/models";
import { Button } from "@/components/ui/button";

type Phase = "idle" | "processing" | "ready";

interface ConverterAppProps {
  modelSlug?: ModelSlug;
  formatSlug?: FormatSlug;
}

export function ConverterApp({ modelSlug = "chatgpt", formatSlug = "notion" }: ConverterAppProps) {
  const [blocks, setBlocks] = useState<any[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");

  const modelLabel = MODELS[modelSlug]?.label ?? "ChatGPT";

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

  const processPaste = useCallback((html: string, plain: string) => {
    if (!html && !plain) return;

    setPhase("processing");

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

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const html = e.clipboardData.getData("text/html");
    const plain = e.clipboardData.getData("text/plain");
    processPaste(html, plain);
  }, [processPaste]);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (phase !== "idle") return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;

      e.preventDefault();
      const html = e.clipboardData?.getData("text/html") || "";
      const plain = e.clipboardData?.getData("text/plain") || "";
      processPaste(html, plain);
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [phase, processPaste]);

  const handleReset = () => {
    setBlocks([]);
    setPhase("idle");
  };

  return (
    <section className="flex flex-col gap-4">
      {/* Paste zone */}
      <div
        className={`paste-zone ${phase === "idle" ? "paste-zone--idle" : ""} ${phase === "processing" ? "paste-zone--processing" : ""} ${phase === "ready" ? "hidden" : ""}`}
        tabIndex={0}
        aria-label="Paste your content here to convert"
        onPaste={handlePaste}
      >
        {phase === "idle" && (
          <>
            <div className="paste-zone-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="2" width="6" height="4" rx="1" />
                <path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
                <path d="M9 14l2 2 4-4" />
              </svg>
            </div>
            <p className="text-base font-semibold text-foreground">Paste your {modelLabel} content</p>
            <p className="mt-1 text-xs text-muted-foreground">
              <kbd className="inline-block px-1 py-px font-mono text-[10px] font-medium bg-muted border border-border rounded-sm">⌘V</kbd>
              {" / "}
              <kbd className="inline-block px-1 py-px font-mono text-[10px] font-medium bg-muted border border-border rounded-sm">Ctrl+V</kbd>
              {" \u2014 anywhere on this page"}
            </p>
          </>
        )}

        {phase === "processing" && (
          <div className="processing-indicator">
            <div className="processing-dots">
              <span /><span /><span />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Converting&hellip;</p>
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
