import { ConverterApp } from "@/components/ConverterApp";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
export default async function ModelConverterPage({
  params,
}: {
  params: Promise<{ model: string }>;
}) {
  const { model } = await params;
  if (model.toLowerCase() !== "chatgpt") redirect("/convert/chatgpt");

  return (
    <main className="mx-auto max-w-2xl px-6 py-10 flex flex-col gap-6">
      <header className="flex flex-col items-center text-center gap-3">
        <Link href="/" className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline">
          &larr; Back to tools
        </Link>
        <h1 className="font-serif text-3xl font-bold tracking-tight">
          ChatGPT to Notion
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
          The most accurate ChatGPT converter. Paste once, get perfect Notion blocks.
        </p>
        <div className="flex flex-wrap justify-center gap-1.5">
          <Badge variant="outline">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h6M4 17h6M14 4l6 16M16 20l-4-8" /></svg>
            Math &amp; LaTeX
          </Badge>
          <Badge variant="outline">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
            Code blocks
          </Badge>
          <Badge variant="outline">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M3 15h18" /><path d="M9 3v18" /></svg>
            Tables
          </Badge>
          <Badge variant="outline">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
            Rich text
          </Badge>
          <Badge variant="outline">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
            Nested lists
          </Badge>
        </div>
      </header>
      <ConverterApp />
    </main>
  );
}
