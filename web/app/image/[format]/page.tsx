import { ImageConverterTool } from "@/components/ImageConverterTool";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { LogoIcon } from "@/components/LogoIcon";
import {
  FORMATS, CWS_LISTING_URL, SITE_URL,
  isValidFormat,
  type FormatSlug,
} from "@/lib/config/models";
import { PageFAQ, type FAQItem } from "@/components/PageFAQ";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";
import { HowToSchema } from "@/components/HowToSchema";
import { RelatedConverters } from "@/components/RelatedConverters";
import type { Metadata } from "next";

type Props = { params: Promise<{ format: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { format } = await params;
  const formatSlug = format.toLowerCase();

  if (!isValidFormat(formatSlug)) {
    return { title: "Image Converter – Copy Anywhere" };
  }

  const f = FORMATS[formatSlug];

  const title = `Turn an Image into ${f.label} – Copy Anywhere`;
  const description = `Upload any image and convert it to ${f.seo} with OCR-powered accuracy. Math, code, tables, and formatting preserved. Free online tool.`;
  const url = `${SITE_URL}/image/${formatSlug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url },
  };
}

export function generateStaticParams() {
  return Object.keys(FORMATS).map((format) => ({ format }));
}

export default async function ImageFormatPage({ params }: Props) {
  const { format } = await params;
  const formatSlug = format.toLowerCase() as FormatSlug;

  if (!isValidFormat(formatSlug)) redirect("/image/notion");

  const f = FORMATS[formatSlug];

  const faqItems: FAQItem[] = [
    {
      q: `How does image to ${f.label} work?`,
      a: `Drop or select an image file (PNG, JPG, WEBP, and more). The image is OCR'd using AI to extract text, math, tables, and code, which are then converted to ${f.label} format.`,
    },
    {
      q: "How accurate is the OCR for equations?",
      a: "Very accurate for printed and typed equations. Handwritten math may have lower accuracy. You can check the preview before copying to verify the result.",
    },
    {
      q: "What image formats are supported?",
      a: "PNG, JPG, WEBP, GIF, BMP, and TIFF are all supported. The image is processed entirely in your browser before OCR.",
    },
  ];

  return (
    <main className="mx-auto max-w-2xl px-6 py-10 flex flex-col gap-6">
      <BreadcrumbSchema items={[
        { name: "Tools", href: "/tools" },
        { name: `Image to ${f.label}`, href: `/image/${formatSlug}` },
      ]} />
      <HowToSchema
        name={`How to convert an image to ${f.label}`}
        description={`Upload any image and convert it to ${f.label} with OCR-powered accuracy. Math, code, tables, and formatting preserved.`}
        steps={[
          { name: "Drop or select an image", text: "Drop an image file (PNG, JPG, WEBP) onto the converter or click to select one." },
          { name: "Wait for OCR", text: "The image is OCR-processed to extract text, math, tables, and code." },
          { name: `Copy to ${f.label}`, text: `Click 'Copy to ${f.label}' and paste the result into ${f.label}.` },
        ]}
      />
      {/* Header */}
      <header className="flex flex-col items-center text-center gap-3">
        <div className="flex items-center gap-3">
          <div className="size-10 flex items-center justify-center rounded-lg bg-secondary text-primary [&_svg]:size-6">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
            <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
          </svg>
          <LogoIcon src={f.logo} alt={f.label} size={40} shape="rounded"  />
        </div>

        <h1 className="page-title text-3xl">
          Turn an Image into {f.label}
        </h1>

        <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
          Upload any image and convert it to {f.seo} with OCR-powered accuracy. Math, tables, and formatting preserved.
        </p>

        <div className="flex flex-wrap justify-center gap-1.5">
          <Badge variant="outline">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>
            OCR powered
          </Badge>
          <Badge variant="outline">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 7V4H6l6 8-6 8h12v-3" /></svg>
            Math &amp; LaTeX
          </Badge>
          <Badge variant="outline">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M3 15h18" /><path d="M9 3v18" /></svg>
            Tables
          </Badge>
          <Badge variant="outline">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
            Code blocks
          </Badge>
          <Badge variant="outline">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
            PNG, JPG, WEBP
          </Badge>
        </div>

      </header>

      {/* Converter tool */}
      <ImageConverterTool formatSlug={formatSlug} />

      {/* SEO content */}
      <article className="flex flex-col gap-6 text-sm text-muted-foreground leading-relaxed mt-4">
        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">How it works</h2>
          <ol className="list-decimal list-inside flex flex-col gap-1.5">
            <li>Drop or select an image file (PNG, JPG, WEBP, and more)</li>
            <li>The image is OCR-processed to extract text, math, and tables</li>
            {formatSlug === "pdf"
              ? <li>Download your beautifully formatted PDF</li>
              : <li>Click &ldquo;{f.label}&rdquo; to copy, then paste into {f.label}</li>}
          </ol>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">What&apos;s supported</h2>
          <ul className="list-disc list-inside flex flex-col gap-1.5">
            <li>Math and LaTeX equations — {formatSlug === "pdf" ? "compiled natively by LaTeX" : `rendered perfectly in ${f.label}`}</li>
            <li>Code blocks with syntax highlighting</li>
            <li>Tables with headers and alignment</li>
            <li>Bold, italic, links, and structured text</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">Why use this</h2>
          <p>
            {formatSlug === "pdf"
              ? "Images lock content in a fixed format. Copy Anywhere uses OCR to extract text, math, and tables, then compiles everything with LaTeX for professional typesetting quality."
              : `Images lock content in a fixed format that doesn't paste cleanly into ${f.label}. Copy Anywhere uses OCR to extract and reformat everything — so your math, tables, and rich text look perfect inside ${f.label}.`}
          </p>
        </section>
      </article>

      <RelatedConverters formatSlug={formatSlug} currentSource={{ type: "image" }} />

      <PageFAQ items={faqItems} />

      {/* Extension CTA */}
      <section className="text-center py-6 border-t border-border mt-2">
        <p className="text-base font-semibold text-foreground">
          Works for AI chats too.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          ⌘C in ChatGPT or Claude. Paste into {f.label}. Already formatted.
        </p>
        <a
          href={CWS_LISTING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-4 px-6 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold transition-opacity hover:opacity-90"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="21.17" y1="8" x2="12" y2="8"/><line x1="3.95" y1="6.06" x2="8.54" y2="14"/><line x1="10.88" y1="21.94" x2="15.46" y2="14"/></svg>
          Get the Chrome Extension
        </a>
      </section>
    </main>
  );
}
