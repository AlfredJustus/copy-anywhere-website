import { BlockFactory, getBlockData } from "@/lib/core/blockFactory";
import type { NotionBlock, RichTextSegment } from "@/lib/core/types";

function toRomanNumeral(n: number): string {
  const vals = [10, 9, 5, 4, 1];
  const syms = ["x", "ix", "v", "iv", "i"];
  let r = "";
  let x = n;
  for (let i = 0; i < vals.length; i += 1) {
    while (x >= vals[i]) {
      r += syms[i];
      x -= vals[i];
    }
  }
  return r;
}

function getNumberedMarker(indent: number, counter: number): string {
  if (indent === 0) return `${counter}.`;
  if (indent === 1) return `${String.fromCharCode(96 + (((counter - 1) % 26) + 1))}.`;
  return `${toRomanNumeral(counter)}.`;
}

function cloneRichTextArray(richTextArray: RichTextSegment[]) {
  return Array.isArray(richTextArray)
    ? richTextArray.map((segment) => (Array.isArray(segment) ? structuredClone(segment) : segment))
    : [];
}

function isRichTextArray(value: unknown): value is RichTextSegment[] {
  return Array.isArray(value) && value.every((segment) => Array.isArray(segment));
}

function normalizeTableCellRichText(cell: unknown): RichTextSegment[] {
  if (isRichTextArray(cell)) return cloneRichTextArray(cell);
  if (cell == null) return [];
  if (typeof cell === "string") return [[cell]];
  return [[String(cell)]];
}

function richTextToPlainText(titleArray: RichTextSegment[]): string {
  if (!Array.isArray(titleArray)) return "";
  return titleArray
    .map((segment) => {
      if (!Array.isArray(segment)) return "";
      const [text, annotations] = segment;
      if (text === "⁍" && annotations) {
        const eq = annotations.find((annotation) => annotation[0] === "e");
        if (eq?.[1]) return `$${eq[1]}$`;
      }
      return text || "";
    })
    .join("");
}

function richTextToMarkdown(titleArray: RichTextSegment[]): string {
  if (!Array.isArray(titleArray)) return "";
  const chunks = titleArray
    .map((segment) => {
      if (!Array.isArray(segment)) return "";
      const [text, annotations] = segment;
      if (text === "⁍" && annotations) {
        const eq = annotations.find((annotation) => annotation[0] === "e");
        if (eq?.[1]) return `$${eq[1]}$`;
      }
      let out = text || "";
      const ann = annotations || [];
      const hasCode = ann.some((a) => a[0] === "c");
      const hasBold = ann.some((a) => a[0] === "b");
      const hasItalic = ann.some((a) => a[0] === "i");
      const link = ann.find((a) => a[0] === "a")?.[1];
      if (hasCode) out = `\`${out}\``;
      if (hasBold) out = `**${out}**`;
      if (hasItalic) out = `*${out}*`;
      if (link) out = `[${out}](${link})`;
      return out;
    })
    .filter(Boolean);
  return chunks.join("");
}

function tableCellToPlainText(cell: unknown) {
  return richTextToPlainText(normalizeTableCellRichText(cell));
}

function tableCellToMarkdown(cell: unknown) {
  return richTextToMarkdown(normalizeTableCellRichText(cell));
}

function isMarkdownTableCellEffectivelyEmpty(cell: unknown) {
  return tableCellToMarkdown(cell).trim() === "";
}

