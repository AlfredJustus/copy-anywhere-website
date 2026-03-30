import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy – Copy Anywhere",
  description:
    "How Copy Anywhere handles your data. No accounts, no tracking — your content stays in your browser.",
  alternates: { canonical: "/privacy" },
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="section-title text-xl">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Bullet({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3 items-start">
      <span className="mt-[9px] size-[5px] min-w-[5px] rounded-full bg-[var(--accent)]" />
      <span>
        <strong className="font-semibold">{label}</strong> — {children}
      </span>
    </li>
  );
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10 flex flex-col gap-10">
      {/* Title block */}
      <div className="flex flex-col gap-2">
        <h1 className="page-title text-3xl sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="text-sm text-muted-foreground">
          Last updated: 31 March 2026
        </p>
        <p className="text-[15px] leading-relaxed text-muted-foreground mt-1">
          Copy Anywhere converts content between formats for Notion, Markdown,
          Google Docs, and PDF. This policy explains what data we process, why,
          and your rights.
        </p>
      </div>

      {/* TLDR card */}
      <div className="rounded-xl border border-border bg-card px-5 py-4 shadow-card flex flex-col gap-2">
        <p className="text-sm font-semibold">The short version</p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          We don&apos;t have accounts and don&apos;t store your content. Most
          processing happens in your browser. We use cookies for rate limiting
          and analytics (with your consent).
        </p>
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-8">
        <Section title="Content you provide">
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            When you paste text, drop a PDF, upload an image, or enter a Notion
            URL, your content is processed as follows:
          </p>
          <ul className="flex flex-col gap-2.5 text-[15px] leading-relaxed">
            <Bullet label="Pasted text and clipboard data">
              processed entirely in your browser. Nothing is sent to our
              servers.
            </Bullet>
            <Bullet label="PDF and image uploads">
              page images are sent to our OCR service (hosted on Supabase) to
              extract text. The images are processed in memory and not stored.
            </Bullet>
            <Bullet label="PDF export">
              when you download content as PDF, the generated LaTeX source is
              sent to texlive.net for compilation. The source is not stored.
            </Bullet>
            <Bullet label="Notion page imports">
              the page ID from your URL is sent to the Notion API to retrieve
              publicly available content.
            </Bullet>
          </ul>
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            All conversion output remains in your browser until you explicitly
            copy or download it.
          </p>
        </Section>

        <hr className="border-border opacity-60" />

        <Section title="Cookies">
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            We use a single first-party cookie:
          </p>
          <div className="rounded-xl border border-border overflow-hidden text-sm">
            <div className="grid grid-cols-[auto_1fr_auto] bg-[var(--bg)] font-semibold">
              <span className="px-4 py-2.5 border-b border-r border-border">
                Name
              </span>
              <span className="px-4 py-2.5 border-b border-r border-border">
                Purpose
              </span>
              <span className="px-4 py-2.5 border-b border-border">
                Duration
              </span>
            </div>
            <div className="grid grid-cols-[auto_1fr_auto] border-b border-border">
              <span className="px-4 py-2.5 border-r border-border">
                <code className="text-xs bg-[var(--accent-light)] rounded px-1.5 py-0.5">
                  device_id
                </code>
              </span>
              <span className="px-4 py-2.5 border-r border-border text-muted-foreground">
                Rate limiting — caps usage at 2 PDFs and 5 images per day
              </span>
              <span className="px-4 py-2.5 text-muted-foreground">1 year</span>
            </div>
            <div className="grid grid-cols-[auto_1fr_auto]">
              <span className="px-4 py-2.5 border-r border-border">
                <code className="text-xs bg-[var(--accent-light)] rounded px-1.5 py-0.5">
                  _ga / _ga_*
                </code>
              </span>
              <span className="px-4 py-2.5 border-r border-border text-muted-foreground">
                Google Analytics — only set after you consent
              </span>
              <span className="px-4 py-2.5 text-muted-foreground">2 years</span>
            </div>
          </div>
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            This cookie contains a random identifier. It is not used for
            tracking or advertising and is not shared with third parties.
          </p>
        </Section>

        <hr className="border-border opacity-60" />

        <Section title="Analytics">
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            We use <strong className="font-semibold text-foreground">Google Analytics</strong> to
            understand how visitors use the site (page views, scrolls, outbound
            clicks). Analytics cookies are only set after you give consent via
            the cookie banner. You can withdraw consent at any time by clearing
            your browser cookies — analytics tracking will stop until you
            consent again.
          </p>
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            We also use <strong className="font-semibold text-foreground">Vercel Analytics</strong> for
            aggregated performance metrics. Vercel Analytics does not use
            cookies and does not collect personally identifiable information.
          </p>
        </Section>

        <hr className="border-border opacity-60" />

        <Section title="Third-party services">
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            The following services receive limited data during normal operation:
          </p>
          <ul className="flex flex-col gap-2.5 text-[15px] leading-relaxed">
            <Bullet label="Supabase">
              receives page images from uploaded PDFs and images for OCR
              processing.
            </Bullet>
            <Bullet label="texlive.net">
              receives LaTeX source when you export as PDF.
            </Bullet>
            <Bullet label="Notion API">
              receives page IDs when you import a public Notion page.
            </Bullet>
            <Bullet label="Google Analytics">
              receives anonymized usage data (page views, device type, country)
              when you consent to analytics cookies. See{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent)] underline underline-offset-2 decoration-[var(--accent)]/30 hover:decoration-[var(--accent)] transition-colors"
              >
                Google&apos;s Privacy Policy
              </a>
              .
            </Bullet>
            <Bullet label="Vercel Analytics">
              receives aggregated web vitals and page view counts. No cookies
              are used and no personally identifiable information is collected.
            </Bullet>
            <Bullet label="Google Fonts">
              loads typefaces used on this site. Your browser sends standard HTTP
              data (including your IP) to Google. See{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent)] underline underline-offset-2 decoration-[var(--accent)]/30 hover:decoration-[var(--accent)] transition-colors"
              >
                Google&apos;s Privacy Policy
              </a>
              .
            </Bullet>
            <Bullet label="unpkg CDN">
              serves the PDF.js library for in-browser PDF rendering.
            </Bullet>
          </ul>
        </Section>

        <hr className="border-border opacity-60" />

        <Section title="Data retention">
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            We do not store your content. Uploaded files and conversion results
            exist only in your browser session. The rate-limit counter associated
            with your{" "}
            <code className="text-xs bg-[var(--accent-light)] rounded px-1.5 py-0.5">
              device_id
            </code>{" "}
            cookie resets daily and is held in server memory, not a database.
          </p>
        </Section>

        <hr className="border-border opacity-60" />

        <Section title="Your rights">
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            Under the GDPR and other applicable data protection laws, you have
            the right to access, rectify, erase, restrict, or port your personal
            data, and to object to its processing. Because we do not store
            personal data beyond the{" "}
            <code className="text-xs bg-[var(--accent-light)] rounded px-1.5 py-0.5">
              device_id
            </code>{" "}
            cookie, exercising most of these rights is as simple as clearing your
            browser cookies. For questions or to exercise your rights, contact us
            below.
          </p>
        </Section>

        <hr className="border-border opacity-60" />

        <Section title="Children&apos;s privacy">
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            Copy Anywhere is not directed at children under 16. We do not
            knowingly collect personal data from children.
          </p>
        </Section>

        <hr className="border-border opacity-60" />

        <Section title="Changes to this policy">
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            We may update this policy from time to time. Material changes will be
            noted by updating the &quot;Last updated&quot; date at the top of
            this page.
          </p>
        </Section>

        <hr className="border-border opacity-60" />

        <Section title="Contact">
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            For privacy-related questions, reach us at{" "}
            <span className="text-[var(--accent)]">
              info(at)copy-anywhere.com
            </span>
            .
          </p>
        </Section>
      </div>
    </main>
  );
}
