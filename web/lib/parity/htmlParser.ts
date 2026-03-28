/* eslint-disable @typescript-eslint/no-explicit-any */
// Verbatim mirror of parseHtmlToBlocks from copy-anywhere-main/content.js (lines 1226-1810)
// Adapter: replaced globalThis.NF.* with inline browser-safe implementations

import { generateUUID } from "./blockFactory";

// ==================== Inline NF Utilities ====================

const MATH_ELEMENT_SELECTORS = [
  ".katex", ".MathJax", "mjx-container", "math",
  ".math-inline", "[data-math]", "[data-latex]",
  ".cam-inline-math", ".MathJax_Display", ".katex-display"
].join(", ");

function isMathElement(node: Element): boolean {
  if (!node || node.nodeType !== Node.ELEMENT_NODE) return false;
  try { return node.matches(MATH_ELEMENT_SELECTORS); } catch { return false; }
}

function extractLatexFromMathElement(node: Element): { latex?: string; mathml?: string } {
  const dataLatex = node.getAttribute("data-latex") || node.getAttribute("data-math");
  if (dataLatex) return { latex: dataLatex };
  const annotation = node.querySelector("annotation[encoding='application/x-tex']");
  if (annotation?.textContent) return { latex: annotation.textContent };
  const script = node.querySelector("script[type='math/tex'], script[type='math/tex; mode=display']");
  if (script?.textContent) return { latex: script.textContent };
  if (node.tagName?.toLowerCase() === "math") return { mathml: node.outerHTML };
  const alt = node.getAttribute("alt") || node.getAttribute("title");
  if (alt) return { latex: alt };
  return {};
}

function sanitizeLatex(text: string): string {
  return String(text || "").replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
}

function resolveLatex(extracted: { latex?: string; mathml?: string }): string | null {
  if (!extracted) return null;
  if (extracted.latex) { const c = sanitizeLatex(extracted.latex); return c || null; }
  return null;
}

function getMathDisplayMode(node: Element): "inline" | "block" {
  if (node.classList?.contains("katex-display")) return "block";
  if (node.classList?.contains("MathJax_Display")) return "block";
  if (node.tagName === "MJX-CONTAINER") {
    const d = node.getAttribute("display");
    if (d === "true" || d === "block") return "block";
  }
  const parent = node.parentElement;
  if (parent?.classList?.contains("katex-display") || parent?.classList?.contains("MathJax_Display")) return "block";
  return "inline";
}

