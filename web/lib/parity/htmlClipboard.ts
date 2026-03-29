/* eslint-disable @typescript-eslint/no-explicit-any */
// Verbatim mirror of copy-anywhere-main/utils/html-clipboard.js
// Adaptation: chrome.runtime.getURL replaced with CDN <script> loader for MathJax

import {
  RENDER_BUDGET_MS,
  RENDER_TIMEOUT_FLOOR_MS,
  BLOCK_EQ_MAX_WIDTH,
  INLINE_BASE_FONT_PX,
  clamp,
  timeoutPromise,
  assertWithinBudget,
  isRichTextArray,
  normalizeTableCellRichText,
  scaleCssLength,
  dataUrlFromBlob,
  stripTrailingDisplayTag,
  getHtmlRenderLatex,
  ensureMathJaxSvg,
  collectMathRequests,
  stripSvgMarkup,
} from "./mathRender";

const ROOT_STYLE =
  'font-family:system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;font-size:1em;line-height:1.45;color:#000;background:transparent;margin:0;padding:0';
const P_STYLE = "margin:0 0 0.5em 0";
const H1_STYLE =
  "font-size:1.15em;font-weight:700;margin:0.65em 0 0.35em 0;line-height:1.35;color:inherit";
const H2_STYLE =
  "font-size:1.08em;font-weight:700;margin:0.55em 0 0.3em 0;line-height:1.35;color:inherit";
const H3_STYLE =
  "font-size:1.04em;font-weight:600;margin:0.5em 0 0.28em 0;line-height:1.35;color:inherit";
const UL_WRAP =
  "margin:0.35em 0;padding-left:1.35em;list-style-position:outside";
const OL_WRAP = "margin:0.35em 0;padding-left:1.35em;list-style:none";
const LI_BULLET = "margin:0.15em 0;list-style:disc";
const LI_NUM = "margin:0.15em 0;list-style:none";
const NUM_MARKER = "font-weight:600;margin-right:6px;color:inherit";
const CODE_INLINE_STYLE =
  'font-family:ui-monospace,SFMono-Regular,"Cascadia Code","Source Code Pro",Menlo,Consolas,monospace;font-size:0.92em;background:#f3f3f3;border:1px solid #e5e5e5;border-radius:2px;padding:0.05em 0.35em';
const PRE_STYLE =
  "margin:0.5em 0;padding:0.55em 0.75em;border:1px solid #ddd;border-radius:3px;background:#f8f8f8;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:0.9em;line-height:1.4;white-space:pre-wrap;overflow-x:auto;color:#111";
const BLOCKQUOTE_STYLE =
  "margin:0.5em 0;padding-left:0.75em;border-left:3px solid #ccc;color:inherit";
const HR_STYLE = "border:none;border-top:1px solid #ccc;margin:0.75em 0";
const TABLE_STYLE =
  "border-collapse:collapse;border:1px solid #ccc;margin:0.5em 0;width:auto;max-width:100%";
const TH_TD =
  "border:1px solid #e0e0e0;padding:4px 8px;vertical-align:top;color:inherit";
const TH_EXTRA = "font-weight:600;background:#f5f5f5";
const BLOCK_EQ_WRAP = "text-align:center;margin:0.75em 0";
const IMG_BLOCK = "max-width:100%;height:auto";

const INLINE_MIN_EM = 0.92;
const INLINE_MAX_EM = 2.4;
const INLINE_PAD_X = 4;
const INLINE_PAD_TOP = 16;
const INLINE_PAD_BOTTOM = 0;
const INLINE_TRIM_TOP_PX = 1;
const INLINE_TRIM_SIDE_PX = 1;
const INLINE_TRIM_BOTTOM_PX = 0;
const INLINE_RASTER_SCALE = 1.6;
const BLOCK_PAD_X = 14;
const BLOCK_PAD_TOP = 4;
const BLOCK_PAD_BOTTOM = 4;
const BLOCK_RASTER_SCALE = 3.5;
const BLOCK_EQ_RENDER_SCALE = 0.6;
const BLOCK_EQ_DOCS_TARGET_SCALE = 2;
const BLOCK_EQ_SCALE = 0.4;
const BLOCK_TRIM_TOP_PX = 4;
const BLOCK_TRIM_SIDE_PX = 4;
const BLOCK_TRIM_BOTTOM_PX = 4;

