import type { Metadata } from "next";
import { FORMATS, buildFormatMetadata } from "@/lib/config/models";
import { FormatLandingPage } from "@/components/FormatLandingPage";

const f = FORMATS.notion;

export const metadata: Metadata = buildFormatMetadata(f.label, f.seo, "/notion");

export default function NotionPage() {
  return (
    <FormatLandingPage
      formatSlug="notion"
      displayName={f.label}
      logo={f.logo}
      canonicalPath="/notion"
      howTo={{
        name: "How to paste anything into Notion with formatting",
        description: "Convert any content into native Notion blocks with math, code, and tables preserved.",
        steps: [
          { name: "Copy your content", text: "Select and copy content from any website, AI chat, PDF, or image." },
          { name: "Paste into Copy Anywhere", text: "Paste or drop your content into the converter on this page." },
          { name: "Copy to Notion", text: "Click the 'Copy to Notion' button to copy the formatted blocks." },
          { name: "Paste into Notion", text: "Press Cmd+V (or Ctrl+V) in Notion. Your content appears with all formatting intact." },
        ],
      }}
      headerDescription={`Paste from any website, drop a PDF, or drop an image. Math, code, and tables land perfectly in ${f.label}.`}
      faqItems={[
        {
          q: "How do I paste into Notion and keep my formatting?",
          a: "Copy your content with Copy Anywhere, then press Cmd+V (or Ctrl+V) in Notion. Blocks, equations, code, and tables all transfer as native Notion blocks — no manual cleanup needed.",
        },
        {
          q: "Does this work with LaTeX equations?",
          a: "Yes. Both inline and block equations are converted to Notion's native equation blocks, which render with KaTeX inside Notion.",
        },
        {
          q: "Can I convert a PDF or screenshot into Notion blocks?",
          a: "Yes. Drop a PDF or image file and it's OCR'd using AI. Tables, math, and code blocks are all preserved in the resulting Notion blocks.",
        },
        {
          q: "What AI chats can I copy to Notion?",
          a: "ChatGPT, Claude, Gemini, Grok, and DeepSeek are all supported. It also works with any website — just copy the content and paste it here.",
        },
      ]}
    />
  );
}
