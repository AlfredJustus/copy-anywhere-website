import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service – Copy Anywhere",
  description:
    "Terms of Service for Copy Anywhere. Free online tool for converting and formatting content.",
  alternates: { canonical: "/terms" },
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

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10 flex flex-col gap-8">
      <header>
        <h1 className="page-title text-3xl">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: March 29, 2026
        </p>
      </header>

      <div className="flex flex-col gap-8 text-sm leading-relaxed text-muted-foreground">
        <Section title="1. Acceptance of Terms">
          <p>
            By accessing or using Copy Anywhere (&ldquo;the Service&rdquo;), you
            agree to be bound by these Terms of Service. If you do not agree,
            please do not use the Service.
          </p>
        </Section>

        <Section title="2. Description of Service">
          <p>
            Copy Anywhere is a free online tool that converts and formats
            content for use in Notion, Google Docs, Obsidian, and PDF. The
            Service includes a website and a Chrome extension.
          </p>
        </Section>

        <Section title="3. Acceptable Use">
          <p>You agree not to:</p>
          <ul className="list-disc list-inside flex flex-col gap-1.5 pl-1">
            <li>
              Use the Service to process content you do not have the right to
              use or distribute
            </li>
            <li>
              Attempt to circumvent rate limits or abuse the Service
              infrastructure
            </li>
            <li>
              Use automated tools to scrape or overload the Service
            </li>
            <li>
              Reverse engineer, decompile, or attempt to extract the source
              code of the Service (beyond what is publicly available)
            </li>
          </ul>
        </Section>

        <Section title="4. Rate Limits">
          <p>
            Free usage of OCR-powered features is subject to daily limits: 2
            PDF conversions and 5 image conversions per device per day. These
            limits reset at midnight UTC. We reserve the right to adjust these
            limits at any time.
          </p>
        </Section>

        <Section title="5. Content and Privacy">
          <p>
            Content you paste or upload is processed in your browser whenever
            possible. OCR features require server-side processing via
            third-party services. We do not store your content after processing
            is complete. For full details, see our{" "}
            <a href="/privacy" className="underline hover:text-foreground">
              Privacy Policy
            </a>
            .
          </p>
        </Section>

        <Section title="6. Third-Party Services">
          <p>
            The Service relies on third-party infrastructure including Supabase
            (OCR processing), texlive.net (PDF compilation), and the Notion
            API (page imports). We are not responsible for the availability,
            accuracy, or policies of these third-party services.
          </p>
        </Section>

        <Section title="7. Service Availability">
          <p>
            The Service is provided on an &ldquo;as is&rdquo; and &ldquo;as
            available&rdquo; basis. We do not guarantee uninterrupted or
            error-free operation. We reserve the right to modify, suspend, or
            discontinue the Service at any time without notice.
          </p>
        </Section>

        <Section title="8. Limitation of Liability">
          <p>
            To the fullest extent permitted by law, Copy Anywhere and its
            operators shall not be liable for any indirect, incidental,
            special, consequential, or punitive damages, or any loss of data,
            use, or profits, arising out of or related to your use of the
            Service.
          </p>
        </Section>

        <Section title="9. Changes to These Terms">
          <p>
            We may update these Terms from time to time. Continued use of the
            Service after changes constitutes acceptance of the revised Terms.
            We will update the &ldquo;Last updated&rdquo; date at the top of
            this page.
          </p>
        </Section>

        <Section title="10. Contact">
          <p>
            Questions about these Terms? Reach us at{" "}
            <span className="text-foreground">info(at)copy-anywhere.com</span>
            .
          </p>
        </Section>
      </div>
    </main>
  );
}
