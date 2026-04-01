"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { LogoIcon } from "@/components/LogoIcon";
import { FORMATS, type FormatSlug } from "@/lib/config/models";
import { buildNotionPayload, blocksToMarkdown, getBlockData } from "@/lib/parity/serialize";
import { buildClipboardHtmlFromBlocks } from "@/lib/parity/htmlClipboard";
import { usePrecomputedHtml } from "@/components/usePrecomputedHtml";
import { Button } from "@/components/ui/button";

type CopyFeedback = null
  | { status: "success"; format: "notion" | "markdown" | "google-docs" }
  | { status: "partial"; message: string }
  | { status: "failed" };

const sanitizeLatex = (s: string) => s;

const PASTE_DESTINATIONS: Record<string, string> = {
  notion: "Notion",
  markdown: "Obsidian",
  "google-docs": "Google Docs",
};

const CheckIcon = () => (
  <svg className="animate-checkPop" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
);

const WarnIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
);

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);

/* ── Clipboard helper ─────────────────────────────────── */

interface CopyResult {
  ok: boolean;
  wrote: Record<string, boolean>;
}

function tryCopy(types: Record<string, string>): CopyResult {
  const wrote: Record<string, boolean> = {};
  let cdAvailable = false;
  const listener = (e: Event) => {
    const ce = e as ClipboardEvent;
    ce.preventDefault();
    ce.stopImmediatePropagation();
    const cd = ce.clipboardData;
    if (!cd) return;
    cdAvailable = true;
    for (const [mime, data] of Object.entries(types)) {
      cd.setData(mime, data);
      wrote[mime] = cd.getData(mime) !== "";
    }
  };
  document.addEventListener("copy", listener, true);
  let ok = false;
  try {
    ok = document.execCommand("copy") && cdAvailable;
  } finally {
    document.removeEventListener("copy", listener, true);
  }
  return { ok, wrote };
}

/* ── Component ────────────────────────────────────────── */

interface CopyActionBarProps {
  blocks: any[];
  formatSlug?: FormatSlug;
}

export function CopyActionBar({ blocks, formatSlug }: CopyActionBarProps) {
  const precomputed = usePrecomputedHtml(blocks);
  const [copyFeedback, setCopyFeedback] = useState<CopyFeedback>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const flash = (fb: CopyFeedback, ms = 2000) => {
    clearTimeout(feedbackTimer.current);
    setCopyFeedback(fb);
    feedbackTimer.current = setTimeout(() => setCopyFeedback(null), ms);
  };

  const handleCopyNotion = () => {
    try {
      const payload = buildNotionPayload(blocks);
      const md = blocksToMarkdown(blocks);
      const { ok, wrote } = tryCopy({
        "text/_notion-blocks-v3-production": payload,
        "text/plain": md,
        "text/markdown": md,
      });
      if (!ok || !wrote["text/plain"]) {
        flash({ status: "failed" }, 3000);
      } else if (!wrote["text/_notion-blocks-v3-production"]) {
        flash({ status: "partial", message: "Copied as plain text. Notion blocks did not copy." }, 3000);
      } else {
        flash({ status: "success", format: "notion" });
      }
    } catch {
      flash({ status: "failed" }, 3000);
    }
  };

  const handleCopyMarkdown = () => {
    try {
      const md = blocksToMarkdown(blocks);
      const { ok, wrote } = tryCopy({
        "text/plain": md,
        "text/markdown": md,
      });
      if (!ok || !wrote["text/plain"]) {
        flash({ status: "failed" }, 3000);
      } else {
        flash({ status: "success", format: "markdown" });
      }
    } catch {
      flash({ status: "failed" }, 3000);
    }
  };

  const handleCopyGoogleDocs = async () => {
    try {
      const html = precomputed.html ?? await buildClipboardHtmlFromBlocks(blocks, getBlockData, sanitizeLatex);
      if (!html) return;
      const md = blocksToMarkdown(blocks);
      const { ok, wrote } = tryCopy({
        "text/html": html,
        "text/plain": md,
        "text/markdown": md,
      });
      if (!ok || !wrote["text/plain"]) {
        flash({ status: "failed" }, 3000);
      } else if (!wrote["text/html"]) {
        flash({ status: "partial", message: "Copied as plain text. Formatted HTML did not copy." }, 3000);
      } else {
        flash({ status: "success", format: "google-docs" });
      }
    } catch {
      flash({ status: "failed" }, 3000);
    }
  };

  const actions = [
    { key: "notion" as const, handler: handleCopyNotion },
    { key: "markdown" as const, handler: handleCopyMarkdown },
    { key: "google-docs" as const, handler: handleCopyGoogleDocs },
  ].sort((a, b) => formatSlug ? (a.key === formatSlug ? -1 : b.key === formatSlug ? 1 : 0) : 0);

  const feedbackForKey = (key: string) => {
    if (!copyFeedback) return null;
    if (copyFeedback.status === "success" && copyFeedback.format === key) return copyFeedback;
    if (copyFeedback.status !== "success") {
      // Show error/partial on the button that was just clicked — approximate via last-feedback
      // Since only one button triggers at a time, the non-success feedback applies to all buttons briefly
      return null;
    }
    return null;
  };

  // For non-success feedback, show it on all buttons as a banner-like state
  const globalFeedback = copyFeedback && copyFeedback.status !== "success" ? copyFeedback : null;

  return createPortal(
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border px-4 py-3 animate-barSlideUp z-50">
      {globalFeedback && (
        <div className={`max-w-2xl mx-auto mb-2 flex items-center justify-center gap-2 text-sm font-medium ${
          globalFeedback.status === "failed" ? "text-destructive" : "text-amber-600 dark:text-amber-400"
        }`}>
          {globalFeedback.status === "failed" ? <XIcon /> : <WarnIcon />}
          {globalFeedback.status === "failed"
            ? "Copy failed. Nothing was copied."
            : globalFeedback.message}
        </div>
      )}
      <div className="max-w-2xl mx-auto flex items-center justify-center gap-2">
        {actions.map(({ key, handler }) => {
          const fb = feedbackForKey(key);
          return (
            <Button
              key={key}
              variant={fb ? "success" : "outline"}
              size="lg"
              className={formatSlug && key === formatSlug ? "ring-2 ring-primary/30" : ""}
              onClick={handler}
            >
              {fb ? (
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
          );
        })}
      </div>
    </div>,
    document.body
  );
}
