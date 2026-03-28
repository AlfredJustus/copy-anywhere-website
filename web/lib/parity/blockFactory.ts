/* eslint-disable @typescript-eslint/no-explicit-any */
// Verbatim mirror of copy-anywhere-main/utils/blockFactory.js
// Adapter: removed globalThis.NF dependency (inline fallbacks used)

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const cleanLatexMatrix = (s: string) => s;

function parseInlineMath(text: string, annotation: string | null = null): any[] {
  if (!text) return [];
  const mathRegex = /(\$[^$]+\$)/g;
  const parts = text.split(mathRegex);
  return parts.map(part => {
    if (!part) return null;
    if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
      const mathContent = part.slice(1, -1);
      return { type: 'equation', content: ["⁍", [["e", mathContent]]] };
    }
    if (annotation) {
      return { type: 'text', content: [part, [[annotation]]] };
    }
    return { type: 'text', content: [part] };
  }).filter(Boolean);
}

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

function parseUrlsInText(text: string): any[] {
  if (!text) return [[text]];
  const segments: any[] = [];
  let lastIndex = 0;
  let m;
  const re = new RegExp(URL_REGEX.source, 'g');
  while ((m = re.exec(text)) !== null) {
    if (m.index > lastIndex) {
      const plain = text.slice(lastIndex, m.index);
      if (plain) segments.push([plain]);
    }
    const url = m[0].replace(/[.,;:!?)]+$/, '');
    segments.push([url, [['a', url]]]);
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < text.length) {
    const tail = text.slice(lastIndex);
    if (tail) segments.push([tail]);
  }
  return segments.length ? segments : [[text]];
}

export function parseRichText(text: string): any[] {
  if (!text) return [];
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, inner) => '$' + inner + '$');
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, inner) => '$' + inner.trim() + '$');

  const regex = /(\$[^$]+\$|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  const parts = text.split(regex);

  const parsed: any[] = parts.map(part => {
    if (!part) return null;
    if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
      const mathContent = part.slice(1, -1);
      return [{ type: 'equation', content: ["⁍", [["e", mathContent]]] }];
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      const boldContent = part.slice(2, -2);
      return parseInlineMath(boldContent, 'b');
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2 && !part.startsWith('**')) {
      const italicContent = part.slice(1, -1);
      return parseInlineMath(italicContent, 'i');
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      const codeContent = part.slice(1, -1);
      return [{ type: 'text', content: [codeContent, [["c"]]] }];
    }
    const urlSegments = parseUrlsInText(part);
    return urlSegments.map((seg: any) => ({ type: 'text', content: seg }));
  }).filter(Boolean).flat();

  const result: any[] = [];
  for (let i = 0; i < parsed.length; i++) {
    const current = parsed[i];
    const prev = parsed[i - 1];
    const next = parsed[i + 1];

    if (current.type === 'equation') {
      if (prev && prev.type === 'text') {
        const prevText = prev.content[0];
        if (prevText && !/\s$/.test(prevText)) result.push([" "]);
      }
      result.push(current.content);
      if (next && next.type === 'text') {
        const nextText = next.content[0];
        if (nextText && !/^[\s.,;:!?)]/.test(nextText)) result.push([" "]);
      }
    } else {
      result.push(current.content);
    }
  }

  return result;
}

function createBaseBlock(type: string, properties: any = {}, indent = 0) {
  const id = generateUUID();
  const value: any = { id, type, properties, parent_table: "block", alive: true };
  if (indent > 0) value.indent = indent;
  return {
    blockId: id,
    blockSubtree: { __version__: 3 as const, block: { [id]: { value } } }
  };
}

