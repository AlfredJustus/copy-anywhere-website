"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

const GA_ID = "G-5SCH7TMB9W";

export function GoogleAnalytics() {
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    // Set default consent state (denied until user accepts)
    window.gtag?.("consent", "default", {
      analytics_storage: "denied",
    });

    const stored = localStorage.getItem("cookie-consent");
    if (stored === "granted") {
      setConsented(true);
      window.gtag?.("consent", "update", { analytics_storage: "granted" });
    }

    // Listen for consent changes from CookieBanner
    const handler = () => {
      const val = localStorage.getItem("cookie-consent");
      if (val === "granted") {
        setConsented(true);
        window.gtag?.("consent", "update", { analytics_storage: "granted" });
      }
    };
    window.addEventListener("cookie-consent-change", handler);
    return () => window.removeEventListener("cookie-consent-change", handler);
  }, []);

  if (!consented) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('consent', 'update', { analytics_storage: 'granted' });
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  );
}

// Type augmentation for gtag and custom event
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
  interface WindowEventMap {
    "cookie-consent-change": Event;
  }
}
