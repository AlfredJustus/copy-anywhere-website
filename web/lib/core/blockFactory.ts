import type { BlockValue, IntermediateBlock, NotionBlock, RichTextSegment } from "@/lib/core/types";

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function parseInlineMath(text: string, annotation: string | null = null) {
  if (!text) return [];
  const mathRegex = /(\$[^$]+\$)/g;
  const parts = text.split(mathRegex);

  return parts
    .map((part) => {
      if (!part) return null;
      if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
        const mathContent = part.slice(1, -1);
        return { type: "equation", content: ["⁍", [["e", mathContent]]] as RichTextSegment };
      }
      if (annotation) return { type: "text", content: [part, [[annotation]]] as RichTextSegment };
      return { type: "text", content: [part] as RichTextSegment };
    })
    .filter(Boolean);
}

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

function parseUrlsInText(text: string): RichTextSegment[] {
  if (!text) return [[text]];
  const segments: RichTextSegment[] = [];
  let lastIndex = 0;
  const re = new RegExp(URL_REGEX.source, "g");
  let m: RegExpExecArray | null;

  while ((m = re.exec(text)) !== null) {
    if (m.index > lastIndex) {
      const plain = text.slice(lastIndex, m.index);
      if (plain) segments.push([plain]);
    }
    const url = m[0].replace(/[.,;:!?)]+$/, "");
    segments.push([url, [["a", url]]]);
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < text.length) {
    const tail = text.slice(lastIndex);
    if (tail) segments.push([tail]);
  }
  return segments.length ? segments : [[text]];
}

export function parseRichText(text: string): RichTextSegment[] {
  if (!text) return [];
  const normalized = text
    .replace(/\$\$([\s\S]*?)\$\$/g, (_, inner) => `$${inner}$`)
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, inner) => `$${inner.trim()}$`);

  const regex = /(\$[^$]+\$|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  const parts = normalized.split(regex);

  const parsed = parts
    .map((part) => {
      if (!part) return null;
      if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
        const mathContent = part.slice(1, -1);
        return [{ type: "equation", content: ["⁍", [["e", mathContent]]] as RichTextSegment }];
      }
      if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
        return parseInlineMath(part.slice(2, -2), "b");
      }
      if (part.startsWith("*") && part.endsWith("*") && part.length > 2 && !part.startsWith("**")) {
        return parseInlineMath(part.slice(1, -1), "i");
      }
      if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
        return [{ type: "text", content: [part.slice(1, -1), [["c"]]] as RichTextSegment }];
      }
      return parseUrlsInText(part).map((seg) => ({ type: "text", content: seg }));
    })
    .filter(Boolean)
    .flat() as Array<{ type: string; content: RichTextSegment }>;

  const result: RichTextSegment[] = [];
  for (let i = 0; i < parsed.length; i += 1) {
    const current = parsed[i];
    const prev = parsed[i - 1];
    const next = parsed[i + 1];
    if (current.type === "equation") {
      if (prev && prev.type === "text") {
        const prevText = prev.content[0];
        if (prevText && !/\s$/.test(prevText)) result.push([" "]);
      }
      result.push(current.content);
      if (next && next.type === "text") {
        const nextText = next.content[0];
        if (nextText && !/^[\s.,;:!?)]/.test(nextText)) result.push([" "]);
      }
    } else {
      result.push(current.content);
    }
  }
  return result;
}

function createBaseBlock(type: string, properties: Record<string, unknown> = {}, indent = 0): NotionBlock {
  const id = generateUUID();
  const value: BlockValue = {
    id,
    type,
    properties,
    parent_table: "block" as const,
    alive: true,
  };
  if (indent > 0) value.indent = indent;

  return {
    blockId: id,
    blockSubtree: {
      __version__: 3,
      block: {
        [id]: { value },
      },
    },
  };
}

