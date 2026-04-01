import type { Metadata } from "next";
import Link from "next/link";
import { SharePageClient } from "./SharePageClient";
import { SITE_URL } from "@/lib/config/models";

const SUPABASE_URL = "https://cghzhnznfqjasjtimslq.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;

type Props = { params: Promise<{ id: string }> };

async function fetchShare(id: string) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/web_shares?id=eq.${encodeURIComponent(id)}&select=*`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      next: { revalidate: 60 },
    }
  );

  if (!res.ok) return null;

  const rows = await res.json();
  if (!rows || rows.length === 0) return null;
  return rows[0];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const share = await fetchShare(id);

  if (!share) {
    return { title: "Share Not Found – Copy Anywhere" };
  }

  const title = share.title
    ? `${share.title} – Shared via Copy Anywhere`
    : "Shared Content – Copy Anywhere";

  return {
    title,
    description: "Copy this formatted content to Notion, Obsidian, or Google Docs. Shared via Copy Anywhere.",
    openGraph: { title, url: `${SITE_URL}/s/${id}` },
    robots: { index: false },
  };
}

export default async function SharePage({ params }: Props) {
  const { id } = await params;
  const share = await fetchShare(id);

  // Not found
  if (!share) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-20 flex flex-col items-center text-center gap-4">
        <h1 className="text-2xl font-semibold">Share not found</h1>
        <p className="text-muted-foreground text-sm">
          This share link doesn&apos;t exist or has been removed.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 mt-4 px-6 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold transition-opacity hover:opacity-90"
        >
          Try Copy Anywhere
        </Link>
      </main>
    );
  }

  // Expired
  const isExpired = new Date(share.expires_at) < new Date();
  if (isExpired) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-20 flex flex-col items-center text-center gap-4">
        <h1 className="text-2xl font-semibold">This share has expired</h1>
        <p className="text-muted-foreground text-sm">
          Shared content expires after 7 days.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 mt-4 px-6 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold transition-opacity hover:opacity-90"
        >
          Try Copy Anywhere yourself
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10 flex flex-col gap-6">
      <header className="flex flex-col items-center text-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Shared via Copy Anywhere
        </p>
        {share.title && (
          <h1 className="text-2xl font-semibold">{share.title}</h1>
        )}
        <p className="text-sm text-muted-foreground">
          Math, code, and tables — ready to paste.
        </p>
      </header>

      <SharePageClient
        blocks={share.blocks_json}
        title={share.title}
      />

      {/* CTA */}
      <section className="text-center py-6 border-t border-border mt-2">
        <p className="text-base font-semibold text-foreground">
          Format your own content
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste from any website, drop a PDF, or drop an image. Math, code, and tables land perfectly.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 mt-4 px-6 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold transition-opacity hover:opacity-90"
        >
          Try Copy Anywhere
        </Link>
      </section>
    </main>
  );
}