function escapeHtml(s: any): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s: any): string {
  return escapeHtml(s).replace(/\n/g, " ");
}

function safeLanguageClass(lang: string): string {
  const s = String(lang || "")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return s;
}

function toRomanNumeral(n: number): string {
  const vals = [10, 9, 5, 4, 1];
  const syms = ["x", "ix", "v", "iv", "i"];
  let r = "";
  let x = n;
  for (let i = 0; i < vals.length; i++) {
    while (x >= vals[i]) {
      r += syms[i];
      x -= vals[i];
    }
  }
  return r;
}

function getNumberedMarker(indent: number, counter: number): string {
  if (indent === 0) return `${counter}.`;
  if (indent === 1)
    return `${String.fromCharCode(96 + (((counter - 1) % 26) + 1))}.`;
  return `${toRomanNumeral(counter)}.`;
}

async function loadSvgRasterSource(
  svgMarkup: string,
  deadlineMs: number,
): Promise<any> {
  assertWithinBudget(deadlineMs);

  const blob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });

  if (typeof createImageBitmap === "function") {
    try {
      const remaining = Math.max(
        RENDER_TIMEOUT_FLOOR_MS,
        deadlineMs - performance.now(),
      );
      return await Promise.race([
        createImageBitmap(blob),
        timeoutPromise(remaining, "Timed out while decoding SVG bitmap"),
      ]);
    } catch (_) {
      // Fall through to Image() path.
    }
  }

  const objectUrl = URL.createObjectURL(blob);
  try {
    const remaining = Math.max(
      RENDER_TIMEOUT_FLOOR_MS,
      deadlineMs - performance.now(),
    );
    return await Promise.race([
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Failed to load SVG image"));
        img.src = objectUrl;
      }),
      timeoutPromise(remaining, "Timed out while loading SVG image"),
    ]);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function rasterizeSvgToCanvas(
  svgMarkup: string,
  options: {
    drawWidth: number;
    drawHeight: number;
    canvasWidth: number;
    canvasHeight: number;
    offsetX: number;
    offsetY: number;
    rasterScale: number;
  },
  deadlineMs: number,
): Promise<any> {
  const source = await loadSvgRasterSource(svgMarkup, deadlineMs);
  assertWithinBudget(deadlineMs);

  const {
    drawWidth,
    drawHeight,
    canvasWidth,
    canvasHeight,
    offsetX,
    offsetY,
    rasterScale,
  } = options;

  if (typeof OffscreenCanvas !== "undefined") {
    const canvas = new OffscreenCanvas(
      Math.max(1, Math.ceil(canvasWidth * rasterScale)),
      Math.max(1, Math.ceil(canvasHeight * rasterScale)),
    );
    const ctx = canvas.getContext("2d", { alpha: false }) as any;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(rasterScale, rasterScale);
    ctx.drawImage(source, offsetX, offsetY, drawWidth, drawHeight);
    return canvas;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(canvasWidth * rasterScale));
  canvas.height = Math.max(1, Math.ceil(canvasHeight * rasterScale));
  const ctx = canvas.getContext("2d", { alpha: false })!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.scale(rasterScale, rasterScale);
  ctx.drawImage(source, offsetX, offsetY, drawWidth, drawHeight);
  return canvas;
}

function getCanvasTrimBounds(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): { top: number; bottom: number; left: number; right: number } | null {
  const { data } = ctx.getImageData(0, 0, width, height);
  let top = height;
  let bottom = -1;
  let left = width;
  let right = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = (y * width + x) * 4;
      const alpha = data[idx + 3];
      if (alpha === 0) continue;

      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      if (r > 252 && g > 252 && b > 252) continue;

      if (y < top) top = y;
      if (y > bottom) bottom = y;
      if (x < left) left = x;
      if (x > right) right = x;
    }
  }

  if (bottom < top || right < left) {
    return null;
  }

  return { top, bottom, left, right };
}

