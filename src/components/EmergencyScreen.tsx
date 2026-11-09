import type { TriageRecord } from "@/lib/triage/schema";
import { EmergencyCall } from "./EmergencyCall";
import { EmergencyWhy } from "./EmergencyWhy";
import { PhoneIcon, WarningIcon } from "./Icons";

/**
 * Full screen, replaces the whole flow: no header, stepper or footer.
 * Shown when a red-flag rule matches or the final result is `emergency`.
 */
export function EmergencyScreen({ record }: { record: TriageRecord }) {
  return (
    <div className="on-emergency flex min-h-dvh flex-col bg-emergency text-white">
      <main className="mx-auto flex w-full max-w-[560px] flex-1 flex-col gap-6 px-6 pb-6 pt-8">
        <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em]">
          <WarningIcon />
          Emergency
        </p>

        <h1 className="text-[34px] font-bold leading-[1.04] tracking-[-0.02em] desk:text-[46px]">
          Call emergency services now.
        </h1>

        <p className="text-lg leading-normal">{record.reason}</p>

        <section aria-labelledby="while-you-wait" className="rounded-[20px] bg-white p-5 text-ink">
          <h2 id="while-you-wait" className="text-lg font-bold">
            While you wait
          </h2>
          <ol className="mt-3 space-y-3">
            {record.nextSteps.map((step, index) => (
              <li key={step} className="flex gap-3 text-base leading-snug">
                <span
                  aria-hidden
                  className="grid size-7 shrink-0 place-items-center rounded-full bg-emergency text-sm font-bold text-white"
                >
                  {index + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <EmergencyWhy symptoms={record.input.text} />
      </main>

      {/* Primary action stays pinned to the bottom of the screen. */}
      <div className="sticky bottom-0 bg-emergency px-6 pb-6 pt-3">
        <div className="mx-auto max-w-[512px]">
          <EmergencyCall
            noticePlacement="above"
            className="flex h-[68px] w-full items-center justify-center gap-3 rounded-full bg-white text-xl font-bold text-emergency"
          >
            <PhoneIcon className="size-6" />
            Call your emergency number
          </EmergencyCall>
        </div>
      </div>
    </div>
  );
}
