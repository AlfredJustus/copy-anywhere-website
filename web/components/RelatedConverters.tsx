import Link from "next/link";
import { LogoIcon } from "@/components/LogoIcon";
import { MODELS, FORMATS, type FormatSlug, type ModelSlug } from "@/lib/config/models";

interface RelatedConvertersProps {
  formatSlug: FormatSlug;
  /** Current page type to exclude from recommendations */
  currentSource?: { type: "model"; slug: ModelSlug } | { type: "pdf" } | { type: "image" } | { type: "equation" };
}

const FORMAT_ROUTES: Record<FormatSlug, string> = {
  notion: "/notion",
  markdown: "/obsidian",
  "google-docs": "/google-docs",
  pdf: "/pdf-download",
};

const FORMAT_DISPLAY: Record<FormatSlug, string> = {
  notion: "Notion",
  markdown: "Obsidian",
  "google-docs": "Google Docs",
  pdf: "PDF",
};

export function RelatedConverters({ formatSlug, currentSource }: RelatedConvertersProps) {
  const displayName = FORMAT_DISPLAY[formatSlug];

  const links: { href: string; label: string; icon: React.ReactNode }[] = [];

  // Model-based converters
  for (const [slug, model] of Object.entries(MODELS)) {
    if (currentSource?.type === "model" && currentSource.slug === slug) continue;
    links.push({
      href: `/convert/${slug}/${formatSlug}`,
      label: `${model.label} to ${displayName}`,
      icon: <LogoIcon src={model.logo} alt="" size={16} shape="bare" />,
    });
  }

  // PDF converter (skip if current page is PDF or format is PDF)
  if (currentSource?.type !== "pdf" && formatSlug !== "pdf") {
    links.push({
      href: `/pdf/${formatSlug}`,
      label: `PDF to ${displayName}`,
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-primary"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>,
    });
  }

  // Image converter
  if (currentSource?.type !== "image") {
    links.push({
      href: `/image/${formatSlug}`,
      label: `Image to ${displayName}`,
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-primary"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>,
    });
  }

  // Equation converter (skip for PDF format)
  if (currentSource?.type !== "equation" && formatSlug !== "pdf") {
    links.push({
      href: `/equation/${formatSlug}`,
      label: `Equation to ${displayName}`,
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-primary"><path d="M18 7V4H6l6 8-6 8h12v-3" /></svg>,
    });
  }

  // All converters link
  const allRoute = FORMAT_ROUTES[formatSlug];

  if (links.length === 0) return null;

  return (
    <section className="flex flex-col gap-2 mt-2">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">
        More ways to paste into {displayName}
      </h2>
      <div className="flex flex-wrap gap-1.5">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="no-underline text-inherit inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-medium hover:bg-secondary/60 transition-colors"
          >
            {link.icon}
            {link.label}
          </Link>
        ))}
      </div>
      <Link
        href={allRoute}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors px-1 mt-1"
      >
        View all {displayName}{" "}converters &rarr;
      </Link>
    </section>
  );
}
