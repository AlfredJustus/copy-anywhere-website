export type Annotation = [string, string?];
export type RichTextSegment = [string, Annotation[]?];

export type IntermediateBlock =
  | { type: "header"; content: string; level?: number }
  | { type: "equation"; content: string }
  | { type: "text"; content: string }
  | { type: "bullet"; content: string; indent?: number }
  | { type: "numbered"; content: string; indent?: number }
  | { type: "code"; content: string; language?: string }
  | { type: "quote"; content: string }
  | { type: "divider" }
  | { type: "table"; rows: string[][]; hasHeader?: boolean; columnCount?: number }
  | { type: "image"; content: string; width?: number; height?: number };

export type BlockValue = {
  id: string;
  type: string;
  properties: Record<string, unknown>;
  parent_table: "block";
  alive: boolean;
  indent?: number;
  format?: {
    block_width?: number;
    block_height?: number;
    display_source?: string;
  };
};

export type NotionBlock = {
  blockId: string;
  blockSubtree: {
    __version__: 3;
    block: Record<string, { value: BlockValue }>;
  };
};
