import { CONSULTATION_LABEL, SCHEDULE_CTA, SPECIALIST } from "@/lib/labels";
import type { TriageRecord } from "@/lib/triage/schema";
import { ScheduleAction } from "./ScheduleAction";
import { UrgencyPill } from "./UrgencyPill";

/** Non-emergency result. Emergency results use EmergencyScreen instead. */
export function ResultCard({ record }: { record: TriageRecord }) {
  const urgency = record.urgency === "emergency" ? "urgent" : record.urgency;

  return (
    <section
      aria-labelledby="result-pathway"
      className="rounded-card bg-surface p-6 shadow-card desk:p-9"
    >
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-ink-subtle">
          Your result
        </p>
        <UrgencyPill urgency={urgency} />
      </div>

      <h2
        id="result-pathway"
        className="mt-4 text-[28px] font-bold tracking-[-0.02em] text-ink desk:text-[40px]"
      >
        {record.pathway}
      </h2>
      <p className="mt-2 text-[17px] text-ink-muted">
        Recommended: <strong className="font-semibold text-ink">{CONSULTATION_LABEL[record.consultationType]}</strong>{" "}
        with {SPECIALIST[record.pathway]}
      </p>

      {record.reason && (
        <>
          <h3 className="mt-8 text-lg font-bold text-ink">Why we suggest this</h3>
          <p className="mt-2 text-base leading-normal text-ink">{record.reason}</p>
        </>
      )}

      <h3 className="mt-8 text-lg font-bold text-ink">What to do next</h3>
      <ol className="mt-3 space-y-3">
        {record.nextSteps.map((step, index) => (
          <li key={step} className="flex gap-3 text-base leading-snug text-ink">
            <span
              aria-hidden
              className="grid size-7 shrink-0 place-items-center rounded-full bg-primary-tint-2 text-sm font-bold text-primary-ink"
            >
              {index + 1}
            </span>
            <span className="pt-0.5">{step}</span>
          </li>
        ))}
      </ol>

      <div className="mt-8 border-t border-divider pt-6">
        <ScheduleAction label={SCHEDULE_CTA[record.consultationType]} resultId={record.id} />
        <p className="mt-4 text-sm text-ink-subtle">
          Result saved. You can share the link with your clinic.
        </p>
      </div>
    </section>
  );
}
