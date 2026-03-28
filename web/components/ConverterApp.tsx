"use client";

import { useMemo, useState } from "react";

import { NotionSeshPreview } from "@/components/NotionSeshPreview";
import { convertToBlocks, type InputMode } from "@/lib/core/convert";

type Props = {
  modelLabel: string;
  defaultOutput: "markdown" | "notion";
};

async function copyText(value: string) {
  await navigator.clipboard.writeText(value);
}

async function copyNotionMime(payload: string) {
  const blob = new Blob([payload], { type: "text/_notion-blocks-v3-production" });
  const item = new ClipboardItem({
    "text/_notion-blocks-v3-production": blob,
    "text/plain": new Blob([payload], { type: "text/plain" }),
  });
  await navigator.clipboard.write([item]);
}

export function ConverterApp({ modelLabel, defaultOutput }: Props) {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<InputMode>("auto");
  const [outputType, setOutputType] = useState<"markdown" | "notion">(defaultOutput);
  const [status, setStatus] = useState("");

  const result = useMemo(() => convertToBlocks(input, mode), [input, mode]);
  const outputValue = outputType === "markdown" ? result.markdown : result.notionPayload;

  return (
    <section className="converter-shell">
      <div className="converter-grid">
        <article className="card">
          <h2>Input</h2>
          <p className="muted">Paste copied content from {modelLabel}. Auto mode detects HTML vs markdown.</p>
          <div className="control-row">
            <label>
              Input mode
              <select value={mode} onChange={(e) => setMode(e.target.value as InputMode)}>
                <option value="auto">Auto detect</option>
                <option value="html">Clipboard HTML</option>
                <option value="markdown">Markdown</option>
              </select>
            </label>
            <label>
              Output
              <select value={outputType} onChange={(e) => setOutputType(e.target.value as "markdown" | "notion")}>
                <option value="markdown">Markdown</option>
                <option value="notion">Notion blocks JSON</option>
              </select>
            </label>
          </div>
          <textarea
            className="input-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste content here..."
          />
        </article>

        <article className="card">
          <h2>Converted output</h2>
          <p className="muted">
            Generated from shared parser logic and ready for copy.
          </p>
          <textarea className="output-textarea" readOnly value={outputValue} />
          <div className="button-row">
            <button
              className="btn"
              onClick={async () => {
                try {
                  if (outputType === "notion") {
                    await copyNotionMime(result.notionPayload);
                  } else {
                    await copyText(result.markdown);
                  }
                  setStatus("Copied to clipboard.");
                } catch {
                  setStatus("Copy failed in this browser. Try regular copy from the output box.");
                }
              }}
            >
              {outputType === "notion" ? "Copy to Notion MIME" : "Copy markdown"}
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => {
                setInput("");
                setStatus("");
              }}
            >
              Clear
            </button>
          </div>
          {status ? <p className="status-note">{status}</p> : null}
        </article>
      </div>

      <article className="card preview-card">
        <h2>Rendered preview (NotionSesh display style)</h2>
        <p className="muted">
          Every conversion is rendered with a NotionSesh-inspired block renderer, including KaTeX equations.
        </p>
        <NotionSeshPreview blocks={result.blocks} />
      </article>
    </section>
  );
}