function isHeavyMath(latex: string): boolean {
  return /\\begin\{(align|aligned|gather|gathered|equation|cases|bmatrix|pmatrix|vmatrix|matrix|array|split|multline|eqnarray)/i.test(latex);
}

const cleanLatexMatrix = (s: string) => s;
const unwrapMathJax = (s: string) => s;

// ==================== Clipboard Helpers ====================

const CLIPBOARD_SEMANTIC_BLOCK_SELECTOR = "p, h1, h2, h3, h4, h5, h6, ul, ol, blockquote, table, pre";
const CLIPBOARD_VISUALLY_HIDDEN_SELECTOR = [".cdk-visually-hidden", ".visually-hidden", ".sr-only", "[hidden]"].join(", ");

function hasDescendantSemanticClipboardBlocks(node: Element): boolean {
  return !!node?.querySelector?.(CLIPBOARD_SEMANTIC_BLOCK_SELECTOR);
}

function isVisuallyHiddenClipboardElement(node: Element): boolean {
  if (node?.nodeType !== Node.ELEMENT_NODE) return false;
  try { if (node.matches(CLIPBOARD_VISUALLY_HIDDEN_SELECTOR)) return true; } catch { /* noop */ }
  const styleAttr = (node.getAttribute("style") || "").toLowerCase();
  return /display\s*:\s*none/.test(styleAttr) || /visibility\s*:\s*hidden/.test(styleAttr);
}

// ==================== Main Parser ====================

export function parseHtmlToBlocks(html: string): any[] | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    (function normalizeClipboardHtml(body: HTMLElement) {
      const BLOCK_TAGS = new Set([
        "address", "article", "aside", "blockquote", "details", "dialog", "dd", "div",
        "dl", "dt", "fieldset", "figcaption", "figure", "footer", "form", "h1", "h2",
        "h3", "h4", "h5", "h6", "header", "hgroup", "hr", "li", "main", "nav", "ol",
        "p", "pre", "section", "table", "ul", "summary"
      ]);

      function wrapRuns(container: Element, matchFn: (el: Element) => boolean, createWrapper: (d: Document) => Element) {
        let run: Node[] = [];
        const flush = () => {
          if (run.length === 0) return;
          const wrapper = createWrapper(container.ownerDocument);
          container.insertBefore(wrapper, run[0]);
          for (const node of run) wrapper.appendChild(node);
          run = [];
        };
        for (const child of [...container.childNodes]) {
          if (child.nodeType === Node.ELEMENT_NODE && matchFn(child as Element)) { run.push(child); }
          else { flush(); }
        }
        flush();
      }

      const allElements = [body, ...body.querySelectorAll("*")];
      for (const parent of allElements) {
        const ptag = parent.tagName?.toLowerCase();
        if (ptag === "ul" || ptag === "ol") continue;
        wrapRuns(parent, el => el.tagName === "LI", d => d.createElement("ul"));
      }

      const TABLE_PARENTS = new Set(["TABLE", "THEAD", "TBODY", "TFOOT"]);
      for (const parent of [body, ...body.querySelectorAll("*")]) {
        if (TABLE_PARENTS.has(parent.tagName)) continue;
        wrapRuns(parent, el => el.tagName === "TR", d => d.createElement("table"));
      }

      for (const parent of [body, ...body.querySelectorAll("*")]) {
        if (parent.tagName === "DL") continue;
        wrapRuns(parent, el => el.tagName === "DT" || el.tagName === "DD", d => d.createElement("dl"));
      }

      let inlineRun: Node[] = [];
      const flushInline = () => {
        if (inlineRun.length === 0) return;
        const hasContent = inlineRun.some(n =>
          (n.nodeType === Node.TEXT_NODE && n.textContent?.trim()) || n.nodeType === Node.ELEMENT_NODE
        );
        if (hasContent) {
          const p = body.ownerDocument.createElement("p");
          body.insertBefore(p, inlineRun[0]);
          for (const n of inlineRun) p.appendChild(n);
        }
        inlineRun = [];
      };
      for (const child of [...body.childNodes]) {
        const isBlock = child.nodeType === Node.ELEMENT_NODE && (
          BLOCK_TAGS.has((child as Element).tagName.toLowerCase()) ||
          (child as Element).classList.contains("katex-display") ||
          (child as Element).classList.contains("MathJax_Display") ||
          ((child as Element).tagName === "MJX-CONTAINER" &&
            ((child as Element).getAttribute("display") === "true" || (child as Element).getAttribute("display") === "block"))
        );
        if (isBlock) { flushInline(); } else { inlineRun.push(child); }
      }
      flushInline();
    })(doc.body);

    const blocks: any[] = [];
    const SYNTHETIC_SPLIT_MATH_SELECTOR = [
      ".cam-inline-math", ".math-inline", "[data-math]", "[data-latex]",
      "mjx-container", "math", ".katex", ".MathJax"
    ].join(", ");

    function cloneAnnotations(annotations: any[]): any[] {
      return Array.isArray(annotations) ? annotations.map(a => [...a]) : [];
    }

    function addAnnotation(annotations: any[], annotation: any): any[] {
      const next = cloneAnnotations(annotations);
      if (!annotation) return next;
      const alreadyPresent = next.some(existing => existing[0] === annotation[0] && existing[1] === annotation[1]);
      if (!alreadyPresent) next.push([...annotation]);
      return next;
    }

    function pushTextSegments(buffer: any[], text: string, annotations: any[] = [], options: { parseMath?: boolean } = {}) {
      if (!text) return;
      const normalizedText = text.replace(/\s+/g, " ");
      if (!normalizedText) return;
      const { parseMath = true } = options;
      const parts = parseMath ? normalizedText.split(/(\$[^$]+\$)/g) : [normalizedText];
      for (const part of parts) {
        if (!part) continue;
        if (parseMath && part.startsWith("$") && part.endsWith("$") && part.length > 2) {
          buffer.push(["⁍", [["e", part.slice(1, -1)]]]); continue;
        }
        if (!part.trim() && part !== " ") continue;
        const nextAnnotations = cloneAnnotations(annotations);
        buffer.push(nextAnnotations.length > 0 ? [part, nextAnnotations] : [part]);
      }
    }

    function processInlineContent(node: Element): any[][] {
      const buffer: any[] = [];
      function walk(n: Node, inheritedAnnotations: any[] = []) {
        if (n.nodeType === Node.ELEMENT_NODE && isVisuallyHiddenClipboardElement(n as Element)) return;
        if (n.nodeType === Node.ELEMENT_NODE &&
          ((n as Element).getAttribute("data-nf-math-consumed") === "1" ||
           (n as Element).closest?.('[data-nf-math-consumed="1"]'))) return;

        if (n.nodeType === Node.TEXT_NODE) {
          pushTextSegments(buffer, n.textContent || "", inheritedAnnotations);
        } else if (n.nodeType === Node.ELEMENT_NODE) {
          const el = n as Element;
          const tag = el.tagName.toLowerCase();

          if ((el as HTMLElement).style?.display === "block" && el.querySelector("img[data-xpm-latex]")) {
            const xpmImg = el.querySelector("img[data-xpm-latex]");
            const latex = xpmImg?.getAttribute("data-xpm-latex")?.trim();
            if (latex) {
              const cleaned = unwrapMathJax(sanitizeLatex(cleanLatexMatrix(latex)));
              buffer.push(["$$BLOCK_BREAK$$"]);
              buffer.push(["$$DISPLAY_MATH$$", [["e", cleaned]]]);
              buffer.push(["$$BLOCK_BREAK$$"]);
              return;
            }
          }

          if (isMathElement(el)) {
            const extracted = extractLatexFromMathElement(el);
            const latex = resolveLatex(extracted);
            if (latex) {
              const displayMode = getMathDisplayMode(el);
              const forceBlock = isHeavyMath(latex) || displayMode === "block";
              if (forceBlock) {
                buffer.push(["$$BLOCK_BREAK$$"]);
                buffer.push(["$$DISPLAY_MATH$$", [["e", latex]]]);
                buffer.push(["$$BLOCK_BREAK$$"]);
              } else {
                buffer.push(["⁍", [["e", latex]]]);
              }
            }
            return;
          }

          if (tag === "code") {
            const codeAnnotations = addAnnotation(inheritedAnnotations, ["c"]);
            pushTextSegments(buffer, el.textContent || "", codeAnnotations, { parseMath: false });
            return;
          }

          let nextAnnotations = inheritedAnnotations;
          if (tag === "b" || tag === "strong") nextAnnotations = addAnnotation(nextAnnotations, ["b"]);
          else if (tag === "i" || tag === "em") nextAnnotations = addAnnotation(nextAnnotations, ["i"]);
          else if (tag === "u" || tag === "ins") nextAnnotations = addAnnotation(nextAnnotations, ["u"]);
          else if (tag === "a") {
            const href = el.getAttribute("href");
            if (href) nextAnnotations = addAnnotation(nextAnnotations, ["a", href]);
          }

          if (tag === "a" && el.childNodes.length === 0) {
            const href = el.getAttribute("href");
            if (href) buffer.push([href, [["a", href]]]);
            return;
          }
          if (tag === "br") { buffer.push(["$$BLOCK_BREAK$$"]); return; }

          for (const child of el.childNodes) walk(child, nextAnnotations);
        }
      }
      walk(node);

      const segments: any[][] = [[]];
      for (const item of buffer) {
        if (item[0] === "$$BLOCK_BREAK$$") segments.push([]);
        else segments[segments.length - 1].push(item);
      }
      return segments.filter((seg: any[]) => seg.length > 0 && seg[0][0]);
    }

    function isMeaningfulDirectChild(node: Node): boolean {
      if (!node) return false;
      if (node.nodeType === Node.TEXT_NODE) return !!node.textContent?.trim();
      return node.nodeType === Node.ELEMENT_NODE;
    }

    function getNodeTrimmedText(node: Node): string {
      return (node?.textContent || "").replace(/\s+/g, " ").trim();
    }

    function isPunctuationOnlyText(text: string): boolean {
      return !!text && /^[.?!,:;]+$/.test(text.trim());
    }

    function isMathLikeNode(node: Node): boolean {
      if (node?.nodeType !== Node.ELEMENT_NODE) return false;
      if (isMathElement(node as Element)) return true;
      try { return (node as Element).matches?.(SYNTHETIC_SPLIT_MATH_SELECTOR) || false; } catch { return false; }
    }

    function isSentenceStarterNode(node: Node): boolean {
      if (node?.nodeType !== Node.ELEMENT_NODE) return false;
      if (isMathLikeNode(node)) return false;
      const tag = (node as Element).tagName.toLowerCase();
      if (tag === "br" || tag === "code") return false;
      const text = getNodeTrimmedText(node);
      if (!text || isPunctuationOnlyText(text)) return false;
      if (text.length < 12) return false;
      return /\s/.test(text) || /^[A-Z0-9"'(\[]/.test(text);
    }

    function directGroupText(group: Node[]): string {
      return group.map(n => getNodeTrimmedText(n)).join(" ").replace(/\s+/g, " ").trim();
    }

    function shouldSplitBeforeStarter(currentGroup: Node[], nextNode: Node): boolean {
      if (!currentGroup.length) return false;
      const currentText = directGroupText(currentGroup);
      if (!currentText) return false;
      const prevText = getNodeTrimmedText(currentGroup[currentGroup.length - 1]);
      if (/[.?!]$/.test(prevText) || isPunctuationOnlyText(prevText)) return true;
      const groupHasMath = currentGroup.some(isMathLikeNode);
      if (!groupHasMath && nextNode?.nodeType === Node.ELEMENT_NODE) {
        const tag = (nextNode as Element).tagName.toLowerCase();
        if ((tag === "b" || tag === "strong" || tag === "em") && currentText.length <= 40) return true;
      }
      return false;
    }

    function getSyntheticParagraphGroups(node: Element): Node[][] | null {
      const directChildren = Array.from(node.childNodes).filter(isMeaningfulDirectChild);
      if (directChildren.length < 3) return null;
      if (directChildren.some(child => child.nodeType === Node.ELEMENT_NODE && (child as Element).tagName.toLowerCase() === "br")) return null;
      const hasMath = directChildren.some(isMathLikeNode) || !!node.querySelector?.(SYNTHETIC_SPLIT_MATH_SELECTOR);
      if (!hasMath) return null;
      const starterIndices = directChildren
        .map((child, index) => isSentenceStarterNode(child) ? index : -1)
        .filter(index => index >= 0);
      if (starterIndices.length < 2) return null;
      const groups: Node[][] = [];
      let currentGroup: Node[] = [];
      directChildren.forEach((child, index) => {
        const startsSentence = starterIndices.includes(index);
        if (startsSentence && shouldSplitBeforeStarter(currentGroup, child)) {
          groups.push(currentGroup); currentGroup = [];
        }
        currentGroup.push(child);
      });
      if (currentGroup.length) groups.push(currentGroup);
      return groups.length > 1 ? groups : null;
    }

    function normalizeTableCellSegments(segments: any[][]): any[] {
      const richText: any[] = [];
      segments.forEach((segment, index) => {
        if (!Array.isArray(segment) || segment.length === 0) return;
        if (index > 0 && richText.length > 0) {
          const lastSegment = richText[richText.length - 1];
          if (Array.isArray(lastSegment) && lastSegment[0] && !/\s$/.test(lastSegment[0])) richText.push([" "]);
        }
        for (const item of segment) {
          if (!Array.isArray(item) || !item[0]) continue;
          if (item[0] === "$$DISPLAY_MATH$$") {
            const latex = item[1]?.[0]?.[1];
            if (latex) richText.push(["⁍", [["e", latex]]]);
            continue;
          }
          richText.push(item);
        }
      });
      return richText;
    }

    function createBlockFromType(type: string, title: any[], indent = 0): any {
      const id = generateUUID();
      const value: any = { id, type, properties: { title }, parent_table: "block", alive: true };
      if (indent > 0) value.indent = indent;
      return {
        blockId: id,
        blockSubtree: { __version__: 3, block: { [id]: { value } } },
        _meta: { addedAt: Date.now() }
      };
    }

    function processListPaste(listNode: Element, targetBlocks: any[], depth: number) {
      const ltag = listNode.tagName.toLowerCase();
      const listType = ltag === "ul" ? "bulleted_list" : "numbered_list";
      const indent = Math.min(depth, 2);
      const items = listNode.querySelectorAll(":scope > li");
      items.forEach(li => {
        const liClone = li.cloneNode(true) as Element;
        liClone.querySelectorAll(":scope > ul, :scope > ol").forEach(sub => sub.remove());
        const segments = processInlineContent(liClone);
        segments.forEach((richText: any[], segIdx: number) => {
          if (richText.length === 1 && richText[0][0] === "$$DISPLAY_MATH$$") {
            const latex = richText[0][1]?.[0]?.[1];
            if (latex) { targetBlocks.push(createBlockFromType("equation", [[latex]])); return; }
          }
          if (richText.length > 0) {
            const type = segIdx === 0 ? listType : "text";
            targetBlocks.push(createBlockFromType(type, richText, segIdx === 0 ? indent : 0));
          }
        });
        for (const child of li.children) {
          const ct = child.tagName.toLowerCase();
          if (ct === "ul" || ct === "ol") processListPaste(child, targetBlocks, depth + 1);
        }
      });
    }

    function processNode(node: Element) {
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      if (isVisuallyHiddenClipboardElement(node)) return;
      const tag = node.tagName.toLowerCase();

      if (isMathElement(node)) {
        const extracted = extractLatexFromMathElement(node);
        const latex = resolveLatex(extracted);
        if (latex) {
          const displayMode = getMathDisplayMode(node);
          const forceBlock = isHeavyMath(latex) || displayMode === "block";
          if (forceBlock) { blocks.push(createBlockFromType("equation", [[latex]])); return; }
        }
      }

      const textContent = node.textContent || "";
      const displayMathMatch = textContent.match(/^\s*\$\$([^$]+)\$\$\s*$/);
      if (displayMathMatch && node.children.length === 0) {
        blocks.push(createBlockFromType("equation", [[displayMathMatch[1].trim()]]));
        return;
      }

      if (["h1", "h2", "h3", "h4", "h5", "h6"].includes(tag)) {
        const level = Math.min(parseInt(tag[1], 10), 3);
        const typeMap: Record<number, string> = { 1: "header", 2: "sub_header", 3: "sub_sub_header" };
        const headerType = typeMap[level] || "header";
        const segments = processInlineContent(node);
        let emittedHeader = false;
        for (const richText of segments) {
          if (richText.length === 1 && richText[0][0] === "$$DISPLAY_MATH$$") {
            const latex = richText[0][1]?.[0]?.[1];
            if (latex) blocks.push(createBlockFromType("equation", [[latex]]));
            continue;
          }
          if (richText.length > 0 && richText[0][0]) {
            blocks.push(createBlockFromType(emittedHeader ? "text" : headerType, richText));
            emittedHeader = true;
          }
        }
        if (!emittedHeader && node.textContent?.trim()) {
          blocks.push(createBlockFromType(headerType, [[node.textContent.trim()]]));
        }
        return;
      }

      const isInlineLikeDiv = tag === "div" && !hasDescendantSemanticClipboardBlocks(node);
      if (tag === "p" || isInlineLikeDiv || (tag === "div" && node.querySelector("img[data-xpm-latex]"))) {
        const groupedChildren = getSyntheticParagraphGroups(node);
        const segmentSources = groupedChildren && groupedChildren.length > 1
          ? groupedChildren.map(group => {
              const wrapper = node.ownerDocument.createElement(tag === "p" ? "p" : "div");
              for (const child of group) wrapper.appendChild(child.cloneNode(true));
              return wrapper;
            })
          : [node];
        for (const sourceNode of segmentSources) {
          const segments = processInlineContent(sourceNode);
          for (const richText of segments) {
            if (richText.length === 1 && richText[0][0] === "$$DISPLAY_MATH$$") {
              const latex = richText[0][1]?.[0]?.[1];
              if (latex) { blocks.push(createBlockFromType("equation", [[latex]])); continue; }
            }
            if (richText.length > 0 && richText[0][0]) blocks.push(createBlockFromType("text", richText));
          }
        }
        return;
      }

      if (tag === "ul" || tag === "ol") { processListPaste(node, blocks, 0); return; }

      if (tag === "blockquote") {
        const segments = processInlineContent(node);
        for (const richText of segments) {
          if (richText.length === 1 && richText[0][0] === "$$DISPLAY_MATH$$") {
            const latex = richText[0][1]?.[0]?.[1];
            if (latex) { blocks.push(createBlockFromType("equation", [[latex]])); continue; }
          }
          if (richText.length > 0 && richText[0][0]) blocks.push(createBlockFromType("quote", richText));
        }
        return;
      }

      if (tag === "pre") {
        blocks.push(createBlockFromType("code", [[(node.textContent || "").trim()]]));
        return;
      }

      if (tag === "table") {
        const tableRows: any[] = [];
        const trElements = node.querySelectorAll("tr");
        let hasHeader = false;
        for (const tr of trElements) {
          const cells: any[] = [];
          const cellEls = tr.querySelectorAll("th, td");
          for (const cell of cellEls) {
            if (cell.tagName.toLowerCase() === "th") hasHeader = true;
            cells.push(normalizeTableCellSegments(processInlineContent(cell)));
          }
          if (cells.length > 0) tableRows.push(cells);
        }
        if (tableRows.length > 0) {
          const columnCount = Math.max(...tableRows.map((r: any[]) => r.length));
          const normalizedRows = tableRows.map((row: any[]) => {
            while (row.length < columnCount) row.push("");
            return row;
          });
          const id = generateUUID();
          blocks.push({
            blockId: id,
            blockSubtree: {
              __version__: 3,
              block: { [id]: { value: {
                id, type: "table",
                properties: { title: [[""]], table_data: { rows: normalizedRows, hasHeader, columnCount } },
                parent_table: "block", alive: true
              } } }
            },
            _meta: { addedAt: Date.now() }
          });
        }
        return;
      }

      for (const child of node.children) processNode(child);
    }

    for (const child of doc.body.children) processNode(child);

    if (blocks.length === 0 && doc.body.textContent?.trim()) return null;
    return blocks.length > 0 ? blocks : null;
  } catch (e) {
    console.warn("[Copy Anywhere] parseHtmlToBlocks failed:", e);
    return null;
  }
}
