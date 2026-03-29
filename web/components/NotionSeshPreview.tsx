"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import katex from "katex";
import "katex/dist/katex.min.css";
import type { ReactNode } from "react";

import { getBlockData } from "@/lib/parity/serialize";
import { parseRichText } from "@/lib/parity/blockFactory";

type Props = { blocks: any[] };

function sanitizeLatex(value: string) {
  return String(value || "").replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
}

function renderSegment(segment: any, index: number) {
  const [text, annotations] = segment;
  if (text === "⁍" && annotations) {
    const eq = annotations.find((a: any) => a[0] === "e");
    const latex = sanitizeLatex(eq?.[1] || "");
    if (!latex) return null;
    let html = "";
    try {
      html = katex.renderToString(latex, { displayMode: false, throwOnError: false, trust: true });
    } catch {
      html = `$${latex}$`;
    }
    return <span key={`eq-${index}`} className="ob-inline-math" dangerouslySetInnerHTML={{ __html: html }} />;
  }

  let node: ReactNode = text || "";
  const ann = annotations || [];
  const link = ann.find((a: any) => a[0] === "a")?.[1];
  if (ann.some((a: any) => a[0] === "c")) node = <code className="ob-rt-code">{node}</code>;
  if (ann.some((a: any) => a[0] === "b")) node = <strong className="ob-rt-bold">{node}</strong>;
  if (ann.some((a: any) => a[0] === "i")) node = <em className="ob-rt-italic">{node}</em>;
  if (link) {
    node = <a className="ob-inline-link" href={link} target="_blank" rel="noreferrer noopener">{node}</a>;
  }
  return <span key={`txt-${index}`}>{node}</span>;
}

function renderRichText(titleArray: any[]) {
  if (!Array.isArray(titleArray) || titleArray.length === 0) return null;
  return <>{titleArray.map((segment: any, index: number) => renderSegment(segment, index))}</>;
}

function renderTableCell(cell: any): ReactNode {
  if (Array.isArray(cell) && cell.length > 0 && Array.isArray(cell[0])) {
    return renderRichText(cell);
  }
  return renderRichText(parseRichText(String(cell)));
}

function renderBlockEquation(latexRaw: string) {
  const latex = sanitizeLatex(latexRaw);
  if (!latex) return <span className="equation-placeholder">Add a TeX equation</span>;
  try {
    const html = katex.renderToString(latex, { displayMode: true, throwOnError: false, trust: true });
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  } catch {
    return <pre>{latex}</pre>;
  }
}

function toRomanNumeral(n: number): string {
  const vals = [10, 9, 5, 4, 1];
  const syms = ["x", "ix", "v", "iv", "i"];
  let r = "";
  for (let i = 0; i < vals.length; i++) {
    while (n >= vals[i]) { r += syms[i]; n -= vals[i]; }
  }
  return r;
}

function getNumberedMarker(indent: number, counter: number): string {
  if (indent === 0) return `${counter}.`;
  if (indent === 1) return `${String.fromCharCode(96 + ((counter - 1) % 26 + 1))}.`;
  return `${toRomanNumeral(counter)}.`;
}

function computeNumberedMarkers(blocks: any[]): Map<number, string> {
  const markers = new Map<number, string>();
  const counters = [0, 0, 0];
  for (let i = 0; i < blocks.length; i++) {
    const data = getBlockData(blocks[i]);
    if (data.type === "numbered_list") {
      const indent = Math.min(data.indent || 0, 2);
      for (let d = indent + 1; d < 3; d++) counters[d] = 0;
      counters[indent]++;
      markers.set(i, getNumberedMarker(indent, counters[indent]));
    } else {
      counters[0] = 0; counters[1] = 0; counters[2] = 0;
    }
  }
  return markers;
}

export function NotionSeshPreview({ blocks }: Props) {
  if (!blocks.length) {
    return <div className="preview-empty">Paste content to see rendered blocks.</div>;
  }

  const numberedMarkers = computeNumberedMarkers(blocks);

  return (
    <div className="notionsesh-preview">
      {blocks.map((block: any, index: number) => {
        const data = getBlockData(block);
        const key = `${block.blockId}-${index}`;

        if (data.type === "header") return <h1 key={key} className="ob-h1">{renderRichText(data.title)}</h1>;
        if (data.type === "sub_header") return <h2 key={key} className="ob-h2">{renderRichText(data.title)}</h2>;
        if (data.type === "sub_sub_header") return <h3 key={key} className="ob-h3">{renderRichText(data.title)}</h3>;
        if (data.type === "bulleted_list") {
          return (
            <div key={key} className="ob-bullet" data-indent={data.indent || 0}>
              <span className="ob-bullet-dot" />
              <span>{renderRichText(data.title)}</span>
            </div>
          );
        }
        if (data.type === "numbered_list") {
          return (
            <div key={key} className="ob-numbered" data-indent={data.indent || 0}>
              <span className="ob-num">{numberedMarkers.get(index) ?? "1."}</span>
              <span>{renderRichText(data.title)}</span>
            </div>
          );
        }
        if (data.type === "code") return <pre key={key} className="ob-code-block">{data.title?.[0]?.[0] || ""}</pre>;
        if (data.type === "quote") return <blockquote key={key} className="ob-quote-block">{renderRichText(data.title)}</blockquote>;
        if (data.type === "divider") return <hr key={key} className="ob-divider" />;
        if (data.type === "equation") return <div key={key} className="ob-equation-block">{renderBlockEquation(data.title?.[0]?.[0] || "")}</div>;
        if (data.type === "table") {
          const rows = data.table_data?.rows || [];
          if (!rows.length) return null;
          const hasHeader = data.table_data?.hasHeader !== false;
          const start = hasHeader ? 1 : 0;
          return (
            <table key={key} className="ob-table">
              {hasHeader && rows[0] ? (
                <thead>
                  <tr>
                    {rows[0].map((cell: any, cellIdx: number) => (
                      <th key={`h-${cellIdx}`}>{renderTableCell(cell)}</th>
                    ))}
                  </tr>
                </thead>
              ) : null}
              <tbody>
                {rows.slice(start).map((row: any[], rowIdx: number) => (
                  <tr key={`r-${rowIdx}`}>
                    {row.map((cell: any, cellIdx: number) => (
                      <td key={`c-${rowIdx}-${cellIdx}`}>{renderTableCell(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          );
        }
        if (data.type === "image") {
          const url = data.source?.[0]?.[0];
          if (!url) return null;
          return <img key={key} className="ob-image" src={url} alt="Converted content" />;
        }
        return <p key={key} className="ob-text">{renderRichText(data.title)}</p>;
      })}
    </div>
  );
}
