import { durationLabel, severityShortLabel } from "@/lib/labels";
import { describeAnswers } from "@/lib/triage/questions";
import type { StoredInput } from "@/lib/triage/schema";
import { Button } from "./Button";

type Props = {
  /** Answers so far. Details appear as the patient gives them. */
  input: Partial<StoredInput>;
  /** When set, shows an Edit button that returns to the first step. */
  onEdit?: () => void;
};

export function SummaryCard({ input, onEdit }: Props) {
  const rows: Array<[string, string]> = [];
  if (input.duration) rows.push(["How long", durationLabel(input.duration)]);
  if (input.severity) rows.push(["How strong", severityShortLabel(input.severity)]);
  if (input.category && input.answers) {
    for (const { question, chosen } of describeAnswers(input.category, input.answers)) {
      rows.push([question.label, chosen.map((option) => option.label).join(", ")]);
    }
  }

  return (
    <section
      aria-labelledby="summary-title"
      className="rounded-option bg-primary-tint p-5 desk:rounded-card desk:bg-surface desk:p-7 desk:shadow-card"
    >
      <div className="flex items-start justify-between gap-3">
        <h2
          id="summary-title"
          className="text-xs font-bold uppercase tracking-[0.1em] text-ink-subtle"
        >
          What you told us
        </h2>
        {onEdit && (
          <Button variant="text" onClick={onEdit} className="-my-2 -mr-3 text-[15px]">
            Edit
            <span className="sr-only"> your symptoms</span>
          </Button>
        )}
      </div>

      {input.text && (
        <blockquote className="mt-2 text-[17px] leading-snug text-ink">
          “{input.text}”
        </blockquote>
      )}

      {rows.length > 0 && (
        <dl className="mt-4 space-y-2 border-t border-divider pt-4 text-[15px]">
          {rows.map(([term, detail]) => (
            <div key={term} className="flex gap-3">
              <dt className="w-24 shrink-0 text-ink-subtle">{term}</dt>
              <dd className="font-medium text-ink">{detail}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
