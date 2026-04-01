export const runtime = "nodejs";

const SUPABASE_URL = "https://cghzhnznfqjasjtimslq.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const { rating, comment, blocksJson, sourceHtml, inputSource, pageUrl } = body;

    if (rating !== "up" && rating !== "down") {
      return Response.json({ error: "Invalid rating" }, { status: 400 });
    }

    const row: Record<string, unknown> = {
      rating,
      page_url: pageUrl || null,
      user_agent: request.headers.get("user-agent") || null,
    };

    // Only store content data on negative feedback
    if (rating === "down") {
      row.comment = comment || null;
      row.blocks_json = blocksJson || null;
      row.source_html = sourceHtml || null;
      row.input_source = inputSource || null;
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/web_feedback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify(row),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[feedback] Supabase insert failed:", text);
      return Response.json({ error: "Failed to save feedback" }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error("[feedback] Error:", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
