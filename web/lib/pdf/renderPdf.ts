/* eslint-disable @typescript-eslint/no-explicit-any */
import { blocksToLaTeX } from "@/lib/parity/serialize";

export type PdfProgress = "preparing" | "generating";

export async function renderPdfBlob(
  blocks: any[],
  onProgress?: (step: PdfProgress) => void,
): Promise<Blob> {
  onProgress?.("preparing");
  const latex = blocksToLaTeX(blocks);

  onProgress?.("generating");
  const res = await fetch("/api/compile-pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ latex }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`LaTeX compilation failed:\n${errorText}`);
  }

  return await res.blob();
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
