import { SUPABASE_FUNCTION_URL, SUPABASE_ANON_KEY } from "@/lib/config/supabase";

export async function ocrImage(base64: string): Promise<string> {
  const resp = await fetch(SUPABASE_FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ image: base64 }),
  });
  const payload = await resp.json();
  if (!resp.ok || payload.error) {
    throw new Error(payload.error || "OCR failed.");
  }
  return payload.markdown || "";
}

export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
}
