/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Utilities for importing public Notion pages.
 *
 * extractNotionPageId  – parse a Notion URL into a UUID
 * recordMapToBlocks    – convert a loadPageChunk recordMap into internal Block[]
 */

// ---------------------------------------------------------------------------
// URL parsing
// ---------------------------------------------------------------------------

/** Extract a 32-hex-char page ID from a Notion URL and format it as a UUID. */
export function extractNotionPageId(url: string): string | null {
  try {
    const u = new URL(url.trim());
    if (!u.hostname.endsWith("notion.so") && !u.hostname.endsWith("notion.site")) {
      return null;
    }
    // The page ID is the last 32 hex characters in the path (may include dashes)
    const path = u.pathname.replace(/-/g, "");
    const match = path.match(/([0-9a-f]{32})$/i);
    if (!match) return null;
    const hex = match[1];
    // Format as UUID: 8-4-4-4-12
    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20, 32),
    ].join("-");
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Block types we handle natively
// ---------------------------------------------------------------------------

const SUPPORTED_TYPES = new Set([
  "text",
  "header",
  "sub_header",
  "sub_sub_header",
  "bulleted_list",
  "numbered_list",
  "code",
  "equation",
  "quote",
  "divider",
  "table",
  "image",
]);

// Types that carry rich-text we can surface as a text block
const TEXT_FALLBACK_TYPES = new Set([
  "callout",
  "toggle",
  "to_do",
  "bookmark",
  "synced_block",
  "column_list",
  "column",
]);

// ---------------------------------------------------------------------------
// recordMap → Block[]
// ---------------------------------------------------------------------------

/**
 * Convert the `recordMap.block` object returned by Notion's loadPageChunk API
 * into the internal Block[] array used by the app.
 *
 * The Notion API blocks already use the same value shape (type, properties,
 * indent, etc.) so conversion is mostly just wrapping.
 */
export function recordMapToBlocks(
  recordMap: { block: Record<string, { value: any }> },
  pageId: string,
): any[] {
  const blockMap = recordMap.block;
  if (!blockMap) return [];

  // Get the page block to find ordered child IDs
  const pageBlock = blockMap[pageId]?.value;
  if (!pageBlock) return [];

  const contentIds: string[] = pageBlock.content || [];
  const blocks: any[] = [];

  for (const id of contentIds) {
    const entry = blockMap[id];
    if (!entry?.value || !entry.value.alive) continue;
    const value = entry.value;

    // Recursively collect nested list items and toggle children
    collectBlock(value, blockMap, blocks, 0);
  }

  return blocks;
}

function collectBlock(
  value: any,
  blockMap: Record<string, { value: any }>,
  out: any[],
  depth: number,
) {
  const type = value.type;

  if (type === "table") {
    // Tables need special handling: collect table_row children
    out.push(buildTableBlock(value, blockMap));
    return;
  }

  if (SUPPORTED_TYPES.has(type)) {
    const block = wrapValue(value, depth);
    out.push(block);

    // If this is a list item with children, recurse for nested items
    if (
      (type === "bulleted_list" || type === "numbered_list") &&
      value.content?.length
    ) {
      for (const childId of value.content) {
        const child = blockMap[childId]?.value;
        if (child?.alive) collectBlock(child, blockMap, out, depth + 1);
      }
    }
    return;
  }

  // Unsupported type — try to extract text content as fallback
  if (TEXT_FALLBACK_TYPES.has(type) || value.properties?.title) {
    const fallback = { ...value, type: "text" };
    out.push(wrapValue(fallback, 0));

    // Recurse into children for toggles, columns, etc.
    if (value.content?.length) {
      for (const childId of value.content) {
        const child = blockMap[childId]?.value;
        if (child?.alive) collectBlock(child, blockMap, out, depth);
      }
    }
    return;
  }

  // For column_list / column, just recurse into children
  if (value.content?.length) {
    for (const childId of value.content) {
      const child = blockMap[childId]?.value;
      if (child?.alive) collectBlock(child, blockMap, out, depth);
    }
  }
}

function wrapValue(value: any, depth: number): any {
  const id = value.id;
  const cleaned: any = {
    id,
    type: value.type,
    properties: value.properties || {},
    parent_table: "block",
    alive: true,
  };

  // Apply indent for list items
  if (
    (value.type === "bulleted_list" || value.type === "numbered_list") &&
    depth > 0
  ) {
    cleaned.indent = Math.min(depth, 2);
  } else if (value.indent != null) {
    cleaned.indent = value.indent;
  }

  // Preserve format for images
  if (value.format) {
    cleaned.format = value.format;
  }

  return {
    blockId: id,
    blockSubtree: {
      __version__: 3 as const,
      block: { [id]: { value: cleaned } },
    },
  };
}

function buildTableBlock(
  tableValue: any,
  blockMap: Record<string, { value: any }>,
): any {
  const id = tableValue.id;
  const rowIds: string[] = tableValue.content || [];
  const format = tableValue.format || {};
  const columnCount =
    format.table_block_column_order?.length ||
    format.table_block_columns?.length ||
    0;
  const hasHeader = !!format.table_block_column_header;

  const rows: any[][] = [];
  for (const rowId of rowIds) {
    const rowBlock = blockMap[rowId]?.value;
    if (!rowBlock || rowBlock.type !== "table_row") continue;
    const props = rowBlock.properties || {};
    const row: any[] = [];
    // Table row properties are keyed by column ID
    const colOrder = format.table_block_column_order || Object.keys(props);
    for (const colId of colOrder) {
      row.push(props[colId] || [[""]]);
    }
    rows.push(row);
  }

  const cleaned: any = {
    id,
    type: "table",
    properties: {
      title: [[""]],
      table_data: {
        rows,
        hasHeader,
        columnCount: columnCount || (rows[0]?.length || 0),
      },
    },
    parent_table: "block",
    alive: true,
  };

  return {
    blockId: id,
    blockSubtree: {
      __version__: 3 as const,
      block: { [id]: { value: cleaned } },
    },
  };
}
