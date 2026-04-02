import type { ReactNode } from "react";

export function PdfPreviewShell({ children }: { children: ReactNode }) {
  return (
    <div className="bg-muted/50 px-4 py-8 sm:px-8 sm:py-10 -mx-px">
      <div className="mx-auto max-w-[680px] bg-card shadow-xl rounded-sm px-5 py-8 sm:px-10 sm:py-12 md:px-14 md:py-16 min-h-[400px]">
        {children}
      </div>
    </div>
  );
}
