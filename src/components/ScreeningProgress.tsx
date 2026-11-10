"use client";

import { useEffect, useRef, useState } from "react";
import { PageShell, TwoColumn } from "./PageShell";
import { SafetyNote } from "./SafetyNote";
import { Stepper } from "./Stepper";
import { SummaryCard } from "./SummaryCard";

const STAGES = [
  { from: 0, label: "Reading what you wrote…" },
  { from: 1500, label: "Checking for anything urgent…" },
  { from: 3500, label: "Choosing the right questions for you…" },
] as const;

/** Eases towards 92% and never reaches 100%, since we can't know how long the AI takes. */
const progressAt = (elapsedMs: number) => 92 * (1 - Math.exp(-elapsedMs / 3000));

/**
 * Shown while the first description is screened. The bar is an estimate, so it is
 * announced as "in progress" (no value), and only the stage text is read out.
 */
export function ScreeningProgress({ text }: { text: string }) {
  const [elapsed, setElapsed] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => setElapsed(Date.now() - start), 100);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => headingRef.current?.focus(), []);

  const stage = STAGES.filter((s) => elapsed >= s.from).at(-1)!;

  return (
    <PageShell>
      <Stepper current={1} />
      <TwoColumn
        main={
          <div className="rounded-card bg-surface p-6 shadow-card desk:p-9">
            <h1
              ref={headingRef}
              tabIndex={-1}
              className="text-[28px] font-bold tracking-[-0.02em] text-ink outline-none desk:text-[40px]"
            >
              Looking at your symptoms…
            </h1>
            <p role="status" className="mt-3 text-[17px] text-ink-muted">
              {stage.label}
            </p>
            <div
              role="progressbar"
              aria-label="Looking at your symptoms"
              className="mt-6 h-2 overflow-hidden rounded-full bg-divider"
            >
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${progressAt(elapsed)}%` }}
              />
            </div>
          </div>
        }
        aside={
          <>
            <SummaryCard input={{ text }} />
            <SafetyNote />
          </>
        }
      />
    </PageShell>
  );
}
