/* eslint-disable @typescript-eslint/no-explicit-any */

const NOTION_API = "https://www.notion.so/api/v3/loadPageChunk";
const MAX_CHUNKS = 10;

export async function POST(request: Request): Promise<Response> {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { pageId } = body;
  if (!pageId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pageId)) {
    return Response.json({ error: "Invalid page ID" }, { status: 400 });
  }

  try {
    // Accumulate all blocks across paginated chunks
    const allBlocks: Record<string, any> = {};
    let chunkNumber = 0;
    let cursor: any = { stack: [[{ table: "block", id: pageId, index: 0 }]] };

    while (chunkNumber < MAX_CHUNKS) {
      const res = await fetch(NOTION_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId,
          limit: 100,
          cursor,
          chunkNumber,
          verticalColumns: false,
        }),
      });

      if (res.status === 404) {
        return Response.json(
          { error: "Page not found. Make sure the page is published to the web." },
          { status: 404 },
        );
      }

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        if (res.status === 401 || res.status === 403 || text.includes("Unauthorized")) {
          return Response.json(
            { error: "This page is not public. Publish it to the web first." },
            { status: 403 },
          );
        }
        return Response.json(
          { error: `Notion API error: ${res.status}` },
          { status: 502 },
        );
      }

      const data = await res.json();
      const blocks = data.recordMap?.block;
      if (blocks) {
        Object.assign(allBlocks, blocks);
      }

      // Check if there are more chunks
      const nextCursor = data.cursor;
      if (!nextCursor || JSON.stringify(nextCursor) === JSON.stringify(cursor)) {
        break;
      }
      cursor = nextCursor;
      chunkNumber++;
    }

    return Response.json({ recordMap: { block: allBlocks } });
  } catch (err: any) {
    return Response.json(
      { error: err.message || "Failed to fetch Notion page" },
      { status: 500 },
    );
  }
}