export const BlockFactory = {
  math: (latex: string) => createBaseBlock("equation", { title: [[cleanLatexMatrix(latex)]] }),

  text: (content: string, annotations: any[] = []) => {
    if (annotations.length > 0) {
      return createBaseBlock("text", { title: [[content, annotations]] });
    }
    return createBaseBlock("text", { title: parseRichText(content) });
  },

  textFromRichText: (richTextArray: any[]) => createBaseBlock("text", { title: richTextArray }),
  bulletFromRichText: (richTextArray: any[], indent = 0) => createBaseBlock("bulleted_list", { title: richTextArray }, indent),
  numberedFromRichText: (richTextArray: any[], indent = 0) => createBaseBlock("numbered_list", { title: richTextArray }, indent),

  header: (content: string, level = 1) => {
    const typeMap: Record<number, string> = { 1: "header", 2: "sub_header", 3: "sub_sub_header" };
    return createBaseBlock(typeMap[level] || "header", { title: parseRichText(content) });
  },

  bullet: (content: string, annotations: any[] = [], indent = 0) => {
    if (annotations.length > 0) {
      return createBaseBlock("bulleted_list", { title: [[content, annotations]] }, indent);
    }
    return createBaseBlock("bulleted_list", { title: parseRichText(content) }, indent);
  },

  numbered: (content: string, annotations: any[] = [], indent = 0) => {
    if (annotations.length > 0) {
      return createBaseBlock("numbered_list", { title: [[content, annotations]] }, indent);
    }
    return createBaseBlock("numbered_list", { title: parseRichText(content) }, indent);
  },

  code: (content: string, language = "plain text") => createBaseBlock("code", {
    title: [[content]],
    language: [[language]]
  }),

  quote: (content: string) => createBaseBlock("quote", { title: parseRichText(content) }),
  divider: () => createBaseBlock("divider", {}),

  table: (rows: any[], hasHeader = true, columnCount = 0) => {
    const cols = columnCount || (rows[0]?.length || 0);
    return createBaseBlock("table", {
      title: [['']],
      table_data: { rows, hasHeader, columnCount: cols }
    });
  },

  image: (url: string, width?: number, height?: number) => {
    const block = createBaseBlock("image", {
      source: [[url]],
      title: [["screenshot"]]
    });
    const id = block.blockId;
    (block.blockSubtree.block[id].value as any).format = {
      block_width: width || 600,
      block_height: height || undefined,
      display_source: url
    };
    return block;
  },

  buildPayload: (blocks: any[]) => JSON.stringify({
    blocks,
    action: "copy",
    wasContiguousSelection: true
  }),
};

export function parseMarkdownTableLines(tableLines: string[]): any {
  if (!tableLines || tableLines.length === 0) return null;

  function parseCells(line: string) {
    return line.split('|').slice(1, -1).map(cell => cell.trim());
  }

  const separatorRegex = /^\|[\s\-:]+(\|[\s\-:]+)*\|?\s*$/;
  const hasHeader = tableLines.length >= 2 && separatorRegex.test(tableLines[1]);
  const dataLines = hasHeader ? [tableLines[0], ...tableLines.slice(2)] : tableLines;
  const rows = dataLines.filter(l => l.trim() !== '').map(parseCells);
  if (rows.length === 0) return null;
  const columnCount = Math.max(...rows.map(r => r.length));
  const normalizedRows = rows.map(row => {
    while (row.length < columnCount) row.push('');
    return row;
  });
  return { rows: normalizedRows, hasHeader, columnCount };
}

