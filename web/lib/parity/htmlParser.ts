/* eslint-disable @typescript-eslint/no-explicit-any */
// Verbatim mirror of parseHtmlToBlocks from copy-anywhere-main/content.js (lines 1226-1810)
// Adapter: replaced globalThis.NF.* with inline browser-safe implementations

import { generateUUID } from "./blockFactory";

// ==================== Inline NF Utilities (from math-utils.js) ====================

const MATHML_OPS: Record<string, string> = {
  "+": "+", "-": "-", "×": "\\times", "÷": "\\div", "=": "=", "≠": "\\neq",
  "<": "<", ">": ">", "≤": "\\leq", "≥": "\\geq", "±": "\\pm", "∞": "\\infty",
  "∑": "\\sum", "∏": "\\prod", "∫": "\\int", "∂": "\\partial", "√": "\\sqrt",
  "∈": "\\in", "∉": "\\notin", "⊂": "\\subset", "∪": "\\cup", "∩": "\\cap",
  "→": "\\to", "⇒": "\\Rightarrow", "⇔": "\\Leftrightarrow",
  "∥": "\\|", "⋅": "\\cdot",
  "(": "(", ")": ")", "[": "[", "]": "]", "{": "\\{", "}": "\\}", "|": "|", ",": ",",
};

const MATHML_GREEKS: Record<string, string> = {
  "α": "\\alpha", "β": "\\beta", "γ": "\\gamma", "δ": "\\delta", "ε": "\\epsilon",
  "ζ": "\\zeta", "η": "\\eta", "θ": "\\theta", "ι": "\\iota", "κ": "\\kappa",
  "λ": "\\lambda", "μ": "\\mu", "ν": "\\nu", "ξ": "\\xi", "π": "\\pi",
  "ρ": "\\rho", "σ": "\\sigma", "τ": "\\tau", "υ": "\\upsilon", "φ": "\\phi",
  "χ": "\\chi", "ψ": "\\psi", "ω": "\\omega", "Γ": "\\Gamma", "Δ": "\\Delta",
  "Θ": "\\Theta", "Λ": "\\Lambda", "Ξ": "\\Xi", "Π": "\\Pi", "Σ": "\\Sigma",
  "Φ": "\\Phi", "Ψ": "\\Psi", "Ω": "\\Omega",
};

const MATHML_IDENTIFIERS: Record<string, string> = {
  "∀": "\\forall", "∃": "\\exists", "ℕ": "\\mathbb{N}", "ℤ": "\\mathbb{Z}",
  "ℚ": "\\mathbb{Q}", "ℝ": "\\mathbb{R}", "ℂ": "\\mathbb{C}",
};

