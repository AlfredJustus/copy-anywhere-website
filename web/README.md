# Copy Anywhere Website

Website MVP for conversion tools based on Copy Anywhere parser logic and NotionSesh-style visual rendering.

## Included tools

- Universal LLM converter (`/convert/[model]`) for:
  - HTML/clipboard-like input -> Markdown
  - HTML/clipboard-like input -> Notion blocks JSON
- PDF to Notion (`/pdf-to-notion`):
  - Upload full PDF
  - Hard cap at 10 pages
  - OCR per page (Gemini first, Mathpix fallback)
  - Notion MIME copy + rendered preview

## Stack

- Next.js App Router + TypeScript
- KaTeX for math rendering
- pdfjs-dist for PDF page extraction in browser

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## OCR environment variables

Set these in `.env.local`:

- `VERTEX_TUNED_MODEL`
- `VERTEX_LOCATION` (optional, default `us-central1`)
- `GOOGLE_SERVICE_ACCOUNT_JSON`
- `MATHPIX_NAME`
- `MATHPIX_KEY`

If Gemini fails or is not configured, the API route falls back to Mathpix.
