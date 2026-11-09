import type { ReactNode } from "react";
import { Button } from "./Button";

type Props = {
  /** Omit on the first step: there is nothing to go back to. */
  onBack?: () => void;
  onContinue: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  /** Small note next to the buttons (desktop) or above them (mobile). */
  children?: ReactNode;
};

/**
 * Back + Continue. Inline on desktop; pinned to the bottom of the screen on
 * mobile. The page reserves bottom padding and `scroll-padding-bottom` so the
 * bar never covers a focused field (WCAG 2.4.11).
 */
export function StepActions({
  onBack,
  onContinue,
  continueLabel = "Continue",
  continueDisabled,
  children,
}: Props) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-bg px-5 pb-4 pt-3 desk:static desk:mt-8 desk:border-0 desk:bg-transparent desk:p-0">
      <div className="flex items-center gap-3">
        {onBack && (
          <Button variant="secondary" onClick={onBack}>
            Back
          </Button>
        )}
        <Button onClick={onContinue} disabled={continueDisabled} className="flex-1 desk:flex-none">
          {continueLabel}
        </Button>
        {children && <p className="hidden text-sm text-ink-subtle desk:block">{children}</p>}
      </div>
    </div>
  );
}
