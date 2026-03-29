"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useRef, useCallback } from "react";
import { ResultPreview } from "@/components/ResultPreview";
import { extractNotionPageId, recordMapToBlocks } from "@/lib/parity/notionImport";
import { type FormatSlug } from "@/lib/config/models";
import { Button } from "@/components/ui/button";

type Phase = "idle" | "processing" | "ready" | "error";

interface NotionImportToolProps {
  formatSlug?: FormatSlug | undefined;
}

export function NotionImportTool({ formatSlug }: NotionImportToolProps) {
  const [blocks, setBlocks] = useState<any[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [url, setUrl] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  const handleImport = useCallback(async (notionUrl: string) => {
    const pageId = extractNotionPageId(notionUrl);
    if (!pageId) {
      setErrorMessage("Invalid Notion URL. Paste a link like notion.so/Your-Page-abc123");
      setPhase("error");
      return;
    }

    setBlocks([]);
    setErrorMessage("");
    setPhase("processing");

    try {
      const res = await fetch("/api/notion-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to fetch page (${res.status})`);
      }

      const data = await res.json();
      const importedBlocks = recordMapToBlocks(data.recordMap, pageId);

      if (importedBlocks.length === 0) {
        throw new Error("No content found on this page. Make sure it has text, not just databases or embeds.");
      }

      setBlocks(importedBlocks);
      setPhase("ready");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to import Notion page.");
      setPhase("error");
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) handleImport(url.trim());
  };

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text/plain").trim();
    if (pasted && (pasted.includes("notion.so") || pasted.includes("notion.site"))) {
      e.preventDefault();
      setUrl(pasted);
      handleImport(pasted);
    }
  }, [handleImport]);

  const handleReset = () => {
    setBlocks([]);
    setPhase("idle");
    setErrorMessage("");
    setUrl("");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const dropZoneClass = [
    "drop-zone",
    phase === "idle" ? "drop-zone--idle" : "",
    phase === "processing" ? "drop-zone--processing" : "",
    phase === "ready" ? "hidden" : "",
    phase === "error" ? "drop-zone--error" : "",
  ].filter(Boolean).join(" ");

  return (
    <section className="flex flex-col gap-4">
      <div className={dropZoneClass}>
        {phase === "idle" && (
          <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 w-full px-4">
            <div className="drop-zone-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </div>
            <p className="text-base font-semibold text-foreground">Import a public Notion page</p>
            <div className="flex w-full max-w-md gap-2">
              <input
                ref={inputRef}
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onPaste={handlePaste}
                placeholder="https://notion.so/Your-Page-abc123..."
                className="flex-1 h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <Button type="submit" disabled={!url.trim()}>
                Import
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              The page must be published to the web via Notion&apos;s Share menu
            </p>
          </form>
        )}

        {phase === "processing" && (
          <div className="processing-indicator">
            <div className="processing-dots">
              <span /><span /><span />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Fetching Notion page&hellip;</p>
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
      </div>

      {/* Result */}
      {phase === "ready" && blocks.length > 0 && (
        <ResultPreview blocks={blocks} formatSlug={formatSlug} onReset={handleReset} />
      )}
    </section>
  );
}
