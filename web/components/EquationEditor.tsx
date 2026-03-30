"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useRef } from "react";
import { MathLiveField } from "@/components/MathLiveField";
import { LogoIcon } from "@/components/LogoIcon";
import { Button } from "@/components/ui/button";
import { BlockFactory } from "@/lib/parity/blockFactory";
import { buildNotionPayload, blocksToMarkdown, getBlockData } from "@/lib/parity/serialize";
import { buildClipboardHtmlFromBlocks } from "@/lib/parity/htmlClipboard";
import { FORMATS, type FormatSlug } from "@/lib/config/models";

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

interface EquationEditorProps {
  formatSlug?: FormatSlug;
}

export function EquationEditor({ formatSlug }: EquationEditorProps) {
  const [latex, setLatex] = useState("");
  const [copiedLatex, setCopiedLatex] = useState(false);
  const [copiedAnywhere, setCopiedAnywhere] = useState(false);
  const latexTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const anywhereTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const editorRef = useRef<HTMLDivElement>(null);

  /** Read LaTeX directly from the math-field DOM element as source of truth */
  const getRawLatex = (): string => {
    const mf = editorRef.current?.querySelector("math-field") as any;
    if (mf?.getValue) return mf.getValue("latex") ?? "";
    if (mf?.value) return mf.value;
    return latex;
  };

  /** Strip \; thick spaces from math (artifact of mathModeSpace UX), preserve spaces inside \text{} */
  const getCleanLatex = (): string => {
    const raw = getRawLatex();
    // Strip \; outside \text{} blocks
    let cleaned = raw.replace(/(\\text\{[^}]*\})|\\;/g, (match, textBlock) => {
      if (textBlock) return textBlock;
      return "";
    });
    // Remove empty groups left behind: ^{} or _{}
    cleaned = cleaned.replace(/[\^_]\{\}/g, "");
    return cleaned;
  };

  const flashLatex = () => {
    clearTimeout(latexTimer.current);
    setCopiedLatex(true);
    latexTimer.current = setTimeout(() => setCopiedLatex(false), 2000);
  };

  const flashAnywhere = () => {
    clearTimeout(anywhereTimer.current);
    setCopiedAnywhere(true);
    anywhereTimer.current = setTimeout(() => setCopiedAnywhere(false), 2000);
  };

  const handleCopyLatex = async () => {
    const val = getCleanLatex();
    if (!val.trim()) return;
    await navigator.clipboard.writeText(val);
    flashLatex();
  };

  const handleCopyAnywhere = async () => {
    const val = getCleanLatex();
    if (!val.trim()) return;
    try {
      const block = BlockFactory.math(val);
      const blocks = [block];

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
        flashAnywhere();
      } finally {
        document.removeEventListener("copy", listener, true);
      }
    } catch { /* */ }
  };

  const orderedLogos = formatSlug && formatSlug !== "pdf"
    ? FORMAT_LOGOS.filter((l) => l.key === formatSlug)
    : FORMAT_LOGOS;

  return (
    <div className="flex flex-col gap-4">
      {/* MathLive editor */}
      <div ref={editorRef}>
        <MathLiveField
          value={latex}
          onChange={setLatex}
          className="equation-editor-wrap"
        />
      </div>

      {/* Copy buttons */}
      <div className="flex items-center gap-2">
        {/* Copy LaTeX */}
        <Button
          variant={copiedLatex ? "success" : "default"}
          size="lg"
          className="flex-1 gap-2 h-11 text-base"
          onClick={handleCopyLatex}
          disabled={!latex.trim()}
          aria-live="polite"
        >
          {copiedLatex ? (
            <>
              <CheckIcon />
              Copied!
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copy LaTeX
            </>
          )}
        </Button>

        {/* Copy Anywhere / Copy to Format */}
        <Button
          variant={copiedAnywhere ? "success" : "outline"}
          size="lg"
          className="flex-1 gap-2.5 h-11 text-base"
          onClick={handleCopyAnywhere}
          disabled={!latex.trim()}
          aria-live="polite"
        >
          {copiedAnywhere ? (
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
      </div>
    </div>
  );
}
