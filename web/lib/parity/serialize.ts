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
  const mdBlocks: string[] = [];
  let numCounters = [0, 0, 0];

  function pushMarkdownBlock(linesOrText: string | string[]) {
    const blockLines = Array.isArray(linesOrText) ? linesOrText : [linesOrText];
    const filtered = blockLines.filter(line => line != null);
    if (filtered.length === 0) return;
    mdBlocks.push(filtered.join("\n"));
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
        pushMarkdownBlock("  ".repeat(indent) + "- " + md);
        numCounters = [0, 0, 0]; break;
      }
      case "numbered_list": {
        const indent = data.indent || 0;
        for (let d = indent + 1; d < 3; d++) numCounters[d] = 0;
        numCounters[indent]++;
        const marker = getNumberedMarker(indent, numCounters[indent]);
        pushMarkdownBlock("  ".repeat(indent) + marker + " " + md);
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
  return mdBlocks.join("\n\n");
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