export const BlockFactory = {
  math: (latex: string) => createBaseBlock("equation", { title: [[latex]] }),
  text: (content: string, annotations: string[][] = []) => {
    if (annotations.length > 0) return createBaseBlock("text", { title: [[content, annotations]] });
    return createBaseBlock("text", { title: parseRichText(content) });
  },
  textFromRichText: (richTextArray: RichTextSegment[]) => createBaseBlock("text", { title: richTextArray }),
  bullet: (content: string, annotations: string[][] = [], indent = 0) => {
    if (annotations.length > 0) return createBaseBlock("bulleted_list", { title: [[content, annotations]] }, indent);
    return createBaseBlock("bulleted_list", { title: parseRichText(content) }, indent);
  },
  numbered: (content: string, annotations: string[][] = [], indent = 0) => {
    if (annotations.length > 0) return createBaseBlock("numbered_list", { title: [[content, annotations]] }, indent);
    return createBaseBlock("numbered_list", { title: parseRichText(content) }, indent);
  },
  header: (content: string, level = 1) => {
    const typeMap: Record<number, string> = { 1: "header", 2: "sub_header", 3: "sub_sub_header" };
    return createBaseBlock(typeMap[level] || "header", { title: parseRichText(content) });
  },
  code: (content: string, language = "plain text") =>
    createBaseBlock("code", { title: [[content]], language: [[language]] }),
  quote: (content: string) => createBaseBlock("quote", { title: parseRichText(content) }),
  divider: () => createBaseBlock("divider", {}),
  table: (rows: string[][], hasHeader = true, columnCount = 0) => {
    const cols = columnCount || rows[0]?.length || 0;
    return createBaseBlock("table", {
      title: [[""]],
      table_data: { rows, hasHeader, columnCount: cols },
    });
  },
  image: (url: string, width?: number, height?: number) => {
    const block = createBaseBlock("image", { source: [[url]], title: [["image"]] });
    const id = block.blockId;
    block.blockSubtree.block[id].value.format = {
      block_width: width || 600,
      block_height: height,
      display_source: url,
    };
    return block;
  },
  buildPayload: (blocks: NotionBlock[]) =>
    JSON.stringify({
      blocks,
      action: "copy",
      wasContiguousSelection: true,
    }),
};

export function parseMarkdownTableLines(tableLines: string[]) {
  if (!tableLines || tableLines.length === 0) return null;

  function parseCells(line: string) {
    return line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());
  }

  const separatorRegex = /^\|[\s\-:]+(\|[\s\-:]+)*\|?\s*$/;
  const hasHeader = tableLines.length >= 2 && separatorRegex.test(tableLines[1]);
  const dataLines = hasHeader ? [tableLines[0], ...tableLines.slice(2)] : tableLines;

  const rows = dataLines.filter((l) => l.trim() !== "").map(parseCells);
  if (rows.length === 0) return null;
  const columnCount = Math.max(...rows.map((r) => r.length));
  const normalizedRows = rows.map((row) => {
    while (row.length < columnCount) row.push("");
    return row;
  });
  return { rows: normalizedRows, hasHeader, columnCount };
}

