"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { LogoIcon } from "@/components/LogoIcon";
import { FORMATS, type FormatSlug } from "@/lib/config/models";
import { buildNotionPayload, blocksToMarkdown, getBlockData } from "@/lib/parity/serialize";
import { buildClipboardHtmlFromBlocks } from "@/lib/parity/htmlClipboard";
import { Button } from "@/components/ui/button";

type CopyFeedback = null | "notion" | "markdown" | "google-docs";

const sanitizeLatex = (s: string) => s;

const PASTE_DESTINATIONS: Record<string, string> = {
  notion: "Notion",
  markdown: "Obsidian",
  "google-docs": "Google Docs",
};

const CheckIcon = () => (
  <svg className="animate-checkPop" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
);

interface CopyActionBarProps {
  blocks: any[];
  formatSlug?: FormatSlug;
}

export function CopyActionBar({ blocks, formatSlug }: CopyActionBarProps) {
  const [copyFeedback, setCopyFeedback] = useState<CopyFeedback>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

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
        ce.clipboardData?.setData("text/markdown", md);
      };
      document.addEventListener("copy", listener, true);
      try {
        document.execCommand("copy");
        flashFeedback("notion");
      } finally {
        document.removeEventListener("copy", listener, true);
      }
    } catch { /* */ }
  };

  const handleCopyMarkdown = () => {
    try {
      const md = blocksToMarkdown(blocks);
      const listener = (e: Event) => {
        const ce = e as ClipboardEvent;
        ce.preventDefault();
        ce.stopImmediatePropagation();
        ce.clipboardData?.setData("text/plain", md);
        ce.clipboardData?.setData("text/markdown", md);
      };
      document.addEventListener("copy", listener, true);
      try {
        document.execCommand("copy");
        flashFeedback("markdown");
      } finally {
        document.removeEventListener("copy", listener, true);
      }
    } catch { /* */ }
  };

  const handleCopyGoogleDocs = async () => {
    try {
      const html = await buildClipboardHtmlFromBlocks(blocks, getBlockData, sanitizeLatex);
      if (!html) return;
      const md = blocksToMarkdown(blocks);
      const listener = (e: Event) => {
        const ce = e as ClipboardEvent;
        ce.preventDefault();
        ce.stopImmediatePropagation();
        ce.clipboardData?.setData("text/html", html);
        ce.clipboardData?.setData("text/plain", md);
        ce.clipboardData?.setData("text/markdown", md);
      };
      document.addEventListener("copy", listener, true);
      try {
        document.execCommand("copy");
        flashFeedback("google-docs");
      } finally {
        document.removeEventListener("copy", listener, true);
      }
    } catch { /* */ }
  };

  const actions = [
    { key: "notion" as const, handler: handleCopyNotion },
    { key: "markdown" as const, handler: handleCopyMarkdown },
    { key: "google-docs" as const, handler: handleCopyGoogleDocs },
  ].sort((a, b) => formatSlug ? (a.key === formatSlug ? -1 : b.key === formatSlug ? 1 : 0) : 0);

  return createPortal(
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border px-4 py-3 animate-barSlideUp z-50">
      <div className="max-w-2xl mx-auto flex items-center justify-center gap-2">
        {actions.map(({ key, handler }) => (
          <Button
            key={key}
            variant={copyFeedback === key ? "success" : "outline"}
            size="lg"
            className={formatSlug && key === formatSlug ? "ring-2 ring-primary/30" : ""}
            onClick={handler}
          >
            {copyFeedback === key ? (
              <><CheckIcon /> Now paste in {PASTE_DESTINATIONS[key]}</>
            ) : (
              <>
                <LogoIcon
                  src={FORMATS[key].logo}
                  alt=""
                  size={20}
                  shape="bare"
                />
                {FORMATS[key].label}
              </>
            )}
          </Button>
        ))}
      </div>
    </div>,
    document.body
  );
}
