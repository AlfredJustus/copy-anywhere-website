"use client";

import katex from "katex";
import "katex/dist/katex.min.css";
import type { ReactNode } from "react";
import Image from "next/image";

import { getBlockData, parseRichText } from "@/lib/core/blockFactory";
import type { NotionBlock, RichTextSegment } from "@/lib/core/types";

type Props = {
  blocks: NotionBlock[];
};

function sanitizeLatex(value: string) {
  return String(value || "").replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
}

function renderSegment(segment: RichTextSegment, index: number) {
  const [text, annotations] = segment;
  if (text === "⁍" && annotations) {
    const eq = annotations.find((a) => a[0] === "e");
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
  const link = ann.find((a) => a[0] === "a")?.[1];
  if (ann.some((a) => a[0] === "c")) node = <code className="ob-rt-code">{node}</code>;
  if (ann.some((a) => a[0] === "b")) node = <strong className="ob-rt-bold">{node}</strong>;
  if (ann.some((a) => a[0] === "i")) node = <em className="ob-rt-italic">{node}</em>;
  if (link) {
    node = (
      <a className="ob-inline-link" href={link} target="_blank" rel="noreferrer noopener">
        {node}
      </a>
    );
  }
  return <span key={`txt-${index}`}>{node}</span>;
}

function renderRichText(titleArray: RichTextSegment[]) {
  if (!Array.isArray(titleArray) || titleArray.length === 0) return null;
  return <>{titleArray.map((segment, index) => renderSegment(segment, index))}</>;
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

export function NotionSeshPreview({ blocks }: Props) {
  if (!blocks.length) {
    return <div className="preview-empty">Paste content and click Convert to preview rendered blocks.</div>;
  }

  return (
    <div className="notionsesh-preview">
      {blocks.map((block, index) => {
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
              <span className="ob-num">1.</span>
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
                    {rows[0].map((cell, cellIdx) => (
                      <th key={`h-${cellIdx}`}>{renderRichText(parseRichText(String(cell)))}</th>
                    ))}
                  </tr>
                </thead>
              ) : null}
              <tbody>
                {rows.slice(start).map((row, rowIdx) => (
                  <tr key={`r-${rowIdx}`}>
                    {row.map((cell, cellIdx) => (
                      <td key={`c-${rowIdx}-${cellIdx}`}>{renderRichText(parseRichText(String(cell)))}</td>
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
          return (
            <Image
              key={key}
              className="ob-image"
              src={url}
              alt="Converted content image"
              width={1200}
              height={800}
              unoptimized
            />
          );
        }
        return <p key={key} className="ob-text">{renderRichText(data.title)}</p>;
      })}
    </div>
  );
}
