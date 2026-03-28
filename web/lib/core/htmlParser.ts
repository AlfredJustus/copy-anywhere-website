import type { Annotation, IntermediateBlock, RichTextSegment } from "@/lib/core/types";

function addAnnotation(annotations: Annotation[], annotation?: Annotation) {
  const next: Annotation[] = annotations.map((item) => [item[0], item[1]] as Annotation);
  if (!annotation) return next;
  const exists = next.some((item) => item[0] === annotation[0] && item[1] === annotation[1]);
  if (!exists) next.push([annotation[0], annotation[1]] as Annotation);
  return next;
}

function pushTextSegments(buffer: RichTextSegment[], text: string, annotations: Annotation[] = []) {
  if (!text) return;
  const normalizedText = text.replace(/\s+/g, " ");
  if (!normalizedText) return;
  const parts = normalizedText.split(/(\$[^$]+\$)/g);
  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
      buffer.push(["⁍", [["e", part.slice(1, -1)]]]);
      continue;
    }
    if (!part.trim() && part !== " ") continue;
    buffer.push(annotations.length > 0 ? [part, annotations] : [part]);
  }
}

function parseInlineRichText(node: Node): RichTextSegment[] {
  const buffer: RichTextSegment[] = [];

  function walk(n: Node, inheritedAnnotations: Annotation[] = []) {
    if (n.nodeType === Node.TEXT_NODE) {
      pushTextSegments(buffer, n.textContent || "", inheritedAnnotations);
      return;
    }
    if (!(n instanceof HTMLElement)) return;
    const tag = n.tagName.toLowerCase();

    if (tag === "br") {
      buffer.push([" "]);
      return;
    }

    if (tag === "code") {
      const ann = addAnnotation(inheritedAnnotations, ["c"]);
      pushTextSegments(buffer, n.textContent || "", ann);
      return;
    }

    let nextAnnotations = inheritedAnnotations;
    if (tag === "b" || tag === "strong") nextAnnotations = addAnnotation(nextAnnotations, ["b"]);
    if (tag === "i" || tag === "em") nextAnnotations = addAnnotation(nextAnnotations, ["i"]);
    if (tag === "u" || tag === "ins") nextAnnotations = addAnnotation(nextAnnotations, ["u"]);
    if (tag === "a") {
      const href = n.getAttribute("href");
      if (href) nextAnnotations = addAnnotation(nextAnnotations, ["a", href]);
    }

    const dataLatex = n.getAttribute("data-latex");
    if (dataLatex) {
      buffer.push(["⁍", [["e", dataLatex]]]);
      return;
    }

    if (n.classList.contains("katex-display")) {
      const latex = n.getAttribute("data-latex") || n.textContent || "";
      if (latex.trim()) buffer.push(["⁍", [["e", latex.trim()]]]);
      return;
    }

    for (const child of n.childNodes) walk(child, nextAnnotations);
  }

  walk(node);
  return buffer;
}

function richToPlain(rich: RichTextSegment[]) {
  return rich
    .map((seg) => {
      if (seg[0] === "⁍") {
        const eq = seg[1]?.find((a) => a[0] === "e");
        return eq?.[1] ? `$${eq[1]}$` : "";
      }
      return seg[0] || "";
    })
    .join("")
    .trim();
}

function parseList(listEl: HTMLElement, ordered: boolean, depth: number, out: IntermediateBlock[]) {
  const items = Array.from(listEl.children).filter((n): n is HTMLElement => n instanceof HTMLElement && n.tagName === "LI");
  for (const li of items) {
    const inlineClone = li.cloneNode(true) as HTMLElement;
    inlineClone.querySelectorAll("ul,ol").forEach((n) => n.remove());
    const content = richToPlain(parseInlineRichText(inlineClone));
    out.push({
      type: ordered ? "numbered" : "bullet",
      content,
      indent: Math.min(depth, 2),
    });

    const nested = Array.from(li.children).filter(
      (n): n is HTMLElement => n instanceof HTMLElement && (n.tagName === "UL" || n.tagName === "OL"),
    );
    for (const child of nested) parseList(child, child.tagName === "OL", depth + 1, out);
  }
}

export function parseHtmlToBlocks(html: string): IntermediateBlock[] {
  if (!html.trim()) return [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const blocks: IntermediateBlock[] = [];

  const pushParagraph = (el: HTMLElement) => {
    const rich = parseInlineRichText(el);
    const content = richToPlain(rich);
    if (!content) return;
    blocks.push({ type: "text", content });
  };

  for (const node of Array.from(doc.body.children).filter((n): n is HTMLElement => n instanceof HTMLElement)) {
    const tag = node.tagName.toLowerCase();

    if (tag === "h1" || tag === "h2" || tag === "h3") {
      blocks.push({
        type: "header",
        content: richToPlain(parseInlineRichText(node)),
        level: tag === "h1" ? 1 : tag === "h2" ? 2 : 3,
      });
      continue;
    }
    if (tag === "ul" || tag === "ol") {
      parseList(node, tag === "ol", 0, blocks);
      continue;
    }
    if (tag === "pre") {
      const code = node.querySelector("code");
      const languageClass = code?.className.match(/language-([a-z0-9_-]+)/i)?.[1];
      blocks.push({
        type: "code",
        content: code?.textContent || node.textContent || "",
        language: languageClass || "plain text",
      });
      continue;
    }
    if (tag === "blockquote") {
      blocks.push({ type: "quote", content: richToPlain(parseInlineRichText(node)) });
      continue;
    }
    if (tag === "hr") {
      blocks.push({ type: "divider" });
      continue;
    }
    if (tag === "table") {
      const rows: string[][] = [];
      const trNodes = node.querySelectorAll("tr");
      trNodes.forEach((tr) => {
        const cells = Array.from(tr.querySelectorAll("th,td")).map((cell) => richToPlain(parseInlineRichText(cell)));
        rows.push(cells);
      });
      if (rows.length > 0) {
        const hasHeader = !!node.querySelector("thead");
        blocks.push({ type: "table", rows, hasHeader, columnCount: Math.max(...rows.map((r) => r.length)) });
      }
      continue;
    }
    if (tag === "img") {
      const src = node.getAttribute("src");
      if (src) blocks.push({ type: "image", content: src });
      continue;
    }
    if (tag === "p" || tag === "div" || tag === "section" || tag === "article") {
      const blockLatex = node.getAttribute("data-block-latex");
      if (blockLatex) {
        blocks.push({ type: "equation", content: blockLatex });
      } else {
        pushParagraph(node);
      }
      continue;
    }
    pushParagraph(node);
  }

  return blocks;
}
