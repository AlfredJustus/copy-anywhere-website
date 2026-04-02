import type { Metadata } from "next";
import { FORMATS, buildFormatMetadata } from "@/lib/config/models";
import { FormatLandingPage } from "@/components/FormatLandingPage";

const f = FORMATS.markdown;

export const metadata: Metadata = buildFormatMetadata("Obsidian", f.seo, "/obsidian");

export default function ObsidianPage() {
  return (
    <FormatLandingPage
      formatSlug="markdown"
      displayName="Obsidian"
      logo={f.logo}
      canonicalPath="/obsidian"
      howTo={{
        name: "How to paste anything into Obsidian with formatting",
        description: "Convert any content into clean Markdown with math, code, and tables preserved.",
        steps: [
          { name: "Copy your content", text: "Select and copy content from any website, AI chat, PDF, or image." },
          { name: "Paste into Copy Anywhere", text: "Paste or drop your content into the converter on this page." },
          { name: "Copy the Markdown", text: "Click the copy button to copy the formatted Markdown output." },
          { name: "Paste into Obsidian", text: "Press Cmd+V (or Ctrl+V) in Obsidian. Your content appears with all formatting intact." },
        ],
      }}
      headerDescription="Paste from any website, drop a PDF, or drop an image. Math, code, and tables land perfectly as clean Markdown."
      faqItems={[
        {
          q: "How do I get properly formatted Markdown from a website?",
          a: "Paste or drop content into Copy Anywhere, then copy the Markdown output. Headings, lists, code blocks, and LaTeX equations are all preserved in clean Markdown syntax.",
        },
        {
          q: "Are LaTeX equations preserved in the Markdown output?",
          a: "Yes. Inline equations use $...$ and block equations use $$...$$, which Obsidian and most Markdown renderers display natively.",
        },
        {
          q: "Can I convert a PDF to Markdown?",
          a: "Yes. Drop a PDF file and it's OCR'd into clean Markdown with equations, tables, and code blocks intact.",
        },
        {
          q: "Does it handle nested lists and complex tables?",
          a: "Yes. Lists are preserved up to 3 levels of nesting, and tables are converted to standard Markdown pipe syntax with header rows.",
        },
      ]}
    />
  );
}
