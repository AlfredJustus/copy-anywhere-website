export const runtime = "nodejs";

const TEXLIVE_URL = "https://texlive.net/cgi-bin/latexcgi";
const MAX_LATEX_SIZE = 512 * 1024; // 512KB

export async function POST(request: Request): Promise<Response> {
  let body: { latex?: string };
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const latex = body.latex;
  if (!latex || typeof latex !== "string") {
    return new Response("Missing latex field", { status: 400 });
  }

  if (latex.length > MAX_LATEX_SIZE) {
    return new Response("LaTeX source too large", { status: 413 });
  }

  const formData = new FormData();
  formData.append("filecontents[]", latex);
  formData.append("filename[]", "document.tex");
  formData.append("engine", "pdflatex");
  formData.append("return", "pdf");

  const res = await fetch(TEXLIVE_URL, {
    method: "POST",
    body: formData,
    redirect: "follow",
  });

  if (!res.ok) {
    console.error("[compile-pdf] texlive.net returned", res.status);
    return new Response(
      "PDF generation failed. The compilation service returned an error. Please try again.",
      { status: res.status },
    );
  }

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("pdf")) {
    const rawLog = await res.text();
    console.error("[compile-pdf] LaTeX compilation failed:", rawLog.slice(0, 2000));
    // Extract a useful hint from the TeX log if possible
    const unicodeMatch = rawLog.match(/Unicode character (.+?) \(U\+([0-9A-F]+)\) not set up/);
    const hint = unicodeMatch
      ? `The character ${unicodeMatch[1]} is not supported in PDF export.`
      : "Some content could not be rendered in PDF format.";
    return new Response(
      `PDF generation failed: ${hint} Please remove unsupported characters and try again.`,
      { status: 422 },
    );
  }

  const pdfBuffer = await res.arrayBuffer();

  return new Response(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
    },
  });
}