function convertMathMLNode(node: Node): string {
  if (!node) return "";
  if (node.nodeType === Node.TEXT_NODE) return (node.textContent || "").trim();

  const el = node as Element;
  const tag = el.tagName?.toLowerCase();
  const children = Array.from(el.children || []);
  const childContent = () => Array.from(el.childNodes).map(convertMathMLNode).join("");

  switch (tag) {
    case "mo":
      return MATHML_IDENTIFIERS[(node.textContent || "").trim()] || MATHML_OPS[(node.textContent || "").trim()] || (node.textContent || "").trim();
    case "mi": {
      const text = (node.textContent || "").trim();
      const variant = el.getAttribute?.("mathvariant");
      if (MATHML_IDENTIFIERS[text]) return MATHML_IDENTIFIERS[text];
      if (MATHML_OPS[text]) return MATHML_OPS[text];
      if (variant === "double-struck" && /^[A-Za-z]$/.test(text)) return `\\mathbb{${text}}`;
      if (variant === "bold") return `\\mathbf{${text}}`;
      return MATHML_GREEKS[text] || text;
    }
    case "mn":
      return (node.textContent || "").trim();
    case "mtext":
      return `\\text{${(node.textContent || "").trim()}}`;
    case "mspace":
      return "\\,";
    case "mfrac":
      return children.length >= 2
        ? `\\frac{${convertMathMLNode(children[0])}}{${convertMathMLNode(children[1])}}`
        : "";
    case "msqrt":
      return `\\sqrt{${childContent()}}`;
    case "mroot":
      return children.length >= 2
        ? `\\sqrt[${convertMathMLNode(children[1])}]{${convertMathMLNode(children[0])}}`
        : `\\sqrt{${childContent()}}`;
    case "msup":
      return children.length >= 2
        ? `{${convertMathMLNode(children[0])}}^{${convertMathMLNode(children[1])}}`
        : childContent();
    case "msub":
      return children.length >= 2
        ? `{${convertMathMLNode(children[0])}}_{${convertMathMLNode(children[1])}}`
        : childContent();
    case "msubsup":
      return children.length >= 3
        ? `{${convertMathMLNode(children[0])}}_{${convertMathMLNode(children[1])}}^{${convertMathMLNode(children[2])}}`
        : childContent();
    case "mover": {
      if (children.length >= 2) {
        const accent = (children[1].textContent || "").trim();
        const accents: Record<string, string> = { "→": "\\vec", "¯": "\\bar", "^": "\\hat", "~": "\\tilde", "˙": "\\dot" };
        if (accents[accent]) return `${accents[accent]}{${convertMathMLNode(children[0])}}`;
        return `\\overset{${convertMathMLNode(children[1])}}{${convertMathMLNode(children[0])}}`;
      }
      return childContent();
    }
    case "munder":
      return children.length >= 2
        ? `\\underset{${convertMathMLNode(children[1])}}{${convertMathMLNode(children[0])}}`
        : childContent();
    case "mtable": {
      const rows = Array.from(el.querySelectorAll("mtr"));
      const content = rows
        .map((row) => {
          const cells = Array.from(row.querySelectorAll("mtd"));
          return cells.map((cell) => convertMathMLNode(cell)).join(" & ");
        })
        .join(" \\\\ ");
      return `\\begin{matrix} ${content} \\end{matrix}`;
    }
    case "mfenced": {
      const open = el.getAttribute("open") || "(";
      const close = el.getAttribute("close") || ")";
      return `\\left${open}${childContent()}\\right${close}`;
    }
    default:
      return childContent();
  }
}

function mathMLToLatex(mathmlInput: string | Node): string | null {
  if (!mathmlInput) return null;
  if (typeof mathmlInput !== "string") {
    const latex = convertMathMLNode(mathmlInput);
    return latex?.trim() || null;
  }
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(mathmlInput, "text/xml");
    if (doc.querySelector("parsererror")) return null;
    const mathEl = doc.querySelector("math") || doc.documentElement;
    const latex = convertMathMLNode(mathEl);
    return latex?.trim() || null;
  } catch (e) {
    console.warn("MathML conversion error:", e);
    return null;
  }
}

function sanitizeLatex(latex: string): string {
  if (!latex) return latex;
  return latex
    .replace(/−/g, "-")
    .replace(/⋅/g, "\\cdot ")
    .replace(/×/g, "\\times ")
    .replace(/÷/g, "\\div ")
    .replace(/≤/g, "\\leq ")
    .replace(/≥/g, "\\geq ")
    .replace(/≠/g, "\\neq ")
    .replace(/±/g, "\\pm ")
    .replace(/∞/g, "\\infty ")
    .replace(/→/g, "\\to ")
    .replace(/←/g, "\\leftarrow ")
    .replace(/⇒/g, "\\Rightarrow ")
    .replace(/∈/g, "\\in ")
    .replace(/∉/g, "\\notin ")
    .replace(/⊂/g, "\\subset ")
    .replace(/∪/g, "\\cup ")
    .replace(/∩/g, "\\cap ")
    .replace(/⋯/g, "\\cdots ")
    .replace(/∑/g, "\\sum ")
    .replace(/∏/g, "\\prod ")
    .replace(/∫/g, "\\int ")
    .replace(/∂/g, "\\partial ")
    .replace(/√/g, "\\sqrt ")
    .replace(/∥/g, "\\|")
    .replace(/\u00A0/g, " ")
    .replace(/\u200B/g, "")
    .trim();
}

