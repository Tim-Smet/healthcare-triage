"use client";

import { useState, type ReactNode } from "react";
import { EMERGENCY_NUMBER } from "@/lib/config";
import { cn } from "@/lib/cn";

type Props = {
  className: string;
  children: ReactNode;
  /** Where the prototype notice appears relative to the button. */
  noticePlacement?: "below" | "above";
};

/**
 * A tel: link when an emergency number is configured. Without one (the
 * default), it dials nothing and shows a short notice instead.
 */
export function EmergencyCall({ className, children, noticePlacement = "below" }: Props) {
  const [showNotice, setShowNotice] = useState(false);

  if (EMERGENCY_NUMBER) {
    return (
      <a href={`tel:${EMERGENCY_NUMBER}`} className={className}>
        {children}
      </a>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={showNotice}
        onClick={() => setShowNotice((value) => !value)}
        className={className}
      >
        {children}
      </button>
      <p
        role="status"
        hidden={!showNotice}
        className={cn(
          "absolute right-0 z-30 w-64 rounded-input bg-ink p-3 text-left text-sm font-normal normal-case leading-snug tracking-normal text-white shadow-card",
          noticePlacement === "below" ? "top-full mt-2" : "bottom-full mb-2",
        )}
      >
        Prototype: no number is connected here. In a real emergency, call your local emergency
        number.
      </p>
    </div>
  );
}