function cropCanvasWithBounds(
  canvas: any,
  bounds: { top: number; bottom: number; left: number; right: number },
  trimPadding: { top?: number; right?: number; bottom?: number; left?: number },
): any {
  const cropLeft = Math.max(0, bounds.left - (trimPadding.left || 0));
  const cropTop = Math.max(0, bounds.top - (trimPadding.top || 0));
  const cropRight = Math.min(
    canvas.width - 1,
    bounds.right + (trimPadding.right || 0),
  );
  const cropBottom = Math.min(
    canvas.height - 1,
    bounds.bottom + (trimPadding.bottom || 0),
  );
  const cropWidth = Math.max(1, cropRight - cropLeft + 1);
  const cropHeight = Math.max(1, cropBottom - cropTop + 1);

  if (
    cropLeft === 0 &&
    cropTop === 0 &&
    cropWidth === canvas.width &&
    cropHeight === canvas.height
  ) {
    return canvas;
  }

  const croppedCanvas = document.createElement("canvas");
  croppedCanvas.width = cropWidth;
  croppedCanvas.height = cropHeight;
  const croppedCtx = croppedCanvas.getContext("2d")!;
  croppedCtx.drawImage(
    canvas,
    cropLeft,
    cropTop,
    cropWidth,
    cropHeight,
    0,
    0,
    cropWidth,
    cropHeight,
  );
  return croppedCanvas;
}

function cropInlineMathCanvas(canvas: any): any {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return canvas;

  const bounds = getCanvasTrimBounds(ctx, canvas.width, canvas.height);
  if (!bounds) return canvas;

  return cropCanvasWithBounds(canvas, bounds, {
    top: INLINE_TRIM_TOP_PX,
    right: INLINE_TRIM_SIDE_PX,
    bottom: INLINE_TRIM_BOTTOM_PX,
    left: INLINE_TRIM_SIDE_PX,
  });
}

function cropBlockMathCanvas(canvas: any): any {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return canvas;

  const bounds = getCanvasTrimBounds(ctx, canvas.width, canvas.height);
  if (!bounds) return canvas;

  return cropCanvasWithBounds(canvas, bounds, {
    top: BLOCK_TRIM_TOP_PX,
    right: BLOCK_TRIM_SIDE_PX,
    bottom: BLOCK_TRIM_BOTTOM_PX,
    left: BLOCK_TRIM_SIDE_PX,
  });
}

async function canvasToDataUrl(canvas: any): Promise<string> {
  if (typeof canvas.convertToBlob === "function") {
    const blob = await canvas.convertToBlob({ type: "image/png" });
    return dataUrlFromBlob(blob);
  }
  return canvas.toDataURL("image/png");
}

function inlineMathStyleFromAsset(asset: any): string {
  const rasterHeight = Math.max(
    1,
    asset.rasterHeight ||
      asset.height ||
      asset.displayHeight ||
      asset.contentHeight,
  );
  const rasterWidth = Math.max(
    1,
    asset.rasterWidth ||
      asset.width ||
      asset.displayWidth ||
      asset.contentWidth,
  );
  const heightEm = clamp(
    rasterHeight / INLINE_BASE_FONT_PX,
    INLINE_MIN_EM,
    INLINE_MAX_EM,
  );
  const widthEm = heightEm * (rasterWidth / rasterHeight);
  const verticalAlign = asset.inlineBaselineOffsetEm
    ? `${asset.inlineBaselineOffsetEm.toFixed(3)}em`
    : `-${clamp(0.22 + Math.max(0, heightEm - 1) * 0.22, 0.22, 0.5).toFixed(3)}em`;

  return [
    "display:inline-block",
    `height:${heightEm.toFixed(3)}em`,
    `width:${widthEm.toFixed(3)}em`,
    "max-width:none",
    "overflow:visible",
    `vertical-align:${verticalAlign}`,
    "margin:0 0.08em",
    "object-fit:contain",
    "line-height:0",
  ].join(";");
}

