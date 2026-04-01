"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
import { NotionSeshPreview } from "@/components/NotionSeshPreview";
import { PdfPreviewShell } from "@/components/PdfPreviewShell";
import { LogoIcon } from "@/components/LogoIcon";
import { FORMATS } from "@/lib/config/models";
import { Button } from "@/components/ui/button";
import { blocksToMarkdown, buildNotionPayload, getBlockData } from "@/lib/parity/serialize";
import { buildClipboardHtmlFromBlocks } from "@/lib/parity/htmlClipboard";

const sanitizeLatex = (s: string) => s;

function tryCopy(types: Record<string, string>): boolean {
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
    }
  };
  document.addEventListener("copy", listener, true);
  let ok = false;
  try {
    ok = document.execCommand("copy") && cdAvailable;
  } finally {
    document.removeEventListener("copy", listener, true);
  }
  return ok;
}

const CheckIcon = () => (
  <svg className="animate-checkPop" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
);

type CopyState = "idle" | "copied";

interface SharePageClientProps {
  blocks: any[];
  title: string | null;
}

export function SharePageClient({ blocks, title }: SharePageClientProps) {
  const [copyStates, setCopyStates] = useState<Record<string, CopyState>>({});

  const flash = (key: string) => {
    setCopyStates((prev) => ({ ...prev, [key]: "copied" }));
    setTimeout(() => setCopyStates((prev) => ({ ...prev, [key]: "idle" })), 2000);
  };

  const handleCopyNotion = () => {
    const notion = buildNotionPayload(blocks);
    const md = blocksToMarkdown(blocks);
    tryCopy({
      "text/_notion-blocks-v3-production": notion,
      "text/plain": md,
      "text/markdown": md,
    });
    flash("notion");
  };

  const handleCopyMarkdown = () => {
    const md = blocksToMarkdown(blocks);
    tryCopy({ "text/plain": md, "text/markdown": md });
    flash("markdown");
  };

  const handleCopyGoogleDocs = async () => {
    const md = blocksToMarkdown(blocks);
    const htmlContent = await buildClipboardHtmlFromBlocks(blocks, getBlockData, sanitizeLatex) || "";
    tryCopy({
      "text/html": htmlContent,
      "text/plain": md,
      "text/markdown": md,
    });
    flash("google-docs");
  };

  const formats = [
    { key: "notion", label: "Notion", logo: FORMATS.notion.logo, handler: handleCopyNotion },
    { key: "markdown", label: "Obsidian", logo: FORMATS.markdown.logo, handler: handleCopyMarkdown },
    { key: "google-docs", label: "Google Docs", logo: FORMATS["google-docs"].logo, handler: handleCopyGoogleDocs },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Copy buttons */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">
          Copy to
        </p>
        <div className="flex gap-2">
          {formats.map(({ key, label, logo, handler }) => (
            <Button
              key={key}
              variant={copyStates[key] === "copied" ? "success" : "outline"}
              size="lg"
              className="flex-1 gap-2 h-11"
              onClick={handler}
            >
              {copyStates[key] === "copied" ? (
                <>
                  <CheckIcon />
                  Copied!
                </>
              ) : (
                <>
                  <LogoIcon src={logo} alt="" size={18} shape="bare" />
                  {label}
                </>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="rounded-2xl overflow-clip ring-1 ring-border shadow-lg">
        {title && (
          <div className="px-5 py-3 border-b border-border bg-card">
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          </div>
        )}
        <PdfPreviewShell>
          <NotionSeshPreview blocks={blocks} />
        </PdfPreviewShell>
      </div>
    </div>
  );
}
