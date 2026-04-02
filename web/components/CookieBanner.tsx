"use client";

import { useEffect, useState } from "react";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("cookie-consent");
    if (!stored) setVisible(true);
  }, []);

  const respond = (choice: "granted" | "denied") => {
    localStorage.setItem("cookie-consent", choice);
    setVisible(false);
    window.dispatchEvent(new Event("cookie-consent-change"));
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 flex justify-center p-4 pointer-events-none">
      <div className="pointer-events-auto animate-barSlideUp w-full max-w-2xl rounded-xl border border-border bg-card shadow-card-lg px-5 py-3.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <p className="flex-1 min-w-0 sm:min-w-[200px] text-muted-foreground">
          We use cookies for analytics.{" "}
          <a
            href="/privacy"
            className="underline underline-offset-2 text-foreground hover:text-[var(--accent)] transition-colors"
          >
            Privacy Policy
          </a>
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => respond("denied")}
            className="px-3.5 py-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            Decline
          </button>
          <button
            onClick={() => respond("granted")}
            className="px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold transition-opacity hover:opacity-90"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
