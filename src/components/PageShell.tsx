import type { ReactNode } from "react";
import { AppHeader } from "./AppHeader";
import { DisclaimerFooter } from "./DisclaimerFooter";

/** Header, content and footer. Shared by the form steps, the result and the not-found page. */
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-5 focus:py-3 focus:text-white"
      >
        Skip to content
      </a>
      <AppHeader />
      {/* Bottom padding on mobile leaves room for the pinned StepActions bar. */}
      <main id="main" className="flex-1 px-5 pb-40 pt-6 desk:px-14 desk:pb-14 desk:pt-10">
        {children}
      </main>
      <DisclaimerFooter />
    </>
  );
}

/** Two columns on desktop (1.5fr / 1fr, gap 56), one column below ~900px. */
export function TwoColumn({ main, aside }: { main: ReactNode; aside: ReactNode }) {
  return (
    <div className="mt-8 grid gap-8 desk:mt-12 desk:grid-cols-[1.5fr_1fr] desk:gap-14">
      <div>{main}</div>
      <div className="flex flex-col gap-5">{aside}</div>
    </div>
  );
}