function blockMathStyleFromAsset(asset: any): string {
  const logicalWidth = Math.max(
    1,
    asset.logicalWidth ||
      asset.rasterWidth ||
      asset.width ||
      asset.displayWidth ||
      asset.contentWidth,
  );
  const widthPx = Math.min(BLOCK_EQ_MAX_WIDTH, logicalWidth * BLOCK_EQ_SCALE);

  return [
    "display:block",
    `width:${Math.round(widthPx)}px`,
    "height:auto",
    "max-width:100%",
    "margin:0 auto",
    "object-fit:contain",
  ].join(";");
}

function blockMathDimensionAttrsFromAsset(asset: any): string {
  const logicalWidth = Math.max(
    1,
    asset.logicalWidth ||
      asset.rasterWidth ||
      asset.width ||
      asset.displayWidth ||
      asset.contentWidth,
  );
  const logicalHeight = Math.max(
    1,
    asset.logicalHeight ||
      asset.rasterHeight ||
      asset.height ||
      asset.displayHeight ||
      asset.contentHeight,
  );
  const width = Math.round(logicalWidth * BLOCK_EQ_DOCS_TARGET_SCALE);
  const height = Math.round(logicalHeight * BLOCK_EQ_DOCS_TARGET_SCALE);
  return ` width="${width}" height="${height}"`;
}

function getInlineMathFallback(latex: string): string {
  return `<span class="cam-math-fallback">${escapeHtml(`$${latex}$`)}</span>`;
}

function getBlockMathFallback(latex: string): string {
  return `<pre style="${escapeAttr(PRE_STYLE)}">${escapeHtml(`$$\n${latex}\n$$`)}</pre>`;
}

