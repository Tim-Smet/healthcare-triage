import { cn } from "@/lib/cn";
import { URGENCY_LABEL } from "@/lib/labels";
import type { Urgency } from "@/lib/triage/schema";

/** Emergency has no pill: it replaces the whole screen. The label is always text. */
export function UrgencyPill({ urgency }: { urgency: Exclude<Urgency, "emergency"> }) {
  return (
    <span
      className={cn(
        "inline-flex h-8 items-center gap-2 rounded-full px-3.5 text-sm font-bold",
        urgency === "urgent" && "bg-urgent-bg text-urgent-ink",
        urgency === "routine" && "bg-primary-tint-2 text-primary-ink",
      )}
    >
      <span aria-hidden className="size-2 rounded-full bg-current" />
      {URGENCY_LABEL[urgency]}
    </span>
  );
}
