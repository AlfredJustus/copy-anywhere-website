# Parser Parity — Sync Guide

The `lib/parity/` directory contains browser-safe TypeScript mirrors of conversion logic from the Chrome extension (`copy-anywhere-main`). These files should stay as close to verbatim copies as possible so that updating the parser is a mechanical process.

## File Mapping

| Website file | Extension source | Notes |
|---|---|---|
| `htmlParser.ts` | `content.js` (lines ~1226–1810, `parseHtmlToBlocks`) | `globalThis.NF.*` helpers inlined as local functions |
| `blockFactory.ts` | `utils/blockFactory.js` | `globalThis.NF` dependency removed; inline fallbacks |
| `serialize.ts` | `content.js` (serialization section: `getBlockData`, `blocksToMarkdown`, `buildNotionPayload`) | Direct port, no environment-specific changes |
| `htmlClipboard.ts` | `utils/html-clipboard.js` | `chrome.runtime.getURL` replaced with CDN `<script>` loader for MathJax |

## How to Sync

When the parser is updated in the extension:

1. Copy the updated function(s) from the extension source.
2. Apply the documented minimal adaptations (listed below).
3. Add TypeScript type annotations (parameters + return types at minimum; `any` is acceptable for block structures).
4. Test with a paste in the web converter.

## Adaptation Points

These are the **only** intentional deviations from the extension source. Everything else should be verbatim.

### htmlParser.ts
- `globalThis.NF.isMathElement` → local `isMathElement` function
- `globalThis.NF.extractLatexFromMathElement` → local `extractLatexFromMathElement` function
- Other `NF.*` utilities → inlined at the top of the file

### blockFactory.ts
- `globalThis.NF.cleanLatexMatrix` → local no-op stub (`const cleanLatexMatrix = (s: string) => s`)

### serialize.ts
- No environment-specific changes. Direct port.

### htmlClipboard.ts
- `chrome.runtime.getURL(MATHJAX_BUNDLE_PATH)` → CDN script tag: `https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg-full.js`
- `import(...)` dynamic import → `document.createElement('script')` with `onload`/`onerror`
- `OffscreenCanvas` usage preserved (works in modern browsers)

## Last Sync

- **Date:** 2026-03-28
- **Extension version:** 1.0.0 (Chrome Web Store)