function cleanupMalformedLeftRight(latex: string): string {
  if (!latex) return latex;
  return latex
    .replace(/\\left(?=\\begin\{)/g, "")
    .replace(/\\right(?=\s*(?:[=+\-*/]|$))/g, "")
    .replace(/\\left(?!\\?(?:[\[\]\(\)\{\}\|\.]))/g, "")
    .replace(/\\right(?!\\?(?:[\[\]\(\)\{\}\|\.]))/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function cleanLatexMatrix(latex: string): string {
  if (!latex) return latex;
  let cleaned = sanitizeLatex(latex);
  if (cleaned.includes("matrix}")) {
    cleaned = cleaned
      .replace(/\\left\[\s*\\begin\{matrix\}/g, "\\begin{bmatrix}")
      .replace(/\\end\{matrix\}\s*\\right\]/g, "\\end{bmatrix}")
      .replace(/\\left\(\s*\\begin\{matrix\}/g, "\\begin{pmatrix}")
      .replace(/\\end\{matrix\}\s*\\right\)/g, "\\end{pmatrix}")
      .replace(/\[\s*\\begin\{matrix\}/g, "\\begin{bmatrix}")
      .replace(/\\end\{matrix\}\s*\]/g, "\\end{bmatrix}")
      .replace(/\\begin\{matrix\}/g, "\\begin{bmatrix}")
      .replace(/\\end\{matrix\}/g, "\\end{bmatrix}");
  }
  return cleaned;
}

function isHeavyMath(latex: string): boolean {
  if (!latex) return false;
  return (
    latex.includes("\\begin{") ||
    latex.includes("\\\\") ||
    (latex.includes("\\frac{") && latex.length > 50) ||
    latex.length > 100
  );
}

function unwrapMathJax(latex: string): string {
  if (!latex) return latex;
  return latex
    .replace(/\{(\\[a-zA-Z]+)\}/g, "$1")
    .replace(/\{([0-9])\}/g, "$1")
    .replace(/\{\s*\}/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanLatexString(latex: string): string | null {
  if (!latex) return null;
  let cleaned = latex.trim();
  if (cleaned.startsWith("\\(") && cleaned.endsWith("\\)")) {
    cleaned = cleaned.slice(2, -2);
  } else if (cleaned.startsWith("\\[") && cleaned.endsWith("\\]")) {
    cleaned = cleaned.slice(2, -2);
  }
  if (cleaned.startsWith("$$") && cleaned.endsWith("$$")) {
    cleaned = cleaned.slice(2, -2);
  } else if (cleaned.startsWith("$") && cleaned.endsWith("$")) {
    cleaned = cleaned.slice(1, -1);
  }
  return cleaned.trim();
}

function resolveLatex(extracted: any): string | null {
  if (!extracted) return null;
  if (typeof extracted === "string") {
    return cleanupMalformedLeftRight(unwrapMathJax(sanitizeLatex(cleanLatexMatrix(extracted))));
  }
  if (extracted.type === "mathml") {
    const latex = mathMLToLatex(extracted.content);
    return latex
      ? cleanupMalformedLeftRight(unwrapMathJax(sanitizeLatex(cleanLatexMatrix(latex))))
      : null;
  }
  return null;
}

// ==================== Inline NF Utilities (from math-dom.js) ====================

const VISUAL_KATEX_OPS: Record<string, string> = {
  "+": "+", "-": "-", "=": "=", "≤": "\\leq", "≥": "\\geq",
  "≠": "\\neq", "∈": "\\in", "∀": "\\forall", "∃": "\\exists",
};

function nodeText(node: Node): string {
  return (node?.textContent || "").replace(/\u200B/g, "").trim();
}

function normalizeDelimiterChar(ch: string): string {
  if (!ch) return "";
  if (ch === "{") return "\\{";
  if (ch === "}") return "\\}";
  return ch;
}

function normalizeVisualToken(text: string): string {
  if (!text) return "";
  return text
    .replace(/⋮/g, "\\vdots")
    .replace(/∥/g, "\\|");
}

function isSimpleAlphaWord(text: string): boolean {
  return /^[A-Za-z]+$/.test(text || "");
}

function parseVisualTopOffset(node: Element): number | null {
  const style = node?.getAttribute?.("style") || "";
  const m = style.match(/top:\s*([\-0-9.]+)em/i);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

function extractVisualFractionLatex(mfracEl: Element): string | null {
  const vlist = mfracEl.querySelector(":scope > .vlist-t > .vlist-r > .vlist");
  if (!vlist) return null;

  const rows = Array.from(vlist.children);
  if (rows.length < 2) return null;

  const hasFracLine = rows.some((row) => !!row.querySelector(".frac-line"));
  if (!hasFracLine) return null;

  const mathRows = rows
    .map((row, idx) => {
      const latex = normalizeVisualToken(parseVisualKatexNode(row))
        .replace(/[ \t]{2,}/g, " ")
        .trim();
      return {
        idx,
        latex,
        hasLine: !!row.querySelector(".frac-line"),
        top: parseVisualTopOffset(row as Element),
      };
    })
    .filter((r) => !r.hasLine && r.latex);

  if (mathRows.length < 2) return null;

  const ordered = mathRows.every((r) => r.top !== null)
    ? [...mathRows].sort((a, b) => (b.top as number) - (a.top as number))
    : mathRows;

  const denominator = ordered[0]?.latex;
  const numerator = ordered[1]?.latex;
  if (!numerator || !denominator) return null;
  return `\\frac{${numerator}}{${denominator}}`;
}

function parseVisualKatexNode(node: Node): string {
  if (!node) return "";
  if (node.nodeType === Node.TEXT_NODE) {
    return normalizeVisualToken(nodeText(node)) || "";
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const el = node as Element;
  if (
    el.classList.contains("strut") ||
    el.classList.contains("pstrut") ||
    el.classList.contains("vlist-s") ||
    el.classList.contains("hide-tail") ||
    el.tagName.toLowerCase() === "svg" ||
    el.tagName.toLowerCase() === "path"
  ) {
    return "";
  }
  if (el.classList.contains("mathbf")) {
    const boldText = nodeText(el);
    return boldText ? `\\mathbf{${boldText}}` : "";
  }
  if (el.classList.contains("text")) {
    const text = normalizeVisualToken(nodeText(el));
    if (!text) return "";
    return isSimpleAlphaWord(text) ? `\\text{${text}}` : text;
  }
  if (el.classList.contains("mord") && el.classList.contains("sqrt")) {
    const radicand = Array.from(el.childNodes)
      .map((child) => parseVisualKatexNode(child))
      .join("")
      .replace(/[ \t]{2,}/g, " ")
      .trim();
    return radicand ? `\\sqrt{${radicand}}` : "\\sqrt{}";
  }
  if (el.classList.contains("mfrac")) {
    const fracLatex = extractVisualFractionLatex(el);
    if (fracLatex) return fracLatex;
  }
  if (el.classList.contains("msupsub")) {
    const inMatrix = !!el.closest(".mtable");
    const textBase = el.closest(".mord")?.querySelector(":scope > .text .mord, :scope > .text");
    const textBaseToken = textBase ? nodeText(textBase).trim() : "";
    const operatorLikeSingleScript = !!textBaseToken && isSimpleAlphaWord(textBaseToken);
    const vlist = el.querySelector(":scope > .vlist-t > .vlist-r > .vlist");
    if (vlist) {
      const rows = Array.from(vlist.children)
        .map((row) =>
          Array.from(row.childNodes)
            .map((child) => parseVisualKatexNode(child))
            .join("")
            .replace(/[ \t]{2,}/g, " ")
            .trim(),
        )
        .filter(Boolean);
      if (rows.length >= 2) return `_{${rows[0]}}^{${rows[1]}}`;
      if (rows.length === 1) {
        return (inMatrix || operatorLikeSingleScript) ? `_{${rows[0]}}` : `^{${rows[0]}}`;
      }
    }

    const tightValues = Array.from(el.querySelectorAll(".mtight"))
      .map((t) => nodeText(t))
      .filter(Boolean)
      .filter((v, i, arr) => i === 0 || v !== arr[i - 1]);
    if (tightValues.length >= 2) return `_{${tightValues[0]}}^{${tightValues[1]}}`;
    if (tightValues.length === 1) {
      return (inMatrix || operatorLikeSingleScript) ? `_{${tightValues[0]}}` : `^{${tightValues[0]}}`;
    }
    return "";
  }
  if (el.classList.contains("mspace")) return " ";
  if (el.classList.contains("mrel")) {
    const op = nodeText(el);
    return op ? ` ${VISUAL_KATEX_OPS[op] || op} ` : "";
  }
  if (el.classList.contains("mbin")) {
    const op = nodeText(el);
    return op ? ` ${VISUAL_KATEX_OPS[op] || op} ` : "";
  }
  if (el.classList.contains("mopen") || el.classList.contains("mclose")) {
    const delim = el.querySelector(".delimsizing");
    if (delim) {
      const delimText = nodeText(delim);
      if (delimText) return normalizeDelimiterChar(delimText);
      if (delim.classList.contains("mult")) return "\\|";
    }
    const fallback = nodeText(el);
    return fallback ? normalizeDelimiterChar(fallback) : "";
  }
  if (el.classList.contains("delimsizing")) {
    const delimText = nodeText(el);
    if (delimText) return normalizeDelimiterChar(delimText);
    if (el.classList.contains("mult")) return "\\|";
    return "";
  }

  if (el.classList.contains("mtable")) {
    const vlist = el.querySelector(".vlist");
    if (vlist) {
      const rows = Array.from(vlist.children)
        .map((row) => {
          const parsed = Array.from(row.childNodes)
            .map((child) => parseVisualKatexNode(child))
            .join("")
            .replace(/[ \t]{2,}/g, " ")
            .trim();
          if (parsed) return normalizeVisualToken(parsed);
          return normalizeVisualToken(row.textContent?.replace(/\u200B/g, "").trim() || "");
        })
        .filter(Boolean);
      if (rows.length > 0) {
        return `\\begin{matrix} ${rows.join(" \\\\ ")} \\end{matrix}`;
      }
    }
    const fallback = nodeText(el);
    return fallback || "";
  }

  if (el.classList.contains("minner") && el.querySelector(".mtable")) {
    const matrix = parseVisualKatexNode(el.querySelector(".mtable")!);
    if (!matrix) return "";
    const openDelim = el.querySelector(":scope > .mopen .delimsizing");
    const closeDelim = el.querySelector(":scope > .mclose .delimsizing");
    const inferMatrixBracket = (which: string) => {
      if (which === "open" && openDelim?.classList.contains("mult")) return "[";
      if (which === "close" && closeDelim?.classList.contains("mult")) return "]";
      return "";
    };
    const openRaw =
      (openDelim ? nodeText(openDelim) : "") ||
      inferMatrixBracket("open") ||
      nodeText(el.querySelector(":scope > .mopen") as Node) ||
      "";
    const closeRaw =
      (closeDelim ? nodeText(closeDelim) : "") ||
      inferMatrixBracket("close") ||
      nodeText(el.querySelector(":scope > .mclose") as Node) ||
      "";
    const open = normalizeDelimiterChar(openRaw);
    const close = normalizeDelimiterChar(closeRaw);
    if (open && close) return `\\left${open}${matrix}\\right${close}`;
    if (open || close) return `${open}${matrix}${close}`;
    return matrix;
  }

  if (el.childNodes?.length) {
    return Array.from(el.childNodes)
      .map((child) => parseVisualKatexNode(child))
      .join("");
  }

  return nodeText(el) || "";
}

function extractLatexFromVisualKatex(el: Element): string | null {
  const base =
    (el.classList?.contains("base") ? el : null) ||
    el.closest?.(".base") ||
    el.querySelector?.(".katex-html .base, .base");
  if (!base) return null;
  if (!base.querySelector(".mtable, .mrel, .mopen, .mclose, .sqrt, .msupsub")) return null;

  const bases = [base];
  let sib = base.nextElementSibling;
  while (sib && sib.classList?.contains("base")) {
    bases.push(sib);
    sib = sib.nextElementSibling;
  }

  const latex = bases
    .map((b) =>
      Array.from(b.childNodes)
        .map((child) => parseVisualKatexNode(child))
        .join("")
        .replace(/[ \t]{2,}/g, " ")
        .trim(),
    )
    .filter(Boolean)
    .join(" ")
    .trim();

  if (bases.length > 1) {
    for (let i = 1; i < bases.length; i++) (bases[i] as Element).setAttribute("data-nf-math-consumed", "1");
  }

  return latex ? cleanLatexString(latex) : null;
}

// ==================== isMathElement / getMathDisplayMode / extractLatexFromMathElement ====================

function isMathElement(el: Element): boolean {
  if (!el || el.nodeType !== Node.ELEMENT_NODE) return false;
  if (el.getAttribute("data-nf-math-consumed") === "1") return false;
  const tag = el.tagName.toLowerCase();

  if (tag === "mjx-container" || tag === "math") return true;

  if (
    el.classList.contains("katex") ||
    el.classList.contains("katex-display") ||
    el.classList.contains("MathJax") ||
    el.classList.contains("MathJax_Display") ||
    el.classList.contains("math-tex")
  ) return true;

  if (el.closest("mjx-container") && el === el.closest("mjx-container")) return true;
  if (el.closest(".katex") && el === el.closest(".katex")) return true;
  if (el.closest(".MathJax") && el === el.closest(".MathJax")) return true;

  if (el.hasAttribute("data-latex") || el.hasAttribute("data-tex") || el.hasAttribute("data-math")) return true;

  if (el.classList.contains("math-block") || el.classList.contains("math-inline")) return true;

  if (el.hasAttribute("data-xpm-copy-root") && el.querySelector("img[data-xpm-latex]")) return true;
  if (el.classList.contains("mtable")) return true;
  if (el.classList.contains("base") && el.querySelector(".mtable, .mrel, .mopen, .mclose, .sqrt, .msupsub")) return true;

  return false;
}

function getMathDisplayMode(el: Element): "inline" | "block" {
  const parent = el.parentElement;

  if (el.classList.contains("katex-display")) return "block";
  if (el.closest(".katex-display")) return "block";

  if (el.classList.contains("math-block")) return "block";
  if (el.closest(".math-block")) return "block";

  if (el.classList.contains("MathJax_Display")) return "block";
  if (el.closest(".MathJax_Display")) return "block";

  const mjxContainer = el.tagName?.toLowerCase() === "mjx-container" ? el : el.closest("mjx-container");
  if (mjxContainer) {
    const display = mjxContainer.getAttribute("display");
    if (display === "true" || display === "block") return "block";
    if (display === "false" || display === "inline") return "inline";
    if (mjxContainer.classList.contains("MJXc-display")) return "block";
  }

  const mathmlEl = el.tagName?.toLowerCase() === "math" ? el : el.querySelector("math");
  if (mathmlEl && mathmlEl.getAttribute("display") === "block") return "block";

  if (parent) {
    const siblings = Array.from(parent.childNodes).filter(
      (n) => n.nodeType === Node.ELEMENT_NODE || (n.nodeType === Node.TEXT_NODE && (n.textContent || "").trim()),
    );

    const allMathSiblings = siblings
      .filter((n) => n !== el)
      .every(
        (n) =>
          n.nodeType === Node.ELEMENT_NODE &&
          (isMathElement(n as Element) || (n as Element).getAttribute?.("data-nf-math-consumed") === "1"),
      );
    if (siblings.length > 1 && allMathSiblings) return "block";

    const hasTextSibling = siblings.some((n) => {
      if (n === el) return false;
      if (n.nodeType === Node.TEXT_NODE) return true;
      if (n.nodeType === Node.ELEMENT_NODE && (n as Element).getAttribute?.("data-nf-math-consumed") === "1") return false;
      if (n.nodeType === Node.ELEMENT_NODE && isMathElement(n as Element)) return false;
      const t = (n.textContent || "").trim();
      return t && t.length > 0;
    });
    if (hasTextSibling) return "inline";
  }

  if (parent) {
    const parentTag = parent.tagName.toLowerCase();
    if (["p", "div", "td", "li"].includes(parentTag)) {
      const sibs = Array.from(parent.childNodes).filter(
        (n) => n.nodeType === Node.ELEMENT_NODE || (n.nodeType === Node.TEXT_NODE && (n.textContent || "").trim()),
      );
      if (sibs.length === 1) return "block";
    }
  }

  return "inline";
}

function tryDecodeURI(s: string | null): string | null {
  if (!s) return s;
  try { return decodeURIComponent(s); } catch { return s; }
}

function extractLatexFromMathElement(el: Element): any {
  const mathContainer =
    el.closest("mjx-container") ||
    el.closest(".katex") ||
    el.closest(".MathJax") ||
    el.closest("math") ||
    el.closest(".base") ||
    el;

  // Strategy A: MathJax 3 CHTML assistive-mml
  const assistive = mathContainer.querySelector("mjx-assistive-mml");
  if (assistive) {
    const mathEl = assistive.querySelector("math");
    if (mathEl) {
      return { type: "mathml", content: mathEl.outerHTML };
    }
    if (assistive.innerHTML && assistive.innerHTML.trim()) {
      return { type: "mathml", content: assistive.innerHTML };
    }
  }

  // Strategy B: Direct attributes
  const directLatex =
    mathContainer.getAttribute("data-math") ||
    tryDecodeURI(mathContainer.getAttribute("data-latex")) ||
    mathContainer.getAttribute("alt") ||
    mathContainer.getAttribute("aria-label") ||
    mathContainer.getAttribute("title");
  if (directLatex && directLatex.trim()) {
    return cleanLatexString(directLatex);
  }

  const elParent = mathContainer.parentElement;
  if (elParent) {
    const parentLatex =
      elParent.getAttribute("data-math") ||
      tryDecodeURI(elParent.getAttribute("data-latex")) ||
      elParent.getAttribute("alt") ||
      elParent.getAttribute("aria-label");
    if (parentLatex && parentLatex.trim()) {
      return cleanLatexString(parentLatex);
    }
  }

  const grandparent = elParent?.parentElement;
  if (grandparent) {
    const gpLatex =
      grandparent.getAttribute("data-math") || tryDecodeURI(grandparent.getAttribute("data-latex"));
    if (gpLatex && gpLatex.trim()) {
      return cleanLatexString(gpLatex);
    }
  }

  // Strategy C: MathML extraction
  const mjxContainer =
    mathContainer.tagName?.toLowerCase() === "mjx-container" ? mathContainer : el.closest("mjx-container");

  if (mjxContainer) {
    const assistiveMml =
      mjxContainer.querySelector("mjx-assistive-mml math") || mjxContainer.querySelector("mjx-assistive-mml");
    if (assistiveMml) {
      const mathEl =
        assistiveMml.tagName?.toLowerCase() === "math" ? assistiveMml : assistiveMml.querySelector("math");
      if (mathEl) {
        return { type: "mathml", content: mathEl.outerHTML };
      }
    }

    const directMath = mjxContainer.querySelector("math");
    if (directMath) {
      return { type: "mathml", content: directMath.outerHTML };
    }

    const script =
      mjxContainer.querySelector('script[type="math/tex"]') ||
      mjxContainer.querySelector('script[type="math/tex; mode=display"]');
    if (script) return script.textContent;
  }

  // Legacy MathJax/KaTeX annotation
  const annotation =
    mathContainer.querySelector('annotation[encoding="application/x-tex"]') ||
    mathContainer.querySelector('annotation[encoding="application/x-latex"]');
  if (annotation) return annotation.textContent;

  // KaTeX data attributes
  if ((mathContainer as HTMLElement).dataset?.math) return cleanLatexString((mathContainer as HTMLElement).dataset.math!);
  if ((mathContainer as HTMLElement).dataset?.latex) return tryDecodeURI((mathContainer as HTMLElement).dataset.latex!);
  if ((mathContainer as HTMLElement).dataset?.tex) return (mathContainer as HTMLElement).dataset.tex;

  const texEl = mathContainer.querySelector("[data-tex]") || mathContainer.querySelector("[data-latex]");
  if (texEl) return (texEl as HTMLElement).dataset.tex || tryDecodeURI((texEl as HTMLElement).dataset.latex ?? null);

  // Strategy C2: Google Search AI Overview (data-xpm-latex)
  const xpmContainer = el.closest("[data-xpm-copy-root]") || mathContainer.closest("[data-xpm-copy-root]");
  if (xpmContainer) {
    const xpmImg = xpmContainer.querySelector("img[data-xpm-latex]");
    if (xpmImg) {
      const xpmLatex = xpmImg.getAttribute("data-xpm-latex");
      if (xpmLatex && xpmLatex.trim()) return cleanLatexString(xpmLatex);
    }
  }
  const parentEl = mathContainer.parentElement;
  if (parentEl) {
    const siblingImg = parentEl.querySelector("img[data-xpm-latex]");
    if (siblingImg) {
      const sibLatex = siblingImg.getAttribute("data-xpm-latex");
      if (sibLatex && sibLatex.trim()) return cleanLatexString(sibLatex);
    }
  }

  // Strategy D: Direct MathML fallback (e.g. KaTeX clipboard where browser strips <annotation>)
  const fallbackMathEl = mathContainer.querySelector("math") ||
    (mathContainer.tagName?.toLowerCase() === "math" ? mathContainer : null);
  if (fallbackMathEl) {
    return { type: "mathml", content: fallbackMathEl.outerHTML };
  }

  // Strategy D2: KaTeX visual clipboard HTML fallback (no MathML/annotation)
  const visualLatex = extractLatexFromVisualKatex(mathContainer);
  if (visualLatex) return visualLatex;

  return null;
}

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
        // Strip redundant leading number prefix (e.g. "1.") from <li> text in <ol>,
        // since the list structure already implies numbering.
        if (listType === "numbered_list" && segments.length > 0) {
          const first = segments[0];
          if (first.length > 0 && typeof first[0][0] === "string") {
            first[0] = [...first[0]];
            first[0][0] = first[0][0].replace(/^\d+\.\s*/, "");
            if (first[0][0] === "" && first.length > 1) first.shift();
          }
        }
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
