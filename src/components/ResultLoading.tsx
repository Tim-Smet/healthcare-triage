import { PageShell, TwoColumn } from "./PageShell";
import { SafetyNote } from "./SafetyNote";
import { Stepper } from "./Stepper";
import { SummaryCard } from "./SummaryCard";
import type { StoredInput } from "@/lib/triage/schema";

/** Loading state: text in a polite live region, never a spinner alone. */
export function ResultLoading({ input }: { input?: Partial<StoredInput> }) {
  return (
    <PageShell>
      <Stepper current={3} />
      <TwoColumn
        main={
          <div role="status" aria-live="polite" className="rounded-card bg-surface p-6 shadow-card desk:p-9">
            <h1 className="text-[28px] font-bold tracking-[-0.02em] text-ink desk:text-[40px]">
              Checking your symptoms…
            </h1>
            <p className="mt-3 text-[17px] text-ink-muted">This only takes a moment.</p>
            <div aria-hidden className="mt-6 h-2 overflow-hidden rounded-full bg-divider">
              <div className="h-full w-1/3 animate-pulse rounded-full bg-primary" />
            </div>
          </div>
        }
        aside={
          <>
            {input && <SummaryCard input={input} />}
            <SafetyNote />
          </>
        }
      />
    </PageShell>
  );
}
