import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found – Copy Anywhere",
};

export default function NotFound() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-20 flex flex-col items-center text-center gap-4">
      <h1 className="font-serif text-4xl font-bold tracking-tight">
        Page not found
      </h1>
      <p className="text-muted-foreground text-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold transition-opacity hover:opacity-90"
      >
        Back to home
      </Link>
    </main>
  );
}
