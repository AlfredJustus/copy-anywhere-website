"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { NotionSeshPreview } from "@/components/NotionSeshPreview";
import { PdfPreviewShell } from "@/components/PdfPreviewShell";
import { LogoIcon } from "@/components/LogoIcon";
import { blocksToMarkdown, buildNotionPayload, getBlockData } from "@/lib/parity/serialize";
import { buildClipboardHtmlFromBlocks } from "@/lib/parity/htmlClipboard";
import { FORMATS, type FormatSlug } from "@/lib/config/models";
import { Button } from "@/components/ui/button";
import { renderPdfBlob, downloadBlob, type PdfProgress } from "@/lib/pdf/renderPdf";

const sanitizeLatex = (s: string) => s;

const FORMAT_LOGOS: { key: FormatSlug; logo: string }[] = [
  { key: "notion", logo: FORMATS.notion.logo },
  { key: "markdown", logo: FORMATS.markdown.logo },
  { key: "google-docs", logo: FORMATS["google-docs"].logo },
];

const PASTE_DESTINATIONS: Partial<Record<FormatSlug, string>> = {
  notion: "Notion",
  markdown: "Obsidian",
  "google-docs": "Google Docs",
};

const CheckIcon = () => (
  <svg className="animate-checkPop" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
);

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
);

const SpinnerIcon = ({ size = 16 }: { size?: number }) => (
  <svg className="animate-spin" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2a10 10 0 0 1 10 10" /></svg>
);

const PROGRESS_LABELS: Record<PdfProgress, string> = {
  preparing: "Preparing…",
  generating: "Generating PDF…",
};

interface ResultPreviewProps {
  blocks: any[];
  formatSlug?: FormatSlug;
  onReset: () => void;
}

function deriveTitle(blocks: any[]): string {
  for (const block of blocks) {
    const data = getBlockData(block);
    if (data.type === "header" || data.type === "sub_header" || data.type === "sub_sub_header") {
      const text = data.title?.[0]?.[0];
      if (text && typeof text === "string" && text.trim()) return text.trim();
    }
  }
  return "Copy Anywhere";
}

