/* eslint-disable @typescript-eslint/no-explicit-any */
// Shared MathJax loading, LaTeX collection, and utility functions
// Used by both htmlClipboard.ts (Google Docs PNG pipeline) and PDF SVG pipeline

import { parseRichText } from "./blockFactory";

// ---- Constants ----
export const MATHJAX_CDN_URL =
  "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg-full.js";
export const RENDER_TIMEOUT_FLOOR_MS = 60;
export const BLOCK_EQ_MAX_WIDTH = 520;
export const INLINE_BASE_FONT_PX = 16;

// ---- Utility functions ----

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function timeoutPromise(ms: number, label: string): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(label)), ms);
  });
}


export function isRichTextArray(value: any): boolean {
  return (
    Array.isArray(value) && value.every((segment: any) => Array.isArray(segment))
  );
}

export function normalizeTableCellRichText(cell: any): any[] {
  if (isRichTextArray(cell)) return cell;
  if (cell == null) return [];
  return parseRichText(String(cell));
}

export function scaleCssLength(value: string, factor: number): string | null {
  const match = String(value || "")
    .trim()
    .match(/^(-?\d*\.?\d+)([a-z%]*)$/i);
  if (!match) return null;
  const scaled = Number(match[1]) * factor;
  const unit = match[2] || "px";
  return `${scaled.toFixed(4).replace(/\.?0+$/, "")}${unit}`;
}

export function dataUrlFromBlob(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () =>
      reject(reader.error || new Error("Failed to read blob as data URL"));
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

export function stripTrailingDisplayTag(latex: string): string {
  return String(latex || "")
    .replace(/\s*\\tag\{[^{}]*\}\s*$/u, "")
    .trim();
}

export function getHtmlRenderLatex(
  latex: string,
  displayMode: boolean,
  sanitizeLatex: (s: string) => string,
): string {
  const source = displayMode ? stripTrailingDisplayTag(latex) : latex;
  return sanitizeLatex(source);
}

// ---- MathJax CDN loader ----

let mathJaxLoadPromise: Promise<any> | null = null;

export async function ensureMathJaxSvg(): Promise<any> {
  if ((globalThis as any).MathJax?.tex2svgPromise) {
    if ((globalThis as any).MathJax.startup?.promise) {
      await (globalThis as any).MathJax.startup.promise;
    }
    return (globalThis as any).MathJax;
  }

  if (!mathJaxLoadPromise) {
    (globalThis as any).MathJax = {
      startup: { typeset: false },
      svg: { fontCache: "none" },
    };

    mathJaxLoadPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = MATHJAX_CDN_URL;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load MathJax from CDN"));
      document.head.appendChild(script);
    })
      .then(async () => {
        const mj = (globalThis as any).MathJax;
        if (!mj?.startup?.promise) {
          throw new Error("MathJax startup promise missing");
        }
        await mj.startup.promise;
        if (typeof mj.tex2svgPromise !== "function") {
          throw new Error("MathJax tex2svgPromise unavailable");
        }
        return mj;
      })
      .catch((error) => {
        mathJaxLoadPromise = null;
        throw error;
      });
  }

  return mathJaxLoadPromise;
}

// ---- Math request collection ----

function collectMathFromRichTitle(
  titleArray: any[],
  requests: Map<string, { latex: string; displayMode: boolean }>,
): void {
  if (!Array.isArray(titleArray)) return;
  for (const segment of titleArray) {
    if (
      !Array.isArray(segment) ||
      segment[0] !== "⁍" ||
      !Array.isArray(segment[1])
    )
      continue;
    const equationAnnotation = segment[1].find(
      (ann: any) => ann[0] === "e" && ann[1],
    );
    if (equationAnnotation) {
      requests.set(`inline\0${equationAnnotation[1]}`, {
        latex: equationAnnotation[1],
        displayMode: false,
      });
    }
  }
}

export function collectMathRequests(
  blocks: any[],
  getBlockData: (block: any) => any,
): Map<string, { latex: string; displayMode: boolean }> {
  const requests = new Map<string, { latex: string; displayMode: boolean }>();
  for (const block of blocks) {
    const data = getBlockData(block);
    if (data.type === "equation") {
      const latex = data.title?.[0]?.[0];
      if (latex) {
        requests.set(`block\0${latex}`, { latex, displayMode: true });
      }
      continue;
    }

    collectMathFromRichTitle(data.title, requests);

    if (data.type === "table" && data.table_data?.rows) {
      for (const row of data.table_data.rows) {
        for (const cell of row) {
          collectMathFromRichTitle(
            normalizeTableCellRichText(cell),
            requests,
          );
        }
      }
    }
  }
  return requests;
}

// ---- SVG stripping (shared for both PNG rasterization and direct SVG embedding) ----

export function stripSvgMarkup(svgEl: SVGElement): SVGElement {
  const clone = svgEl.cloneNode(true) as SVGElement;
  clone.removeAttribute("aria-hidden");
  clone
    .querySelectorAll("title, desc, metadata")
    .forEach((node) => node.remove());
  clone
    .querySelectorAll("[aria-hidden], [data-mml-node]")
    .forEach((node: Element) => {
      node.removeAttribute("aria-hidden");
      node.removeAttribute("data-mml-node");
    });
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("preserveAspectRatio", "xMidYMid meet");
  return clone;
}
