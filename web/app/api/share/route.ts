export const runtime = "nodejs";

const SUPABASE_URL = "https://cghzhnznfqjasjtimslq.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;

const MAX_PAYLOAD_SIZE = 512 * 1024; // 512KB

function nanoid(length = 10): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const { blocksJson, title, inputSource } = body;

    if (!blocksJson || !Array.isArray(blocksJson) || blocksJson.length === 0) {
      return Response.json({ error: "No blocks provided" }, { status: 400 });
    }

    const payloadSize = JSON.stringify(blocksJson).length;
    if (payloadSize > MAX_PAYLOAD_SIZE) {
      return Response.json({ error: "Content too large to share" }, { status: 413 });
    }

    const id = nanoid();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const row = {
      id,
      expires_at: expiresAt,
      title: title || null,
      blocks_json: blocksJson,
      input_source: inputSource || null,
    };

    const res = await fetch(`${SUPABASE_URL}/rest/v1/web_shares`, {
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
      console.error("[share] Supabase insert failed:", text);
      return Response.json({ error: "Failed to create share" }, { status: 500 });
    }

    return Response.json({ id, expiresAt });
  } catch (err) {
    console.error("[share] Error:", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
