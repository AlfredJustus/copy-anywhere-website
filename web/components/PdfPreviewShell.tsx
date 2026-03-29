import type { ReactNode } from "react";

export function PdfPreviewShell({ children }: { children: ReactNode }) {
  return (
    <div className="bg-muted/50 px-4 py-8 sm:px-8 sm:py-10 -mx-px">
      <div className="mx-auto max-w-[680px] bg-white shadow-xl rounded-sm px-10 py-12 sm:px-14 sm:py-16 min-h-[400px] dark:bg-card">
        {children}
      </div>
    </div>
  );
}
