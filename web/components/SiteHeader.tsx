"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export function SiteHeader() {
  const pathname = usePathname();

  const rightLink =
    pathname === "/"
      ? { href: "/tools", label: "Browse all converters", mobileLabel: "Tools" }
      : pathname === "/tools"
        ? null
        : pathname === "/privacy" || pathname === "/terms"
          ? { href: "/", label: "Back to app", mobileLabel: "Back" }
          : pathname === "/extension"
            ? { href: "/", label: "Try the web app", mobileLabel: "Web app" }
            : { href: "/tools", label: "All tools", mobileLabel: "Tools" };

  const handleLogoClick = () => {
    if (pathname === "/") {
      window.dispatchEvent(new CustomEvent("site-header:logo-click"));
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg)] border-b border-border/50">
      <div className="mx-auto max-w-2xl px-6 py-3 flex items-center justify-between">
        <Link
          href="/"
          onClick={handleLogoClick}
          className="flex items-center gap-2.5 no-underline hover:opacity-80 transition-opacity"
        >
          <Image
            src="/logo.svg"
            alt="Copy Anywhere"
            width={32}
            height={32}
            className="rounded-lg shadow-logo"
            priority
          />
          <span className="hidden sm:inline font-serif text-lg font-semibold tracking-tight">
            Copy Anywhere
          </span>
        </Link>
        <div className="flex items-center gap-4">
          {pathname !== "/extension" && (
            <Link
              href="/extension"
              className="text-sm font-medium text-muted-foreground/70 hover:text-foreground transition-colors"
            >
              Extension
            </Link>
          )}
          {rightLink && (
            <Link
              href={rightLink.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="sm:hidden">{rightLink.mobileLabel}</span>
              <span className="hidden sm:inline">{rightLink.label}</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