export function parseMarkdownToBlocks(md: string): any[] {
  if (!md || typeof md !== 'string') return [];
  const lines = md.split(/\r?\n/);
  const blocks: any[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed === '') { i++; continue; }

    const hMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (hMatch) {
      blocks.push({ type: 'header', content: hMatch[2].trim(), level: Math.min(hMatch[1].length, 3) });
      i++; continue;
    }

    if (/^```\s*\w*\s*$/.test(trimmed)) {
      const langMatch = trimmed.match(/^```\s*(\w*)\s*$/);
      const lang = (langMatch && langMatch[1]) ? langMatch[1] : 'plain text';
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i].trim())) { codeLines.push(lines[i]); i++; }
      if (i < lines.length) i++;
      blocks.push({ type: 'code', content: codeLines.join('\n'), language: lang });
      continue;
    }

    if (trimmed === '$$') {
      const mathLines: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== '$$') { mathLines.push(lines[i]); i++; }
      if (i < lines.length) i++;
      blocks.push({ type: 'equation', content: mathLines.join('\n').trim() });
      continue;
    }
    const oneLineMath = trimmed.match(/^\$\$(.*)\$\$\s*$/);
    if (oneLineMath) {
      blocks.push({ type: 'equation', content: oneLineMath[1].trim() });
      i++; continue;
    }
    if (trimmed.startsWith('$$')) {
      const mathLines: string[] = [];
      if (trimmed.length > 2) mathLines.push(trimmed.slice(2));
      i++;
      while (i < lines.length) {
        const t = lines[i].trim();
        if (t === '$$') { i++; break; }
        if (/\$\$\s*$/.test(t)) {
          const endMatch = t.match(/^(.*)\$\$\s*$/);
          if (endMatch) mathLines.push(endMatch[1]);
          i++; break;
        }
        mathLines.push(lines[i]); i++;
      }
      blocks.push({ type: 'equation', content: mathLines.join('\n').trim() });
      continue;
    }

    if (/^(-{3,}|\*{3,})\s*$/.test(trimmed)) {
      blocks.push({ type: 'divider' }); i++; continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const leadingSpaces = (line.match(/^(\s*)/) || ['', ''])[1].length;
      const indent = Math.min(Math.floor(leadingSpaces / 2), 2);
      blocks.push({ type: 'bullet', content: trimmed.replace(/^[-*]\s+/, ''), indent });
      i++; continue;
    }

    if (/^\d+\.\s+/.test(trimmed) || /^[a-z][.)]\s+/.test(trimmed) || /^[ivxlcdm]+[.)]\s+/.test(trimmed)) {
      const leadingSpaces = (line.match(/^(\s*)/) || ['', ''])[1].length;
      const indent = Math.min(Math.floor(leadingSpaces / 2), 2);
      blocks.push({ type: 'numbered', content: trimmed.replace(/^(\d+[.)]\s+|[a-z][.)]\s+|[ivxlcdm]+[.)]\s+)/, ''), indent });
      i++; continue;
    }

    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trimStart().startsWith('>')) {
        quoteLines.push(lines[i].replace(/^>\s?/, '').trim()); i++;
      }
      blocks.push({ type: 'quote', content: quoteLines.join(' ') });
      continue;
    }

    if (/^\|.+\|/.test(trimmed)) {
      const tableLines: string[] = [];
      while (i < lines.length && /^\|.+\|/.test(lines[i].trim())) { tableLines.push(lines[i].trim()); i++; }
      const parsed = parseMarkdownTableLines(tableLines);
      if (parsed) {
        blocks.push({ type: 'table', rows: parsed.rows, hasHeader: parsed.hasHeader, columnCount: parsed.columnCount });
      } else {
        blocks.push({ type: 'text', content: tableLines.join(' ') });
      }
      continue;
    }

    const paraLines: string[] = [];
    while (i < lines.length) {
      const l = lines[i];
      if (l.trim() === '') break;
      const t = l.trim();
      if (/^#{1,6}\s/.test(t) || /^```\s*\w*\s*$/.test(t) || t === '$$' || /^\$\$/.test(t) ||
          /^[-*]\s+/.test(t) || /^\d+\.\s+/.test(t) || /^[a-z][.)]\s+/.test(t) || /^[ivxlcdm]+[.)]\s+/.test(t) ||
          t.startsWith('>') || /^(-{3,}|\*{3,})\s*$/.test(t) || /^\|.+\|/.test(t)) {
        break;
      }
      paraLines.push(l); i++;
    }
    const content = paraLines.join(' ').trim();
    if (content) blocks.push({ type: 'text', content });
  }
  return blocks;
}

export function jsonToNotionBlocks(jsonArray: any[]): any[] {
  const blocks: any[] = [];
  for (const item of jsonArray) {
    if (item._pendingMathML) {
      blocks.push(BlockFactory.text(item.fallbackText || '[Math]'));
      continue;
    }
    switch (item.type) {
      case 'header': case 'heading':
        blocks.push(BlockFactory.header(item.content, item.level || 1)); break;
      case 'equation': case 'math':
        if (item.mathml) { blocks.push(BlockFactory.text(item.content || '[Math]')); }
        else { blocks.push(BlockFactory.math(item.content)); }
        break;
      case 'text': case 'paragraph':
        blocks.push(BlockFactory.text(item.content)); break;
      case 'bullet': case 'bulleted_list':
        blocks.push(BlockFactory.bullet(item.content, [], item.indent || 0)); break;
      case 'numbered': case 'numbered_list':
        blocks.push(BlockFactory.numbered(item.content, [], item.indent || 0)); break;
      case 'code':
        blocks.push(BlockFactory.code(item.content, item.language || 'plain text')); break;
      case 'quote':
        blocks.push(BlockFactory.quote(item.content)); break;
      case 'divider':
        blocks.push(BlockFactory.divider()); break;
      case 'table':
        blocks.push(BlockFactory.table(item.rows || [], item.hasHeader !== false, item.columnCount || 0)); break;
      case 'image':
        blocks.push(BlockFactory.image(item.url || item.content, item.width, item.height)); break;
      default:
        if (item.content) blocks.push(BlockFactory.text(item.content));
    }
  }
  return blocks;
}