export function parseMarkdownToBlocks(md: string): IntermediateBlock[] {
  if (!md || typeof md !== "string") return [];
  const lines = md.split(/\r?\n/);
  const blocks: IntermediateBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed === "") {
      i += 1;
      continue;
    }
    const hMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (hMatch) {
      blocks.push({ type: "header", content: hMatch[2].trim(), level: Math.min(hMatch[1].length, 3) });
      i += 1;
      continue;
    }
    if (/^```\s*\w*\s*$/.test(trimmed)) {
      const langMatch = trimmed.match(/^```\s*(\w*)\s*$/);
      const lang = langMatch?.[1] || "plain text";
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !/^```\s*$/.test(lines[i].trim())) {
        codeLines.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) i += 1;
      blocks.push({ type: "code", content: codeLines.join("\n"), language: lang });
      continue;
    }
    if (trimmed === "$$") {
      const mathLines: string[] = [];
      i += 1;
      while (i < lines.length && lines[i].trim() !== "$$") {
        mathLines.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) i += 1;
      blocks.push({ type: "equation", content: mathLines.join("\n").trim() });
      continue;
    }
    const oneLineMath = trimmed.match(/^\$\$(.*)\$\$\s*$/);
    if (oneLineMath) {
      blocks.push({ type: "equation", content: oneLineMath[1].trim() });
      i += 1;
      continue;
    }
    if (/^(-{3,}|\*{3,})\s*$/.test(trimmed)) {
      blocks.push({ type: "divider" });
      i += 1;
      continue;
    }
    if (/^[-*]\s+/.test(trimmed)) {
      const leadingSpaces = line.match(/^(\s*)/)?.[1].length ?? 0;
      const indent = Math.min(Math.floor(leadingSpaces / 2), 2);
      blocks.push({ type: "bullet", content: trimmed.replace(/^[-*]\s+/, ""), indent });
      i += 1;
      continue;
    }
    if (/^\d+\.\s+/.test(trimmed) || /^[a-z][.)]\s+/.test(trimmed) || /^[ivxlcdm]+[.)]\s+/i.test(trimmed)) {
      const leadingSpaces = line.match(/^(\s*)/)?.[1].length ?? 0;
      const indent = Math.min(Math.floor(leadingSpaces / 2), 2);
      blocks.push({
        type: "numbered",
        content: trimmed.replace(/^(\d+[.)]\s+|[a-z][.)]\s+|[ivxlcdm]+[.)]\s+)/i, ""),
        indent,
      });
      i += 1;
      continue;
    }
    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trimStart().startsWith(">")) {
        quoteLines.push(lines[i].replace(/^>\s?/, "").trim());
        i += 1;
      }
      blocks.push({ type: "quote", content: quoteLines.join(" ") });
      continue;
    }
    if (/^\|.+\|/.test(trimmed)) {
      const tableLines: string[] = [];
      while (i < lines.length && /^\|.+\|/.test(lines[i].trim())) {
        tableLines.push(lines[i].trim());
        i += 1;
      }
      const parsed = parseMarkdownTableLines(tableLines);
      if (parsed) blocks.push({ type: "table", rows: parsed.rows, hasHeader: parsed.hasHeader, columnCount: parsed.columnCount });
      continue;
    }
    const paraLines: string[] = [];
    while (i < lines.length) {
      const l = lines[i];
      if (l.trim() === "") break;
      const t = l.trim();
      if (
        /^#{1,6}\s/.test(t) ||
        /^```\s*\w*\s*$/.test(t) ||
        t === "$$" ||
        /^\$\$/.test(t) ||
        /^[-*]\s+/.test(t) ||
        /^\d+\.\s+/.test(t) ||
        /^[a-z][.)]\s+/.test(t) ||
        /^[ivxlcdm]+[.)]\s+/i.test(t) ||
        t.startsWith(">") ||
        /^(-{3,}|\*{3,})\s*$/.test(t) ||
        /^\|.+\|/.test(t)
      ) {
        break;
      }
      paraLines.push(l);
      i += 1;
    }
    const content = paraLines.join(" ").trim();
    if (content) blocks.push({ type: "text", content });
  }

  return blocks;
}

export function jsonToNotionBlocks(jsonArray: IntermediateBlock[]): NotionBlock[] {
  const blocks: NotionBlock[] = [];
  for (const item of jsonArray) {
    switch (item.type) {
      case "header":
        blocks.push(BlockFactory.header(item.content, item.level || 1));
        break;
      case "equation":
        blocks.push(BlockFactory.math(item.content));
        break;
      case "text":
        blocks.push(BlockFactory.text(item.content));
        break;
      case "bullet":
        blocks.push(BlockFactory.bullet(item.content, [], item.indent || 0));
        break;
      case "numbered":
        blocks.push(BlockFactory.numbered(item.content, [], item.indent || 0));
        break;
      case "code":
        blocks.push(BlockFactory.code(item.content, item.language || "plain text"));
        break;
      case "quote":
        blocks.push(BlockFactory.quote(item.content));
        break;
      case "divider":
        blocks.push(BlockFactory.divider());
        break;
      case "table":
        blocks.push(BlockFactory.table(item.rows || [], item.hasHeader !== false, item.columnCount || 0));
        break;
      case "image":
        blocks.push(BlockFactory.image(item.content, item.width, item.height));
        break;
      default:
        break;
    }
  }
  return blocks;
}

export function getBlockData(block: NotionBlock) {
  const value = block.blockSubtree?.block?.[block.blockId]?.value;
  return {
    type: value?.type || "text",
    indent: value?.indent || 0,
    title: (value?.properties?.title as RichTextSegment[]) || [],
    language: (value?.properties?.language as string[][])?.[0]?.[0] || "plain text",
    table_data: value?.properties?.table_data as
      | { rows: string[][]; hasHeader?: boolean; columnCount?: number }
      | undefined,
    source: value?.properties?.source as string[][] | undefined,
    format: value?.format as { display_source?: string } | undefined,
  };
}