export function blocksToMarkdown(blocksArray: NotionBlock[]): string {
  const blocks: string[] = [];
  let numCounters = [0, 0, 0];

  function pushMarkdownBlock(linesOrText: string[] | string) {
    const blockLines = Array.isArray(linesOrText) ? linesOrText : [linesOrText];
    const filtered = blockLines.filter((line) => line != null);
    if (filtered.length === 0) return;
    blocks.push(filtered.join("\n"));
  }

  for (const block of blocksArray) {
    const data = getBlockData(block);
    const md = richTextToMarkdown(data.title);

    switch (data.type) {
      case "header":
        pushMarkdownBlock(`# ${md}`);
        numCounters = [0, 0, 0];
        break;
      case "sub_header":
        pushMarkdownBlock(`## ${md}`);
        numCounters = [0, 0, 0];
        break;
      case "sub_sub_header":
        pushMarkdownBlock(`### ${md}`);
        numCounters = [0, 0, 0];
        break;
      case "bulleted_list": {
        const indent = data.indent || 0;
        pushMarkdownBlock(`${"  ".repeat(indent)}- ${md}`);
        numCounters = [0, 0, 0];
        break;
      }
      case "numbered_list": {
        const indent = data.indent || 0;
        for (let d = indent + 1; d < 3; d += 1) numCounters[d] = 0;
        numCounters[indent] += 1;
        pushMarkdownBlock(`${"  ".repeat(indent)}${getNumberedMarker(indent, numCounters[indent])} ${md}`);
        break;
      }
      case "equation":
        pushMarkdownBlock(["$$", data.title?.[0]?.[0] || "", "$$"]);
        numCounters = [0, 0, 0];
        break;
      case "code":
        pushMarkdownBlock([
          `\`\`\`${data.language !== "plain text" ? data.language : ""}`,
          data.title?.[0]?.[0] || "",
          "```",
        ]);
        numCounters = [0, 0, 0];
        break;
      case "quote":
        pushMarkdownBlock(`> ${md}`);
        numCounters = [0, 0, 0];
        break;
      case "divider":
        pushMarkdownBlock("---");
        numCounters = [0, 0, 0];
        break;
      case "table": {
        const rows = data.table_data?.rows || [];
        const columnCount = data.table_data?.columnCount || 0;
        const hasHeader = data.table_data?.hasHeader !== false && rows.length > 0;
        const effectiveColumnCount = columnCount || Math.max(...rows.map((row) => row.length), 0);
        const normalizedRows = rows.map((row) => {
          const nextRow = row.slice(0, effectiveColumnCount);
          while (nextRow.length < effectiveColumnCount) nextRow.push("");
          return nextRow;
        });
        if (normalizedRows.length > 0 && effectiveColumnCount > 0) {
          let headerRow: unknown[] = [];
          let bodyRows: unknown[][] = normalizedRows;
          if (hasHeader) {
            headerRow = normalizedRows[0];
            bodyRows = normalizedRows.slice(1);
          } else if (normalizedRows[0].every((cell) => isMarkdownTableCellEffectivelyEmpty(cell))) {
            headerRow = normalizedRows[0];
            bodyRows = normalizedRows.slice(1);
          } else {
            headerRow = Array.from({ length: effectiveColumnCount }, () => "");
            bodyRows = normalizedRows;
          }
          const headerCells = headerRow.map((cell) => tableCellToMarkdown(cell));
          const tableLines: string[] = [];
          tableLines.push(`| ${headerCells.join(" | ")} |`);
          tableLines.push(`| ${headerCells.map(() => "---").join(" | ")} |`);
          bodyRows.forEach((row) => {
            tableLines.push(`| ${row.map((cell) => tableCellToMarkdown(cell)).join(" | ")} |`);
          });
          pushMarkdownBlock(tableLines);
        }
        numCounters = [0, 0, 0];
        break;
      }
      case "image": {
        const url = data.source?.[0]?.[0] || data.format?.display_source || "";
        if (url) pushMarkdownBlock(`![](${url})`);
        numCounters = [0, 0, 0];
        break;
      }
      default:
        pushMarkdownBlock(md);
        numCounters = [0, 0, 0];
        break;
    }
  }
  return blocks.join("\n\n");
}

export function blocksToPlainText(blocksArray: NotionBlock[]): string {
  const lines: string[] = [];
  for (const block of blocksArray) {
    const data = getBlockData(block);
    const text = richTextToPlainText(data.title);
    switch (data.type) {
      case "bulleted_list":
        lines.push(`${"  ".repeat(data.indent || 0)}- ${text}`);
        break;
      case "numbered_list":
        lines.push(`${"  ".repeat(data.indent || 0)}1. ${text}`);
        break;
      case "equation":
        lines.push(data.title?.[0]?.[0] ? `$$${data.title[0][0]}$$` : "");
        break;
      case "table":
        (data.table_data?.rows || []).forEach((row) => lines.push(row.map((cell) => tableCellToPlainText(cell)).join("\t")));
        break;
      case "image":
        lines.push(data.source?.[0]?.[0] || "");
        break;
      default:
        lines.push(text);
        break;
    }
  }
  return lines.join("\n");
}

export function buildNotionPayload(blocks: NotionBlock[]) {
  return BlockFactory.buildPayload(blocks);
}
