"use client";

import { useState } from "react";
import { Button } from "./Button";

/**
 * The prototype has no scheduling system behind it, so the button says so
 * instead of pretending to book. A hospital integration would replace this
 * with a call to the scheduling API using the stored result id.
 */
export function ScheduleAction({ label, resultId }: { label: string; resultId: string }) {
  const [pressed, setPressed] = useState(false);

  return (
    <div>
      <Button variant="dark" onClick={() => setPressed(true)} className="w-full desk:w-auto">
        {label}
      </Button>
      <p aria-live="polite" className="mt-3 text-[15px] text-ink-muted">
        {pressed &&
          `Scheduling isn't connected in this prototype. Your result is saved (reference ${resultId.slice(0, 8)}) so a clinic could pick it up.`}
      </p>
    </div>
  );
}
