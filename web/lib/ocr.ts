export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}

export type Quota = { remainingPdf: number; remainingImage: number };

export async function checkQuota(): Promise<Quota> {
  const resp = await fetch("/api/ocr");
  if (!resp.ok) return { remainingPdf: 0, remainingImage: 0 };
  return resp.json();
}

export async function ocrImage(base64: string, type: "pdf" | "image" = "image", page?: number): Promise<string> {
  const resp = await fetch("/api/ocr", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: base64, type, ...(page != null && { page }) }),
  });

  if (resp.status === 429) {
    const payload = await resp.json();
    throw new RateLimitError(payload.error || "Daily limit reached. Please try again tomorrow.");
  }

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