async function renderMathToPngAsset(
  latex: string,
  displayMode: boolean,
  sanitizeLatex: (s: string) => string,
  deadlineMs: number,
): Promise<any> {
  assertWithinBudget(deadlineMs);
  const MathJax = await ensureMathJaxSvg();
  assertWithinBudget(deadlineMs);

  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "-20000px";
  host.style.top = "0";
  host.style.padding = "0";
  host.style.margin = "0";
  host.style.background = "#ffffff";
  host.style.color = "#000000";
  host.style.display = "inline-block";
  host.style.lineHeight = "normal";
  host.style.maxWidth = "none";
  host.style.boxSizing = "border-box";
  host.style.opacity = "1";
  host.style.filter = "none";
  host.style.textShadow = "none";
  host.style.whiteSpace = displayMode ? "normal" : "nowrap";
  host.style.fontSize = `${INLINE_BASE_FONT_PX}px`;

  document.body.appendChild(host);
  try {
    const remaining = Math.max(
      RENDER_TIMEOUT_FLOOR_MS,
      deadlineMs - performance.now(),
    );
    const node = await Promise.race([
      MathJax.tex2svgPromise(sanitizeLatex(latex), {
        display: displayMode,
        em: INLINE_BASE_FONT_PX,
        ex: 8,
        containerWidth: BLOCK_EQ_MAX_WIDTH,
      }),
      timeoutPromise(remaining, "Timed out while typesetting MathJax SVG"),
    ]);

    host.replaceChildren(node);
    const container =
      host.querySelector("mjx-container") || host.firstElementChild || host;
    const svgEl = container.querySelector("svg") || container;
    if (!(svgEl instanceof SVGElement)) {
      throw new Error("MathJax SVG output missing");
    }

    (container as HTMLElement).style.color = "#000000";
    const computedVerticalAlign =
      getComputedStyle(container as Element).verticalAlign ||
      (container as HTMLElement).style.verticalAlign ||
      "";
    const rect = (container as Element).getBoundingClientRect();
    const contentWidth = Math.max(1, Math.ceil(rect.width));
    const contentHeight = Math.max(1, Math.ceil(rect.height));

    const displayScale = displayMode
      ? Math.min(1, BLOCK_EQ_MAX_WIDTH / Math.max(1, contentWidth)) *
        BLOCK_EQ_RENDER_SCALE
      : 1;

    const displayWidth = Math.max(1, Math.round(contentWidth * displayScale));
    const displayHeight = Math.max(1, Math.round(contentHeight * displayScale));
    const padX = displayMode ? BLOCK_PAD_X : INLINE_PAD_X;
    const padTop = displayMode ? BLOCK_PAD_TOP : INLINE_PAD_TOP;
    const padBottom = displayMode ? BLOCK_PAD_BOTTOM : INLINE_PAD_BOTTOM;
    const rasterScale = displayMode ? BLOCK_RASTER_SCALE : INLINE_RASTER_SCALE;

    const clonedSvg = stripSvgMarkup(svgEl);
    const serializedWidth = Math.max(1, contentWidth);
    const serializedHeight = Math.max(1, contentHeight);
    clonedSvg.setAttribute("width", String(serializedWidth));
    clonedSvg.setAttribute("height", String(serializedHeight));
    if (!clonedSvg.getAttribute("viewBox")) {
      clonedSvg.setAttribute(
        "viewBox",
        `0 0 ${serializedWidth} ${serializedHeight}`,
      );
    }
    const svgMarkup = new XMLSerializer().serializeToString(clonedSvg);

    const rasterWidth = displayWidth + padX * 2;
    const rasterHeight = displayHeight + padTop + padBottom;
    let dataUrl: string;
    let finalLogicalWidth = rasterWidth;
    let finalLogicalHeight = rasterHeight;
    let finalBitmapWidth = Math.max(1, Math.ceil(rasterWidth * rasterScale));
    let finalBitmapHeight = Math.max(1, Math.ceil(rasterHeight * rasterScale));

    if (!displayMode) {
      const source = await loadSvgRasterSource(svgMarkup, deadlineMs);
      assertWithinBudget(deadlineMs);
      const inlineCanvas = document.createElement("canvas");
      inlineCanvas.width = Math.max(1, Math.ceil(rasterWidth * rasterScale));
      inlineCanvas.height = Math.max(1, Math.ceil(rasterHeight * rasterScale));
      const inlineCtx = inlineCanvas.getContext("2d");
      if (!inlineCtx) {
        throw new Error("Failed to get canvas context for inline math raster");
      }
      inlineCtx.fillStyle = "#ffffff";
      inlineCtx.fillRect(0, 0, inlineCanvas.width, inlineCanvas.height);
      inlineCtx.scale(rasterScale, rasterScale);
      inlineCtx.drawImage(source, padX, padTop, displayWidth, displayHeight);

      const croppedCanvas = cropInlineMathCanvas(inlineCanvas);
      finalBitmapWidth = croppedCanvas.width;
      finalBitmapHeight = croppedCanvas.height;
      finalLogicalWidth = croppedCanvas.width / rasterScale;
      finalLogicalHeight = croppedCanvas.height / rasterScale;
      dataUrl = await canvasToDataUrl(croppedCanvas);
    } else {
      const blockCanvas = await rasterizeSvgToCanvas(
        svgMarkup,
        {
          drawWidth: displayWidth,
          drawHeight: displayHeight,
          canvasWidth: rasterWidth,
          canvasHeight: rasterHeight,
          offsetX: padX,
          offsetY: padTop,
          rasterScale,
        },
        deadlineMs,
      );
      const croppedCanvas = cropBlockMathCanvas(blockCanvas);
      finalBitmapWidth = croppedCanvas.width;
      finalBitmapHeight = croppedCanvas.height;
      finalLogicalWidth = croppedCanvas.width / rasterScale;
      finalLogicalHeight = croppedCanvas.height / rasterScale;
      dataUrl = await canvasToDataUrl(croppedCanvas);
    }

    let inlineBaselineOffsetEm: number | null = null;
    if (!displayMode) {
      const scaledVerticalAlign = computedVerticalAlign
        ? scaleCssLength(computedVerticalAlign, displayScale)
        : null;
      if (
        scaledVerticalAlign &&
        /^-?\d*\.?\d+em$/i.test(scaledVerticalAlign)
      ) {
        inlineBaselineOffsetEm = clamp(
          parseFloat(scaledVerticalAlign),
          -0.42,
          -0.22,
        );
      } else {
        const fallbackPx = 4.5;
        inlineBaselineOffsetEm = -(fallbackPx / INLINE_BASE_FONT_PX);
      }
    }

    return {
      dataUrl,
      width: finalLogicalWidth,
      height: finalLogicalHeight,
      contentWidth,
      contentHeight,
      displayWidth,
      displayHeight,
      rasterWidth: finalLogicalWidth,
      rasterHeight: finalLogicalHeight,
      logicalWidth: finalLogicalWidth,
      logicalHeight: finalLogicalHeight,
      bitmapWidth: finalBitmapWidth,
      bitmapHeight: finalBitmapHeight,
      inlineBaselineOffsetEm,
    };
  } finally {
    host.remove();
  }
}

