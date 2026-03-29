# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Copy Anywhere Website — a Next.js web app that converts LLM output (pasted HTML/text, PDFs, images) into Notion blocks, Markdown, or Google Docs HTML. The conversion logic is mirrored from the Copy Anywhere Chrome extension.

## Commands

All commands run from `web/`:

```bash
npm run dev      # Dev server with Turbopack on localhost:3000
npm run build    # Production build
npm run lint     # ESLint (flat config, v9)
```

No test framework is configured.

## Architecture

### App Router Structure

- `/` — Home page with `UniversalTool` (paste, PDF upload, image upload)
- `/tools` — Browse all converters
- `/convert/[model]/[format]` — Model+format-specific converter (`ConverterApp`)
- `/pdf/[format]` — PDF converter pages
- `/image/[format]` — Image converter pages

Dynamic routes use `generateStaticParams()` for SSG. Models: chatgpt, claude, gemini, grok, deepseek. Formats: notion, markdown, google-docs.

### Conversion Pipeline

```
Input (paste HTML | PDF | image)
  → Parse to intermediate block structure
  → Render preview via NotionSeshPreview (KaTeX math, syntax highlighting, tables)
  → Copy as: Notion JSON (custom MIME), Markdown (text/plain), or Google Docs HTML (text/html)
```

- **Paste input**: `parseHtmlToBlocks()` or `parseMarkdownToBlocks()` (client-side)
- **PDF input**: pdfjs-dist extracts pages in-browser → OCR each page via Supabase edge function → parse markdown
- **Image input**: OCR via Supabase edge function → parse markdown
- Only OCR requires a server call; all other processing is client-side

### Parser Parity (`web/lib/parity/`)

These files are **verbatim mirrors** of the Chrome extension's conversion logic. See `web/lib/parity/SYNC.md` for the file mapping and the minimal adaptations made. When updating parsers, copy from the extension source and apply only the documented deviations.

### Key Components

- **UniversalTool** — Main converter on home; handles all three input types with multi-format copy
- **ConverterApp** — Simpler paste-only converter for format-specific pages
- **NotionSeshPreview** — Rich block renderer (math, code, tables, nested lists)
- **CopyActionBar** — Format-specific copy buttons with feedback

All interactive components are `"use client"`.

### Styling

Tailwind CSS v4 + shadcn/ui (base-nova style). Custom CSS variables and zone states (paste-zone, drop-zone) defined in `web/app/globals.css`. Uses CVA for component variants.

### External Services

- **Supabase edge function** for OCR (Gemini primary, Mathpix fallback) — URL and anon key in `web/lib/config/supabase.ts`
- **pdfjs-dist** worker loaded from unpkg CDN
- **MathJax** CDN for HTML clipboard rendering

## Important Notes

- **Next.js version**: This project uses Next.js 16 which has breaking changes from earlier versions. Read `node_modules/next/dist/docs/` before writing Next.js-specific code.
- **Path alias**: `@/*` maps to `web/*` root
- **Type conventions**: Model/format slugs are typed unions (`ModelSlug`, `FormatSlug`) with type guards in `web/lib/config/models.ts`
