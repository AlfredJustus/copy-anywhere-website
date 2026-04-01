export const MODELS = {
  chatgpt: { label: "ChatGPT", logo: "/logos/openai.svg",
    seo: "ChatGPT conversations" },
  claude: { label: "Claude", logo: "/logos/claude.svg",
    seo: "Claude responses" },
  gemini: { label: "Gemini", logo: "/logos/gemini.svg",
    seo: "Gemini conversations" },
  grok: { label: "Grok", logo: "/logos/xai.svg",
    seo: "Grok conversations" },
  deepseek: { label: "DeepSeek", logo: "/logos/deepseek.svg",
    seo: "DeepSeek conversations" },
} as const;

export const FORMATS = {
  notion: { label: "Notion", logo: "/logos/notion-logo.svg",
    seo: "Notion blocks" },
  markdown: { label: "Markdown", logo: "/logos/obsidian-logo.svg",
    seo: "clean Markdown for Obsidian or any editor" },
  "google-docs": { label: "Google Docs", logo: "/logos/docs.svg",
    seo: "formatted Google Docs content" },
  pdf: { label: "PDF", logo: "/logos/pdf.svg",
    seo: "a clean, formatted PDF document" },
} as const;

export type ModelSlug = keyof typeof MODELS;
export type FormatSlug = keyof typeof FORMATS;

export function isValidModel(slug: string): slug is ModelSlug {
  return slug in MODELS;
}

export function isValidFormat(slug: string): slug is FormatSlug {
  return slug in FORMATS;
}

export const SITE_URL = "https://copy-anywhere.com";

export const CWS_LISTING_URL =
  "https://chromewebstore.google.com/detail/copy-anywhere-math-code-t/mkicjobmipolpogeimbgdhikjbiilked";