async function preRenderMathAssets(
  blocks: any[],
  getBlockData: (block: any) => any,
  sanitizeLatex: (s: string) => string,
): Promise<{ enabled: boolean; assets: Map<string, any> }> {
  const requests = collectMathRequests(blocks, getBlockData);
  if (requests.size === 0) {
    return { enabled: false, assets: new Map() };
  }

  const deadlineMs = performance.now() + RENDER_BUDGET_MS;
  const assets = new Map<string, any>();

  for (const { latex, displayMode } of requests.values()) {
    assertWithinBudget(deadlineMs);
    const renderLatex = getHtmlRenderLatex(latex, displayMode, sanitizeLatex);
    const key = `${displayMode ? "block" : "inline"}\0${renderLatex}`;
    if (assets.has(key)) continue;
    const asset = await renderMathToPngAsset(
      renderLatex,
      displayMode,
      sanitizeLatex,
      deadlineMs,
    );
    assets.set(key, asset);
  }

  return { enabled: true, assets };
}

async function richTitleArrayToHtml(titleArray: any[], ctx: any): Promise<string> {
  if (!Array.isArray(titleArray)) return "";

  const parts: string[] = [];
  for (const segment of titleArray) {
    if (!Array.isArray(segment)) continue;
    const [text, annotations] = segment;

    if (text === "⁍" && annotations) {
      const eq = annotations.find((a: any) => a[0] === "e");
      if (eq) {
        const latex = ctx.sanitizeLatex(eq[1]);
        if (ctx.mathEnabled) {
          const asset = ctx.mathAsset(latex, false);
          if (!asset) {
            throw new Error("Missing inline math asset");
          }
          parts.push(
            `<img class="cam-inline-math" src="${escapeAttr(asset.dataUrl)}" alt="${escapeAttr(latex)}" data-latex="${encodeURIComponent(latex)}" style="${escapeAttr(inlineMathStyleFromAsset(asset))}" />`,
          );
        } else {
          parts.push(getInlineMathFallback(latex));
        }
        continue;
      }
    }

    let result = escapeHtml(text || "");
    let bold = false;
    let italic = false;
    let code = false;
    let link: string | null = null;
    if (annotations && Array.isArray(annotations)) {
      for (const ann of annotations) {
        if (ann[0] === "b") bold = true;
        if (ann[0] === "i") italic = true;
        if (ann[0] === "c") code = true;
        if (ann[0] === "a") link = ann[1];
      }
    }
    if (code)
      result = `<code style="${escapeAttr(CODE_INLINE_STYLE)}">${result}</code>`;
    if (bold) result = `<strong>${result}</strong>`;
    if (italic) result = `<em>${result}</em>`;
    if (link) result = `<a href="${escapeAttr(link)}">${result}</a>`;
    parts.push(result);
  }

  return parts.join("");
}

