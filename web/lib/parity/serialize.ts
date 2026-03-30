/* eslint-disable @typescript-eslint/no-explicit-any */
// Verbatim mirror of serialization functions from copy-anywhere-main/content.js
// Exports: getBlockData, blocksToMarkdown, buildNotionPayload

import { generateUUID, parseRichText } from "./blockFactory";

export function getBlockData(block: any) {
  const blockId = block.blockId;
  const blockValue = block.blockSubtree?.block?.[blockId]?.value;
  return {
    type: blockValue?.type || "text",
    title: blockValue?.properties?.title || [],
    language: blockValue?.properties?.language?.[0]?.[0] || "plain text",
    table_data: blockValue?.properties?.table_data || null,
    source: blockValue?.properties?.source || null,
    format: blockValue?.format || null,
    indent: blockValue?.indent || 0
  };
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

function isRichTextArray(value: any): boolean {
  return Array.isArray(value) && value.every((segment: any) => Array.isArray(segment));
}

function cloneRichTextArray(richTextArray: any[]): any[] {
  return Array.isArray(richTextArray)
    ? richTextArray.map(segment => Array.isArray(segment) ? structuredClone(segment) : segment)
    : [];
}

function normalizeTableCellRichText(cell: any): any[] {
  if (isRichTextArray(cell)) return cloneRichTextArray(cell);
  if (cell == null) return [];
  return parseRichText(String(cell));
}

function richTextToMarkdown(titleArray: any[]): string {
  if (!Array.isArray(titleArray)) return "";

  function getSegmentState(segment: any) {
    const [text, annotations] = segment;
    const state: any = { text: text || "", bold: false, italic: false, code: false, link: null, equation: null };
    if (Array.isArray(annotations)) {
      for (const ann of annotations) {
        if (ann[0] === "b") state.bold = true;
        if (ann[0] === "i") state.italic = true;
        if (ann[0] === "c") state.code = true;
        if (ann[0] === "a") state.link = ann[1];
        if (ann[0] === "e") state.equation = ann[1];
      }
    }
    return state;
  }

  function getEffectiveWrap(state: any, states: any[], index: number) {
    if (!state.equation) return { bold: state.bold, italic: state.italic, code: state.code, link: state.link };
    let prev = null;
    for (let i = index - 1; i >= 0; i -= 1) { if (!states[i].equation) { prev = states[i]; break; } }
    let next = null;
    for (let i = index + 1; i < states.length; i += 1) { if (!states[i].equation) { next = states[i]; break; } }
    const bold = (prev?.bold && next?.bold) || (prev?.bold && !next) || (!prev && next?.bold) || false;
    const italic = (prev?.italic && next?.italic) || (prev?.italic && !next) || (!prev && next?.italic) || false;
    return { bold, italic, code: false, link: null };
  }

  function sameWrap(a: any, b: any) {
    return !!a && !!b && a.bold === b.bold && a.italic === b.italic && a.code === b.code && a.link === b.link;
  }

  function wrapMarkdownContent(content: string, wrap: any) {
    let result = content;
    if (wrap.code) result = "`" + result + "`";
    if (wrap.bold) result = "**" + result + "**";
    if (wrap.italic) result = "*" + result + "*";
    if (wrap.link) result = `[${result}](${wrap.link})`;
    return result;
  }

  const rawSegments = titleArray.filter((segment: any) => Array.isArray(segment));
  const states = rawSegments.map(getSegmentState);
  const runs: any[] = [];

  states.forEach((state: any, index: number) => {
    const wrap = getEffectiveWrap(state, states, index);
    const content = state.equation ? `$${state.equation}$` : (state.text || "");
    if (!content) return;
    const lastRun = runs[runs.length - 1];
    if (lastRun && sameWrap(lastRun.wrap, wrap)) { lastRun.content += content; }
    else { runs.push({ wrap, content }); }
  });

  return runs.map((run: any) => wrapMarkdownContent(run.content, run.wrap)).join("");
}

function tableCellToMarkdown(cell: any): string {
  return richTextToMarkdown(normalizeTableCellRichText(cell));
}

function isMarkdownTableCellEffectivelyEmpty(cell: any): boolean {
  return tableCellToMarkdown(cell).trim() === "";
}

export function blocksToMarkdown(blocksArray: any[]): string {
  const mdEntries: { text: string; isList: boolean }[] = [];
  let numCounters = [0, 0, 0];

  function pushMarkdownBlock(linesOrText: string | string[], isList = false) {
    const blockLines = Array.isArray(linesOrText) ? linesOrText : [linesOrText];
    const filtered = blockLines.filter(line => line != null);
    if (filtered.length === 0) return;
    mdEntries.push({ text: filtered.join("\n"), isList });
  }

  for (const block of blocksArray) {
    const data = getBlockData(block);
    const md = richTextToMarkdown(data.title);

    switch (data.type) {
      case "header":
        pushMarkdownBlock("# " + md); numCounters = [0, 0, 0]; break;
      case "sub_header":
        pushMarkdownBlock("## " + md); numCounters = [0, 0, 0]; break;
      case "sub_sub_header":
        pushMarkdownBlock("### " + md); numCounters = [0, 0, 0]; break;
      case "bulleted_list": {
        const indent = data.indent || 0;
        pushMarkdownBlock("  ".repeat(indent) + "- " + md, true);
        numCounters = [0, 0, 0]; break;
      }
      case "numbered_list": {
        const indent = data.indent || 0;
        for (let d = indent + 1; d < 3; d++) numCounters[d] = 0;
        numCounters[indent]++;
        const marker = getNumberedMarker(indent, numCounters[indent]);
        pushMarkdownBlock("  ".repeat(indent) + marker + " " + md, true);
        break;
      }
      case "equation":
        pushMarkdownBlock(["$$", data.title?.[0]?.[0] || "", "$$"]);
        numCounters = [0, 0, 0]; break;
      case "code":
        pushMarkdownBlock(["```" + (data.language !== "plain text" ? data.language : ""), data.title?.[0]?.[0] || "", "```"]);
        numCounters = [0, 0, 0]; break;
      case "quote":
        pushMarkdownBlock("> " + md); numCounters = [0, 0, 0]; break;
      case "divider":
        pushMarkdownBlock("---"); numCounters = [0, 0, 0]; break;
      case "table": {
        const rows = data.table_data?.rows || [];
        const columnCount = data.table_data?.columnCount || 0;
        const hasHeader = data.table_data?.hasHeader !== false && rows.length > 0;
        const effectiveColumnCount = columnCount || Math.max(...rows.map((row: any[]) => row.length), 0);
        const normalizedRows = rows.map((row: any[]) => {
          const nextRow = row.slice(0, effectiveColumnCount);
          while (nextRow.length < effectiveColumnCount) nextRow.push("");
          return nextRow;
        });
        if (normalizedRows.length > 0 && effectiveColumnCount > 0) {
          let headerRow = null;
          let bodyRows = normalizedRows;
          if (hasHeader) { headerRow = normalizedRows[0]; bodyRows = normalizedRows.slice(1); }
          else if (normalizedRows[0].every((cell: any) => isMarkdownTableCellEffectivelyEmpty(cell))) {
            headerRow = normalizedRows[0]; bodyRows = normalizedRows.slice(1);
          } else {
            headerRow = Array.from({ length: effectiveColumnCount }, () => "");
            bodyRows = normalizedRows;
          }
          const headerCells = headerRow.map((cell: any) => tableCellToMarkdown(cell));
          const tableLines: string[] = [];
          tableLines.push("| " + headerCells.join(" | ") + " |");
          tableLines.push("| " + headerCells.map(() => "---").join(" | ") + " |");
          bodyRows.forEach((row: any[]) => {
            tableLines.push("| " + row.map((cell: any) => tableCellToMarkdown(cell)).join(" | ") + " |");
          });
          pushMarkdownBlock(tableLines);
        }
        numCounters = [0, 0, 0]; break;
      }
      case "image": {
        const url = data.source?.[0]?.[0] || data.format?.display_source || "";
        if (url) pushMarkdownBlock("![](" + url + ")");
        numCounters = [0, 0, 0]; break;
      }
      default:
        pushMarkdownBlock(md); numCounters = [0, 0, 0]; break;
    }
  }

  const parts: string[] = [];
  for (let i = 0; i < mdEntries.length; i++) {
    if (i > 0) {
      const prev = mdEntries[i - 1];
      const cur = mdEntries[i];
      parts.push(prev.isList && cur.isList ? "\n" : "\n\n");
    }
    parts.push(mdEntries[i].text);
  }
  return parts.join("");
}

// ==================== Blocks to LaTeX ====================

function escapeLatex(s: string): string {
  return String(s || "")
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/[&%$#_{}]/g, (m) => "\\" + m)
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}")
    .replace(/\|/g, "\\textbar{}")
    .replace(/</g, "\\textless{}")
    .replace(/>/g, "\\textgreater{}")
    .replace(/\p{Emoji_Presentation}+/gu, (m) => `{\\EmojiFont ${m}}`);
}

function richTextToLaTeX(titleArray: any[]): string {
  if (!Array.isArray(titleArray)) return "";

  const parts: string[] = [];
  for (const segment of titleArray) {
    if (!Array.isArray(segment)) continue;
    const [text, annotations] = segment;

    // Inline equation
    if (text === "⁍" && Array.isArray(annotations)) {
      const eq = annotations.find((a: any) => a[0] === "e");
      if (eq) {
        parts.push(`$${eq[1]}$`);
        continue;
      }
    }

    let bold = false;
    let italic = false;
    let code = false;
    let link: string | null = null;

    if (Array.isArray(annotations)) {
      for (const ann of annotations) {
        if (ann[0] === "b") bold = true;
        if (ann[0] === "i") italic = true;
        if (ann[0] === "c") code = true;
        if (ann[0] === "a") link = ann[1];
      }
    }

    let content = code ? String(text || "") : escapeLatex(text);

    if (code) content = `\\inlinecode{${escapeLatex(text)}}`;
    if (bold) content = `\\textbf{${content}}`;
    if (italic) content = `\\textit{${content}}`;
    if (link) content = `\\href{${String(link).replace(/[%#]/g, (m) => "\\" + m)}}{${content}}`;

    parts.push(content);
  }

  return parts.join("");
}

function tableCellToLaTeX(cell: any): string {
  return richTextToLaTeX(normalizeTableCellRichText(cell));
}

const LATEX_PREAMBLE = `\\documentclass[11pt,a4paper]{article}
\\usepackage{fontspec}
\\usepackage{amsmath}
\\usepackage{unicode-math}
\\setmainfont{Latin Modern Roman}
\\setmathfont{Latin Modern Math}
\\newfontface{\\EmojiFont}{TwemojiMozilla}
\\usepackage{listings}
\\usepackage{hyperref}
\\usepackage{csquotes}
\\usepackage{graphicx}
\\usepackage{geometry}
\\usepackage{enumitem}
\\usepackage{xcolor}
\\geometry{margin=1in}
\\lstset{basicstyle=\\ttfamily\\small,breaklines=true,frame=single,backgroundcolor=\\color[gray]{0.97},xleftmargin=0.5em,xrightmargin=0.5em}
\\newcommand{\\inlinecode}[1]{{\\ttfamily\\colorbox{gray!12}{#1}}}
\\setlength{\\parindent}{0pt}
\\setlength{\\parskip}{0.5em}
\\hypersetup{colorlinks=true,linkcolor=blue,urlcolor=blue}
\\begin{document}
`;

export function blocksToLaTeX(blocksArray: any[]): string {
  const lines: string[] = [LATEX_PREAMBLE];

  // Track list state for grouping consecutive list items
  let currentListType: string | null = null; // "bulleted_list" | "numbered_list" | null
  let currentListIndent = 0;
  let openListDepth = 0; // how many nested list envs are open

  function closeAllLists() {
    for (let i = openListDepth - 1; i >= 0; i--) {
      lines.push(currentListType === "numbered_list" ? "\\end{enumerate}" : "\\end{itemize}");
    }
    openListDepth = 0;
    currentListType = null;
    currentListIndent = 0;
  }

  function openListToDepth(type: string, indent: number) {
    const env = type === "numbered_list" ? "enumerate" : "itemize";
    // If switching list type, close all and restart
    if (currentListType && currentListType !== type) {
      closeAllLists();
    }
    const targetDepth = indent + 1;
    // Open new environments as needed
    while (openListDepth < targetDepth) {
      lines.push(`\\begin{${env}}`);
      openListDepth++;
    }
    // Close environments if going shallower
    while (openListDepth > targetDepth) {
      lines.push(`\\end{${env}}`);
      openListDepth--;
    }
    currentListType = type;
    currentListIndent = indent;
  }

  for (const block of blocksArray) {
    const data = getBlockData(block);

    // If not a list block, close any open lists
    if (data.type !== "bulleted_list" && data.type !== "numbered_list") {
      if (currentListType) closeAllLists();
    }

    const tex = richTextToLaTeX(data.title);

    switch (data.type) {
      case "header":
        lines.push(`\\section*{${tex}}`);
        break;
      case "sub_header":
        lines.push(`\\subsection*{${tex}}`);
        break;
      case "sub_sub_header":
        lines.push(`\\subsubsection*{${tex}}`);
        break;

      case "bulleted_list":
      case "numbered_list": {
        const indent = Math.min(data.indent || 0, 2);
        openListToDepth(data.type, indent);
        lines.push(`\\item ${tex}`);
        break;
      }

      case "equation": {
        const latex = data.title?.[0]?.[0] || "";
        if (latex) {
          lines.push("\\begin{equation*}");
          lines.push(latex);
          lines.push("\\end{equation*}");
        }
        break;
      }

      case "code": {
        const code = data.title?.[0]?.[0] || "";
        lines.push("\\begin{lstlisting}");
        lines.push(code);
        lines.push("\\end{lstlisting}");
        break;
      }

      case "quote":
        lines.push("\\begin{displayquote}");
        lines.push(tex);
        lines.push("\\end{displayquote}");
        break;

      case "divider":
        lines.push("\\vspace{0.5em}\\noindent\\rule{\\textwidth}{0.4pt}\\vspace{0.5em}");
        break;

      case "table": {
        const rows = data.table_data?.rows || [];
        const columnCount = data.table_data?.columnCount || rows[0]?.length || 0;
        const hasHeader = data.table_data?.hasHeader !== false;
        if (rows.length > 0 && columnCount > 0) {
          const colSpec = Array(columnCount).fill("l").join(" | ");
          lines.push(`\\begin{tabular}{| ${colSpec} |}`);
          lines.push("\\hline");
          const startIdx = hasHeader ? 1 : 0;
          if (hasHeader && rows[0]) {
            const cells = rows[0].map((cell: any) => `\\textbf{${tableCellToLaTeX(cell)}}`);
            lines.push(cells.join(" & ") + " \\\\");
            lines.push("\\hline");
          }
          for (let r = startIdx; r < rows.length; r++) {
            const cells = rows[r].map((cell: any) => tableCellToLaTeX(cell));
            lines.push(cells.join(" & ") + " \\\\");
            lines.push("\\hline");
          }
          lines.push("\\end{tabular}");
        }
        break;
      }

      case "image":
        // Images from URLs can't be included in pdflatex — skip with note
        break;

      default:
        if (tex) lines.push(tex + "\n");
        break;
    }
  }

  // Close any remaining open lists
  if (currentListType) closeAllLists();

  lines.push("\\end{document}");
  return lines.join("\n");
}

// ==================== Build Notion Payload ====================

function buildNotionTableBlock(block: any): any {
  const blockId = block.blockId;
  const tableData = block.blockSubtree.block[blockId].value.properties.table_data;
  if (!tableData) return block;
  const { rows, hasHeader, columnCount } = tableData;
  const colIds: string[] = [];
  for (let c = 0; c < columnCount; c++) colIds.push(generateUUID());
  const rowIds = rows.map(() => generateUUID());

  const blockMap: any = {};
  blockMap[blockId] = {
    value: {
      id: blockId, type: "table", properties: {},
      format: {
        table_block_column_order: colIds,
        table_block_column_format: Object.fromEntries(colIds.map((cid: string) => [cid, { width: 200 }])),
        table_block_column_header: !!hasHeader
      },
      content: rowIds, parent_table: "block", alive: true
    }
  };

  for (let r = 0; r < rows.length; r++) {
    const rowProps: any = {};
    for (let c = 0; c < columnCount; c++) {
      const cellRichText = normalizeTableCellRichText(rows[r]?.[c]);
      rowProps[colIds[c]] = cellRichText.length > 0 ? cellRichText : [[""]];
    }
    blockMap[rowIds[r]] = {
      value: {
        id: rowIds[r], type: "table_row", properties: rowProps,
        parent_id: blockId, parent_table: "block", alive: true
      }
    };
  }
  return { blockId, blockSubtree: { __version__: 3, block: blockMap } };
}

function cloneBlockForPayload(block: any): any {
  try { return structuredClone(block); } catch { return JSON.parse(JSON.stringify(block)); }
}

function getRootBlockValue(block: any): any {
  const blockId = block?.blockId;
  if (!blockId) return null;
  return block?.blockSubtree?.block?.[blockId]?.value || null;
}

function normalizeListHierarchyForClipboard(blocksArray: any[]): any[] {
  const listTypes = new Set(["bulleted_list", "numbered_list"]);

  for (const block of blocksArray) {
    const value = getRootBlockValue(block);
    if (!value || !listTypes.has(value.type)) continue;
    delete value.parent_id;
    delete value.content;
  }

  const parentStack: any[] = [];
  const embeddedIds = new Set();

  for (const block of blocksArray) {
    const value = getRootBlockValue(block);
    if (!value || !listTypes.has(value.type)) { parentStack.length = 0; continue; }

    const rawIndent = Number(value.indent);
    const depth = Number.isFinite(rawIndent) ? Math.max(0, Math.floor(rawIndent)) : 0;

    if (depth > 0 && parentStack[depth - 1]) {
      const parent = parentStack[depth - 1];
      const parentValue = parent.value;
      value.parent_id = parentValue.id;
      delete value.indent;
      if (!Array.isArray(parentValue.content)) parentValue.content = [];
      parentValue.content.push(value.id);
      const root = parentStack[0];
      const rootBlockMap = root.block.blockSubtree.block;
      const childBlockMap = block.blockSubtree.block;
      for (const [id, record] of Object.entries(childBlockMap)) {
        rootBlockMap[id] = record;
      }
      embeddedIds.add(block.blockId);
    } else if (depth > 0) {
      delete value.indent;
    }

    parentStack[depth] = { block, value };
    parentStack.length = depth + 1;
  }

  return blocksArray.filter((b: any) => !embeddedIds.has(b.blockId));
}

export function buildNotionPayload(blocksArray: any[]): string {
  const cleanBlocks = blocksArray.map((block: any) => {
    const cloned = cloneBlockForPayload(block);
    delete cloned._meta;
    delete cloned._editMode;
    const blockValue = getRootBlockValue(cloned);
    if (blockValue?.type === "table" && blockValue?.properties?.table_data) {
      return buildNotionTableBlock(cloned);
    }
    return cloned;
  });
  const normalizedBlocks = normalizeListHierarchyForClipboard(cleanBlocks);
  return JSON.stringify({
    blocks: normalizedBlocks,
    action: "copy",
    wasContiguousSelection: true
  });
}
