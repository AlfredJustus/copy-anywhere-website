import type { Metadata } from "next";
import { DM_Sans, Source_Serif_4 } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SITE_URL } from "@/lib/config/models";
import { SiteHeader } from "@/components/SiteHeader";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { CookieBanner } from "@/components/CookieBanner";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
});

const title = "Copy Anywhere – Perfect formatting, everywhere you paste";
const description =
  "The most accurate converters for Notion, Markdown, and Google Docs. Paste conversations from ChatGPT, Claude, Gemini, DeepSeek, or Grok — get perfectly formatted output with math, code, tables, and rich text.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description,
  openGraph: {
    title,
    description,
    url: SITE_URL,
    siteName: "Copy Anywhere",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Copy Anywhere",
  url: SITE_URL,
  description,
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${sourceSerif.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://unpkg.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var d=document.documentElement;var m=window.matchMedia('(prefers-color-scheme:dark)');if(m.matches)d.classList.add('dark');m.addEventListener('change',function(e){e.matches?d.classList.add('dark'):d.classList.remove('dark')})}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <SiteHeader />
        <div className="pt-14">
        {children}
        </div>
        <footer className="mx-auto max-w-2xl px-6 py-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-3">
          <a href="/extension" className="hover:text-foreground transition-colors">
            Chrome Extension
          </a>
          <span aria-hidden="true">·</span>
          <a href="/privacy" className="hover:text-foreground transition-colors">
            Privacy Policy
          </a>
          <span aria-hidden="true">·</span>
          <a href="/terms" className="hover:text-foreground transition-colors">
            Terms of Service
          </a>
        </footer>
        <GoogleAnalytics />
        <CookieBanner />
        <Analytics />
      </body>
    </html>
  );
}
