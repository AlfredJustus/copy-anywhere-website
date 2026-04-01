"use client";

import { useEffect, useRef, useState } from "react";
import { buildClipboardHtmlFromBlocks } from "@/lib/parity/htmlClipboard";
import { getBlockData } from "@/lib/parity/serialize";

const sanitizeLatex = (s: string) => s;

/**
 * Eagerly pre-computes Google Docs clipboard HTML as soon as blocks arrive,
 * so copy is instant when the user clicks.
 */
export function usePrecomputedHtml(blocks: any[]) {
  const [html, setHtml] = useState<string | null>(null);
  const generationRef = useRef(0);

  useEffect(() => {
    if (!blocks || blocks.length === 0) {
      setHtml(null);
      return;
    }

    const gen = ++generationRef.current;

    buildClipboardHtmlFromBlocks(blocks, getBlockData, sanitizeLatex).then(
      (result) => {
        if (gen === generationRef.current) setHtml(result);
      },
      () => {
        // Pre-computation failed — handleCopy will fall back to on-demand
      },
    );
  }, [blocks]);

  return { html, ready: html !== null };
}
