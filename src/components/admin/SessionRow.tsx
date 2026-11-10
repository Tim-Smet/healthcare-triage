import { CONSULTATION_LABEL, durationLabel, severityShortLabel, URGENCY_LABEL } from "@/lib/labels";
import { describeAnswers } from "@/lib/triage/questions";
import type { TriageRecord } from "@/lib/triage/schema";
import { cn } from "@/lib/cn";

const SOURCE_LABEL: Record<TriageRecord["source"], string> = {
  rules: "Rules",
  ai: "AI",
  fallback: "Fallback",
};

const SOURCE_HINT: Record<TriageRecord["source"], string> = {
  rules: "A red-flag rule matched. The AI was skipped.",
  ai: "The AI agent decided.",
  fallback: "The AI failed or returned invalid output, so the safe default was used.",
};

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

function Badge({ children, tone }: { children: React.ReactNode; tone?: "emergency" | "urgent" | "fallback" }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-full px-3 text-[13px] font-bold",
        !tone && "bg-primary-tint-2 text-primary-ink",
        tone === "urgent" && "bg-urgent-bg text-urgent-ink",
        tone === "emergency" && "bg-emergency text-white",
        tone === "fallback" && "border border-border-input bg-surface text-ink",
      )}
    >
      {children}
    </span>
  );
}

function Field({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <dt className="w-28 shrink-0 text-ink-subtle">{term}</dt>
      <dd className="font-medium text-ink">{children}</dd>
    </div>
  );
}

/** One triage: a one-line summary that expands into the full input and output. */
export function SessionRow({ record }: { record: TriageRecord }) {
  const { input } = record;
  const answers =
    input.category && input.answers ? describeAnswers(input.category, input.answers) : [];

  return (
    <details className="group rounded-option border border-border bg-surface">
      <summary className="flex min-h-14 cursor-pointer flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3 marker:content-none">
        <time dateTime={record.createdAt} className="w-36 shrink-0 text-sm text-ink-subtle">
          {dateFormat.format(new Date(record.createdAt))} UTC
        </time>
        <span className="min-w-0 flex-1 basis-60 truncate text-[15px] text-ink">“{input.text}”</span>
        <span className="flex flex-wrap items-center gap-2">
          <Badge tone={record.urgency === "emergency" ? "emergency" : record.urgency === "urgent" ? "urgent" : undefined}>
            {URGENCY_LABEL[record.urgency]}
          </Badge>
          <Badge>{record.pathway}</Badge>
          <Badge tone={record.source === "fallback" ? "fallback" : undefined}>
            {SOURCE_LABEL[record.source]}
          </Badge>
        </span>
      </summary>

      <div className="grid gap-8 border-t border-divider px-5 py-6 desk:grid-cols-2">
        <section aria-label="Input">
          <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-ink-subtle">
            Input (what the patient gave)
          </h3>
          <blockquote className="mt-3 whitespace-pre-wrap text-[17px] leading-snug text-ink">
            “{input.text}”
          </blockquote>
          <dl className="mt-4 space-y-2 border-t border-divider pt-4 text-[15px]">
            <Field term="Category">{input.category ?? "Not reached"}</Field>
            <Field term="How long">{input.duration ? durationLabel(input.duration) : "Not asked"}</Field>
            <Field term="How strong">{input.severity ? severityShortLabel(input.severity) : "Not asked"}</Field>
            {answers.map(({ question, chosen }) => (
              <Field key={question.id} term={question.label}>
                {chosen.map((option) => option.label).join(", ")}
              </Field>
            ))}
          </dl>
        </section>

        <section aria-label="Output">
          <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-ink-subtle">
            Output (what the tool decided)
          </h3>
          <dl className="mt-3 space-y-2 text-[15px]">
            <Field term="Urgency">{URGENCY_LABEL[record.urgency]}</Field>
            <Field term="Pathway">{record.pathway}</Field>
            <Field term="Ranked">{record.rankedPathways.join(" → ")}</Field>
            <Field term="Consultation">{CONSULTATION_LABEL[record.consultationType]}</Field>
            <Field term="Next">{record.next}</Field>
            <Field term="Decided by">
              {SOURCE_LABEL[record.source]}
              <span className="block text-[13px] font-normal text-ink-muted">{SOURCE_HINT[record.source]}</span>
            </Field>
          </dl>
          {record.reason && (
            <p className="mt-4 border-t border-divider pt-4 text-[15px] leading-normal text-ink">
              <span className="block text-ink-subtle">Reason shown to the patient</span>
              {record.reason}
            </p>
          )}
          <div className="mt-4 border-t border-divider pt-4 text-[15px]">
            <p className="text-ink-subtle">Next steps shown</p>
            <ol className="mt-1 list-decimal space-y-1 pl-5 text-ink">
              {record.nextSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
          <p className="mt-4 break-all text-[13px] text-ink-subtle">ID {record.id}</p>
        </section>
      </div>
    </details>
  );
}
