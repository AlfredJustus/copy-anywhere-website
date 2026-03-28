import { NextResponse } from "next/server";

const SYSTEM_PROMPT = "You are a precise OCR system specialized in mathematical text. Extract the content from the image in markdown.";
let vertexTokenCache: { token: string; expiryMs: number } | null = null;

function b64url(input: Uint8Array) {
  return Buffer.from(input).toString("base64url");
}

function encodeJson(data: object) {
  return b64url(new TextEncoder().encode(JSON.stringify(data)));
}

async function getVertexAccessToken(serviceAccountJson: string): Promise<string> {
  const nowMs = Date.now();
  if (vertexTokenCache && nowMs < vertexTokenCache.expiryMs - 60_000) {
    return vertexTokenCache.token;
  }

  const sa = JSON.parse(serviceAccountJson) as { client_email: string; private_key: string };
  const now = Math.floor(nowMs / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: sa.client_email,
    sub: sa.client_email,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
    scope: "https://www.googleapis.com/auth/cloud-platform",
  };
  const jwtUnsigned = `${encodeJson(header)}.${encodeJson(payload)}`;

  const pem = sa.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  const keyBytes = Buffer.from(pem, "base64");
  const key = await crypto.subtle.importKey(
    "pkcs8",
    keyBytes,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(jwtUnsigned));
  const jwt = `${jwtUnsigned}.${Buffer.from(sig).toString("base64url")}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new Error(`Vertex token error: ${tokenRes.status} ${err}`);
  }
  const tokenData = (await tokenRes.json()) as { access_token: string; expires_in?: number };
  const ttlMs = (tokenData.expires_in ?? 3300) * 1000;
  vertexTokenCache = { token: tokenData.access_token, expiryMs: nowMs + ttlMs };
  return tokenData.access_token;
}

async function callGemini({
  mimeType,
  base64Data,
}: {
  mimeType: string;
  base64Data: string;
}): Promise<{ success: boolean; markdown?: string; error?: string }> {
  const tunedModel = process.env.VERTEX_TUNED_MODEL;
  const location = process.env.VERTEX_LOCATION || "us-central1";
  const serviceAccount = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!tunedModel || !serviceAccount) return { success: false, error: "Gemini secrets missing" };

  try {
    const accessToken = await getVertexAccessToken(serviceAccount);
    const url = `https://${location}-aiplatform.googleapis.com/v1/${tunedModel}:generateContent`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [
          {
            role: "USER",
            parts: [{ inlineData: { mimeType, data: base64Data } }, { text: "Extract markdown from this page." }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 4096,
          temperature: 0.1,
          topK: 32,
          topP: 1,
        },
      }),
    });
    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: `Gemini error ${response.status}: ${text.slice(0, 180)}` };
    }
    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const markdown = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return { success: true, markdown: markdown.includes("[NO_TEXT_DETECTED]") ? "" : markdown };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Gemini call failed" };
  }
}

async function callMathpix({
  image,
  mimeType,
  base64Data,
}: {
  image: string;
  mimeType: string;
  base64Data: string;
}): Promise<{ success: boolean; markdown?: string; error?: string }> {
  const appId = process.env.MATHPIX_NAME;
  const appKey = process.env.MATHPIX_KEY;
  if (!appId || !appKey) return { success: false, error: "Mathpix secrets missing" };

  try {
    const imageSrc = image.startsWith("data:") ? image : `data:${mimeType};base64,${base64Data}`;
    const response = await fetch("https://api.mathpix.com/v3/text", {
      method: "POST",
      headers: {
        app_id: appId,
        app_key: appKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        src: imageSrc,
        formats: ["text"],
        math_inline_delimiters: ["$", "$"],
        math_display_delimiters: ["$$", "$$"],
        rm_spaces: true,
        idiomatic_eqn_arrays: true,
      }),
    });
    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: `Mathpix error ${response.status}: ${text.slice(0, 180)}` };
    }
    const data = (await response.json()) as { text?: string; error?: string };
    if (data.error) return { success: false, error: data.error };
    const markdown = (data.text || "").replace(/(?<!\n)\n(?!\n)/g, "\n\n");
    return { success: true, markdown };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Mathpix call failed" };
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { image?: string };
    if (!body.image) {
      return NextResponse.json({ error: "image is required" }, { status: 400 });
    }

    let base64Data = body.image;
    let mimeType = "image/png";
    const matches = body.image.match(/^data:([^;]+);base64,(.+)$/);
    if (matches) {
      mimeType = matches[1];
      base64Data = matches[2];
    }

    const gemini = await callGemini({ mimeType, base64Data });
    if (gemini.success) {
      return NextResponse.json({ markdown: gemini.markdown || "", provider: "gemini" });
    }
    const mathpix = await callMathpix({ image: body.image, mimeType, base64Data });
    if (mathpix.success) {
      return NextResponse.json({ markdown: mathpix.markdown || "", provider: "mathpix" });
    }

    return NextResponse.json(
      { error: `All OCR providers failed. Gemini: ${gemini.error || "unknown"}; Mathpix: ${mathpix.error || "unknown"}` },
      { status: 500 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
