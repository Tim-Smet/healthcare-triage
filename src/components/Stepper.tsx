import { cn } from "@/lib/cn";
import { CheckIcon } from "./Icons";

const STEPS = ["Describe", "Details", "Result"] as const;

type Props = {
  /** 1-based current step. */
  current: 1 | 2 | 3;
  /** Show every step as done (result page). */
  complete?: boolean;
};

export function Stepper({ current, complete = false }: Props) {
  const currentLabel = STEPS[current - 1];

  return (
    <nav aria-label="Progress">
      {/* Mobile: "Step 2 of 3 · Details" + progress bar */}
      <div className="desk:hidden">
        <p className="text-sm font-semibold text-ink-subtle">
          Step {current} of {STEPS.length} · {currentLabel}
        </p>
        <div aria-hidden className="mt-2 h-1.5 overflow-hidden rounded-full bg-divider">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${complete ? 100 : (current / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop: three numbered circles joined by lines */}
      <ol className="hidden items-center desk:flex">
        {STEPS.map((label, index) => {
          const number = index + 1;
          const done = complete || number < current;
          const isCurrent = !complete && number === current;

          return (
            <li
              key={label}
              aria-current={isCurrent ? "step" : undefined}
              className="flex items-center"
            >
              <span
                className={cn(
                  "grid size-9 place-items-center rounded-full border-2 text-sm font-bold",
                  done && "border-primary bg-primary text-white",
                  isCurrent && "border-primary bg-surface text-primary-ink",
                  !done && !isCurrent && "border-border-input bg-surface text-ink-subtle",
                )}
              >
                {done ? <CheckIcon /> : number}
              </span>
              <span className="sr-only">{done ? "Completed: " : ""}</span>
              <span
                className={cn(
                  "ml-3 text-base",
                  isCurrent ? "font-bold text-ink" : "font-medium text-ink-subtle",
                )}
              >
                {label}
              </span>
              {number < STEPS.length && (
                <span
                  aria-hidden
                  className={cn("mx-4 h-0.5 w-16", done ? "bg-primary" : "bg-border")}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