async function tableCellToHtml(cellText: any, ctx: any): Promise<string> {
  const rich = normalizeTableCellRichText(cellText);
  return richTitleArrayToHtml(rich, ctx);
}

function listRunEndIndex(
  blocks: any[],
  getBlockData: (block: any) => any,
  startIdx: number,
  listType: string,
): number {
  let j = startIdx;
  while (j < blocks.length && getBlockData(blocks[j]).type === listType) {
    j++;
  }
  return j;
}

export async function buildClipboardHtmlFromBlocks(
  blocks: any[],
  getBlockData: (block: any) => any,
  sanitizeLatex: (s: string) => string,
): Promise<string | null> {
  if (!Array.isArray(blocks) || blocks.length === 0) return null;

  let mathEnabled = false;
  let assets = new Map<string, any>();
  try {
    const rendered = await preRenderMathAssets(
      blocks,
      getBlockData,
      sanitizeLatex,
    );
    mathEnabled = rendered.enabled;
    assets = rendered.assets;
  } catch (error) {
    console.warn(
      "[Copy Anywhere] PNG math render bailed out, falling back to text math:",
      error,
    );
    mathEnabled = false;
    assets = new Map();
  }

  const ctx = {
    sanitizeLatex,
    mathEnabled,
    mathAsset(latex: string, displayMode: boolean) {
      const key = `${displayMode ? "block" : "inline"}\0${getHtmlRenderLatex(latex, displayMode, sanitizeLatex)}`;
      return assets.get(key) || null;
    },
  };

  const out: string[] = [];
  let numCounters = [0, 0, 0];

  for (let i = 0; i < blocks.length; i++) {
    const data = getBlockData(blocks[i]);

    if (data.type === "bulleted_list") {
      const end = listRunEndIndex(blocks, getBlockData, i, "bulleted_list");
      const items: string[] = [];
      for (let k = i; k < end; k++) {
        const d = getBlockData(blocks[k]);
        const indent = d.indent || 0;
        const prefix = indent * 20;
        const md = await richTitleArrayToHtml(d.title, ctx);
        items.push(
          `<li style="${escapeAttr(LI_BULLET)};margin-left:${prefix}px">${md || "<br>"}</li>`,
        );
        numCounters = [0, 0, 0];
      }
      out.push(
        `<ul style="${escapeAttr(UL_WRAP)}">${items.join("\n")}</ul>`,
      );
      i = end - 1;
      continue;
    }

    if (data.type === "numbered_list") {
      const end = listRunEndIndex(blocks, getBlockData, i, "numbered_list");
      const items: string[] = [];
      for (let k = i; k < end; k++) {
        const d = getBlockData(blocks[k]);
        const indent = d.indent || 0;
        for (let depth = indent + 1; depth < 3; depth++)
          numCounters[depth] = 0;
        numCounters[indent]++;
        const prefix = indent * 20;
        const marker = getNumberedMarker(indent, numCounters[indent]);
        const md = await richTitleArrayToHtml(d.title, ctx);
        items.push(
          `<li style="${escapeAttr(LI_NUM)};margin-left:${prefix}px"><span style="${escapeAttr(NUM_MARKER)}">${escapeHtml(marker)}</span>${md || "<br>"}</li>`,
        );
      }
      out.push(
        `<ol style="${escapeAttr(OL_WRAP)}">${items.join("\n")}</ol>`,
      );
      i = end - 1;
      continue;
    }

    const md = await richTitleArrayToHtml(data.title, ctx);

    switch (data.type) {
      case "header":
        out.push(
          `<h1 style="${escapeAttr(H1_STYLE)}">${md || "<br>"}</h1>`,
        );
        numCounters = [0, 0, 0];
        break;
      case "sub_header":
        out.push(
          `<h2 style="${escapeAttr(H2_STYLE)}">${md || "<br>"}</h2>`,
        );
        numCounters = [0, 0, 0];
        break;
      case "sub_sub_header":
        out.push(
          `<h3 style="${escapeAttr(H3_STYLE)}">${md || "<br>"}</h3>`,
        );
        numCounters = [0, 0, 0];
        break;
      case "equation": {
        const latex = data.title?.[0]?.[0] || "";
        const htmlLatex = getHtmlRenderLatex(latex, true, sanitizeLatex);
        if (!latex) {
          out.push(
            `<p style="${escapeAttr(P_STYLE)}"><em>(empty equation)</em></p>`,
          );
        } else if (ctx.mathEnabled) {
          const asset = ctx.mathAsset(latex, true);
          if (!asset) {
            out.push(getBlockMathFallback(latex));
          } else {
            out.push(
              `<div class="cam-block-equation" style="${escapeAttr(BLOCK_EQ_WRAP)}"><img src="${escapeAttr(asset.dataUrl)}" alt="${escapeAttr(htmlLatex)}" data-latex="${encodeURIComponent(htmlLatex)}"${blockMathDimensionAttrsFromAsset(asset)} style="${escapeAttr(blockMathStyleFromAsset(asset))}" /></div>`,
            );
          }
        } else {
          out.push(getBlockMathFallback(latex));
        }
        numCounters = [0, 0, 0];
        break;
      }
      case "code": {
        const langRaw =
          data.language && data.language !== "plain text"
            ? safeLanguageClass(data.language)
            : "";
        const langAttr = langRaw
          ? ` class="language-${escapeAttr(langRaw)}"`
          : "";
        const body = escapeHtml(data.title?.[0]?.[0] || "");
        out.push(
          `<pre style="${escapeAttr(PRE_STYLE)}"><code${langAttr}>${body}</code></pre>`,
        );
        numCounters = [0, 0, 0];
        break;
      }
      case "quote":
        out.push(
          `<blockquote style="${escapeAttr(BLOCKQUOTE_STYLE)}">${md || "<br>"}</blockquote>`,
        );
        numCounters = [0, 0, 0];
        break;
      case "divider":
        out.push(`<hr style="${escapeAttr(HR_STYLE)}" />`);
        numCounters = [0, 0, 0];
        break;
      case "table": {
        const td = data.table_data;
        if (td && td.rows && td.rows.length > 0) {
          const startIdx = td.hasHeader ? 1 : 0;
          let thead = "";
          const bodyRows: string[] = [];

          if (td.hasHeader && td.rows[0]) {
            const cells: string[] = [];
            for (const cell of td.rows[0]) {
              cells.push(
                `<th style="${escapeAttr(TH_TD)};${TH_EXTRA}">${await tableCellToHtml(cell, ctx)}</th>`,
              );
            }
            thead = `<thead><tr>${cells.join("")}</tr></thead>`;
          }

          for (let r = startIdx; r < td.rows.length; r++) {
            const cells: string[] = [];
            for (const cell of td.rows[r]) {
              cells.push(
                `<td style="${escapeAttr(TH_TD)}">${await tableCellToHtml(cell, ctx)}</td>`,
              );
            }
            bodyRows.push(`<tr>${cells.join("")}</tr>`);
          }

          out.push(
            `<table style="${escapeAttr(TABLE_STYLE)}">${thead}<tbody>${bodyRows.join("")}</tbody></table>`,
          );
        }
        numCounters = [0, 0, 0];
        break;
      }
      case "image": {
        const imgUrl = data.source?.[0]?.[0] || "";
        if (imgUrl) {
          out.push(
            `<p style="${escapeAttr(P_STYLE)}"><img src="${escapeAttr(imgUrl)}" alt="image" style="${escapeAttr(IMG_BLOCK)}" /></p>`,
          );
        }
        numCounters = [0, 0, 0];
        break;
      }
      default:
        out.push(
          `<p style="${escapeAttr(P_STYLE)}">${md || "<br>"}</p>`,
        );
        numCounters = [0, 0, 0];
        break;
    }
  }

  const bodyInner = out.join("\n");
  return `<div class="copy-anywhere-html-root" style="${escapeAttr(ROOT_STYLE)}">${bodyInner}</div>`;
}
