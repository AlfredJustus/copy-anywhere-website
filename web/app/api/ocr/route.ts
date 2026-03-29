import { cookies } from "next/headers";
import { checkAndIncrement, getRemaining } from "@/lib/rateLimit";

export const runtime = "nodejs";

const COOKIE_NAME = "device_id";
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year
const MAX_PAYLOAD_SIZE = 10 * 1024 * 1024; // ~10MB base64

export async function GET(): Promise<Response> {
  const cookieStore = await cookies();
  const deviceId = cookieStore.get(COOKIE_NAME)?.value;

  if (!deviceId) {
    return Response.json({ remainingPdf: 2, remainingImage: 5 });
  }

  const remaining = getRemaining(deviceId);
  return Response.json(remaining);
}

export async function POST(request: Request): Promise<Response> {
  const cookieStore = await cookies();
  let deviceId = cookieStore.get(COOKIE_NAME)?.value;
  const isNewDevice = !deviceId;

  if (!deviceId) {
    deviceId = crypto.randomUUID();
  }

  // Parse body
  let body: { image?: string; type?: string; page?: number };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { image, type, page } = body;

  if (!image || typeof image !== "string") {
    return Response.json({ error: "Missing image field" }, { status: 400 });
  }

  if (image.length > MAX_PAYLOAD_SIZE) {
    return Response.json({ error: "Image too large" }, { status: 413 });
  }

  const ocrType = type === "pdf" ? "pdf" : "image";

  // For PDFs: only increment on the first page; subsequent pages pass through
  const isFollowUpPage = ocrType === "pdf" && page && page > 1;
  const result = isFollowUpPage
    ? { allowed: true, ...getRemaining(deviceId) }
    : checkAndIncrement(deviceId, ocrType as "pdf" | "image");

  const rateLimitHeaders: Record<string, string> = {
    "X-RateLimit-Remaining-Pdf": String(result.remainingPdf),
    "X-RateLimit-Remaining-Image": String(result.remainingImage),
  };

  if (!result.allowed) {
    const res = Response.json({ error: result.error }, { status: 429, headers: rateLimitHeaders });
    if (isNewDevice) {
      cookieStore.set(COOKIE_NAME, deviceId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: COOKIE_MAX_AGE,
        path: "/",
      });
    }
    return res;
  }

  // Set cookie for new devices
  if (isNewDevice) {
    cookieStore.set(COOKIE_NAME, deviceId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });
  }

  // Proxy to Supabase
  const supabaseUrl = process.env.SUPABASE_FUNCTION_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return Response.json({ error: "Server misconfigured" }, { status: 500 });
  }

  try {
    const resp = await fetch(supabaseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseKey}`,
        apikey: supabaseKey,
      },
      body: JSON.stringify({ image }),
    });

    const payload = await resp.json();

    if (!resp.ok || payload.error) {
      return Response.json(
        { error: payload.error || "OCR failed." },
        { status: resp.ok ? 500 : resp.status, headers: rateLimitHeaders },
      );
    }

    return Response.json(
      { markdown: payload.markdown || "" },
      { headers: rateLimitHeaders },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "OCR request failed";
    return Response.json({ error: message }, { status: 502, headers: rateLimitHeaders });
  }
}
