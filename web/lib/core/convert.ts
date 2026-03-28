import { jsonToNotionBlocks, parseMarkdownToBlocks } from "@/lib/core/blockFactory";
import { parseHtmlToBlocks } from "@/lib/core/htmlParser";
import { blocksToMarkdown, buildNotionPayload } from "@/lib/core/serialize";
import type { NotionBlock } from "@/lib/core/types";

export type InputMode = "auto" | "html" | "markdown";

export type ConversionResult = {
  blocks: NotionBlock[];
  markdown: string;
  notionPayload: string;
};

function detectMode(input: string): Exclude<InputMode, "auto"> {
  const htmlSignals = /<\/?[a-z][\s\S]*>/i.test(input) || /&(nbsp|lt|gt|amp);/i.test(input);
  return htmlSignals ? "html" : "markdown";
}

export function convertToBlocks(input: string, mode: InputMode): ConversionResult {
  const normalized = input.trim();
  if (!normalized) return { blocks: [], markdown: "", notionPayload: buildNotionPayload([]) };

  const resolvedMode = mode === "auto" ? detectMode(normalized) : mode;
  const intermediate =
    resolvedMode === "html" ? parseHtmlToBlocks(normalized) : parseMarkdownToBlocks(normalized);
  const blocks = jsonToNotionBlocks(intermediate);
  const markdown = blocksToMarkdown(blocks);
  const notionPayload = buildNotionPayload(blocks);
  return { blocks, markdown, notionPayload };
}
