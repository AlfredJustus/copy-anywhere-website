"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { NotionSeshPreview } from "@/components/NotionSeshPreview";
import { parseHtmlToBlocks } from "@/lib/parity/htmlParser";
import { parseMarkdownToBlocks, jsonToNotionBlocks } from "@/lib/parity/blockFactory";
import { blocksToMarkdown, buildNotionPayload } from "@/lib/parity/serialize";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Phase = "idle" | "processing" | "ready";
type CopyFeedback = null | "notion" | "markdown";

export function ConverterApp() {
  const [blocks, setBlocks] = useState<any[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [copyFeedback, setCopyFeedback] = useState<CopyFeedback>(null);

  const feedbackTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const resultRef = useRef<HTMLDivElement>(null);

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
  };

  return (
    <>
      <section className={`flex flex-col gap-4 ${phase === "ready" ? "pb-20" : ""}`}>
        {/* Paste zone */}
        <div
          className={`paste-zone ${phase === "idle" ? "paste-zone--idle" : ""} ${phase === "processing" ? "paste-zone--processing" : ""} ${phase === "ready" ? "paste-zone--collapsed" : ""}`}
          tabIndex={0}
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
              <p className="text-base font-semibold text-foreground">Paste your ChatGPT content</p>
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

          {phase === "ready" && (
            <div className="paste-zone-collapsed-inner">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <span>Content converted</span>
              <Button variant="outline" size="sm" className="ml-auto" onClick={handleReset}>
                Paste new
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