export function ResultPreview({ blocks, formatSlug, onReset }: ResultPreviewProps) {
  const isPdfMode = formatSlug === "pdf";

  const defaultTitle = useMemo(() => deriveTitle(blocks), [blocks]);
  const [pdfTitle, setPdfTitle] = useState(defaultTitle);
  const [copied, setCopied] = useState(false);
  const [pdfState, setPdfState] = useState<"idle" | "generating" | "done" | "error">("idle");
  const [pdfProgress, setPdfProgress] = useState<PdfProgress>("preparing");
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  // In standard mode: "blocks" = normal preview, "pdf" = inline PDF viewer
  const [viewMode, setViewMode] = useState<"blocks" | "pdf">(isPdfMode ? "pdf" : "blocks");
  const feedbackTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    return () => clearTimeout(t);
  }, []);

  // Revoke blob URL on unmount
  useEffect(() => {
    return () => {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
  }, [pdfBlobUrl]);

  // Update blob URL when title changes (so PDF viewer shows the new filename)
  useEffect(() => {
    if (!pdfBlob || pdfState !== "done") return;
    const file = new File([pdfBlob], `${pdfTitle || "Copy Anywhere"}.pdf`, { type: "application/pdf" });
    const url = URL.createObjectURL(file);
    setPdfBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  }, [pdfTitle, pdfBlob, pdfState]);

  const generatePdf = useCallback(async () => {
    if (pdfState === "generating") return;
    setPdfState("generating");
    setPdfProgress("preparing");
    setPdfError(null);

    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }

    try {
      const blob = await renderPdfBlob(blocks, (step) => setPdfProgress(step));
      const file = new File([blob], `${pdfTitle || "Copy Anywhere"}.pdf`, { type: "application/pdf" });
      const url = URL.createObjectURL(file);
      setPdfBlob(blob);
      setPdfBlobUrl(url);
      setPdfState("done");
    } catch (err) {
      console.error("[Copy Anywhere] PDF generation failed:", err);
      setPdfError(err instanceof Error ? err.message : "PDF generation failed");
      setPdfState("error");
    }
  }, [blocks, pdfBlobUrl, pdfState]);

  // Auto-generate PDF when in PDF mode
  useEffect(() => {
    if (isPdfMode && blocks.length > 0 && pdfState === "idle") {
      generatePdf();
    }
  }, [isPdfMode, blocks, pdfState, generatePdf]);

  const flashCopied = () => {
    clearTimeout(feedbackTimer.current);
    setCopied(true);
    feedbackTimer.current = setTimeout(() => setCopied(false), 2000);
  };

  const handleCopy = async () => {
    try {
      const needNotion = !formatSlug || formatSlug === "notion";
      const needHtml = !formatSlug || formatSlug === "google-docs";

      const notionPayload = needNotion ? buildNotionPayload(blocks) : null;
      const md = blocksToMarkdown(blocks);
      const html = needHtml
        ? await buildClipboardHtmlFromBlocks(blocks, getBlockData, sanitizeLatex)
        : null;

      const listener = (e: Event) => {
        const ce = e as ClipboardEvent;
        ce.preventDefault();
        ce.stopImmediatePropagation();
        if (notionPayload) ce.clipboardData?.setData("text/_notion-blocks-v3-production", notionPayload);
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

  const handlePdfDownload = () => {
    if (pdfBlob) {
      downloadBlob(pdfBlob, `${pdfTitle || "Copy Anywhere"}.pdf`);
    }
  };

  // Standard mode: switch to PDF view and generate if needed
  const handleSwitchToPdf = () => {
    setViewMode("pdf");
    if (pdfState === "idle") {
      generatePdf();
    }
  };

  const handleSwitchToBlocks = () => {
    setViewMode("blocks");
  };

  const handleReset = () => {
    setCopied(false);
    setPdfState("idle");
    setViewMode(isPdfMode ? "pdf" : "blocks");
    if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    setPdfBlobUrl(null);
    setPdfBlob(null);
    setPdfError(null);
    onReset();
  };

  // On format-specific SEO pages, show only that format's logo; on homepage show all
  const orderedLogos = formatSlug && formatSlug !== "pdf"
    ? FORMAT_LOGOS.filter((l) => l.key === formatSlug)
    : FORMAT_LOGOS;

  const showPdfTab = !formatSlug || isPdfMode;
  const showingPdf = isPdfMode || viewMode === "pdf";

  // ---- PDF viewer body (shared between both modes) ----
  const pdfViewerBody = (
    <>
      {pdfState === "generating" && (
        <div className="flex flex-col items-center justify-center gap-3 py-32 bg-muted/30">
          <SpinnerIcon size={28} />
          <p className="text-sm font-medium text-muted-foreground">
            {PROGRESS_LABELS[pdfProgress]}
          </p>
        </div>
      )}

      {pdfState === "error" && (
        <div className="flex flex-col items-center justify-center gap-3 py-20 bg-muted/30">
          <p className="text-sm text-destructive">{pdfError}</p>
          <Button variant="outline" size="sm" onClick={() => { setPdfState("idle"); generatePdf(); }}>
            Retry
          </Button>
        </div>
      )}

      {pdfState === "done" && pdfBlobUrl && (
        <iframe
          src={`${pdfBlobUrl}#toolbar=0`}
          className="w-full border-0"
          style={{ minHeight: "80vh" }}
          title="PDF Preview"
        />
      )}
    </>
  );

  // ---- PDF-only mode (formatSlug === "pdf") ----
  if (isPdfMode) {
    return (
      <div className="animate-slideUp rounded-2xl overflow-clip ring-1 ring-border shadow-lg scroll-mt-16" ref={containerRef}>
        <div className="sticky top-14 z-10 bg-card border-b border-border px-5 py-3 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={pdfTitle}
              onChange={(e) => setPdfTitle(e.target.value)}
              placeholder="Filename"
              className="flex-1 min-w-0 h-8 rounded-md border border-border bg-background px-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span className="text-sm text-muted-foreground shrink-0">.pdf</span>
            <Button variant="outline" size="sm" className="shrink-0" onClick={handleReset}>
              Start over
            </Button>
          </div>
          <Button
            variant="default"
            size="lg"
            className="w-full gap-2 h-11 text-base"
            onClick={handlePdfDownload}
            disabled={!pdfBlob}
          >
            <DownloadIcon />
            Download PDF
          </Button>
        </div>
        {pdfViewerBody}
      </div>
    );
  }

  // ---- Standard mode: blocks preview with PDF tab ----
  return (
    <div className="animate-slideUp rounded-2xl overflow-clip ring-1 ring-border shadow-lg scroll-mt-16" ref={containerRef}>
      {/* Sticky header */}
      <div className="sticky top-14 z-10 bg-card border-b border-border">
        {/* Tab bar — only shown when PDF tab is available */}
        {showPdfTab && (
          <div className="flex items-center justify-between px-5 pt-3 pb-0">
            <div className="flex gap-0">
              <button
                onClick={handleSwitchToBlocks}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  !showingPdf
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Copy
              </button>
              <button
                onClick={handleSwitchToPdf}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  showingPdf
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                PDF
              </button>
            </div>
            {!showingPdf && (
              <Button variant="outline" size="sm" onClick={handleReset}>
                Start over
              </Button>
            )}
          </div>
        )}

        {/* Action bar — contextual to active tab */}
        <div className="px-5 py-3">
          {showingPdf ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={pdfTitle}
                  onChange={(e) => setPdfTitle(e.target.value)}
                  placeholder="Filename"
                  className="flex-1 min-w-0 h-8 rounded-md border border-border bg-background px-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <span className="text-sm text-muted-foreground shrink-0">.pdf</span>
                <Button variant="outline" size="sm" className="shrink-0" onClick={handleReset}>
                  Start over
                </Button>
              </div>
              <Button
                variant="default"
                size="lg"
                className="w-full gap-2 h-11 text-base"
                onClick={handlePdfDownload}
                disabled={!pdfBlob}
              >
                <DownloadIcon />
                Download PDF
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
            <Button
              variant={copied ? "success" : "default"}
              size="lg"
              className="flex-1 gap-2.5 h-11 text-base"
              onClick={handleCopy}
              aria-live="polite"
            >
              {copied ? (
                <>
                  <CheckIcon />
                  {formatSlug && PASTE_DESTINATIONS[formatSlug]
                    ? `Now paste in ${PASTE_DESTINATIONS[formatSlug]}`
                    : "Now paste Anywhere"}
                </>
              ) : (
                <>
                  {orderedLogos.length === 1 ? (
                    <>
                      <LogoIcon
                        src={orderedLogos[0].logo}
                        alt=""
                        size={20}
                        shape="bare"
                      />
                      Copy to {FORMATS[orderedLogos[0].key].label}
                    </>
                  ) : (
                    <>
                      Copy Anywhere
                      <span className="flex items-center -space-x-1">
                        {orderedLogos.map(({ key, logo }) => (
                          <LogoIcon
                            key={key}
                            src={logo}
                            alt=""
                            size={20}
                            shape="bare"
                          />
                        ))}
                      </span>
                    </>
                  )}
                </>
              )}
            </Button>
            {!showPdfTab && (
              <Button variant="outline" size="lg" className="shrink-0 h-11" onClick={handleReset}>
                Start over
              </Button>
            )}
            </div>
          )}
        </div>
      </div>

      {/* Body: blocks or PDF */}
      {showingPdf ? (
        pdfViewerBody
      ) : (
        <PdfPreviewShell>
          <NotionSeshPreview blocks={blocks} />
        </PdfPreviewShell>
      )}
    </div>
  );
}
