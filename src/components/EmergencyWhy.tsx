"use client";

import { useId, useState } from "react";

/** "Why am I seeing this?" reveals what triggered the screen, plus the disclaimer. */
export function EmergencyWhy({ symptoms }: { symptoms: string }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="h-[52px] w-full rounded-full border-2 border-white text-base font-semibold text-white hover:bg-white/10"
      >
        Why am I seeing this?
      </button>
      <div id={panelId} hidden={!open} className="mt-4 text-[15px] leading-relaxed text-white/90">
        <p>
          This screen appears when what you told us matches a warning sign that can need urgent
          care. You told us: “{symptoms}”
        </p>
        <p className="mt-2">
          This is a prototype and does not give medical advice. It is not a diagnosis. If you are
          unsure, call your local emergency number.
        </p>
      </div>
    </div>
  );
}
