import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CheckIcon } from "./Icons";

type OptionCardProps = {
  type: "radio" | "checkbox";
  name: string;
  value: string;
  label: string;
  checked: boolean;
  onChange: () => void;
};

/**
 * A real radio/checkbox inside a label. The input is visually hidden but stays
 * focusable; the card shows the state with border, fill, weight AND a marker,
 * so it never relies on color alone (WCAG 1.4.1).
 */
export function OptionCard({ type, name, value, label, checked, onChange }: OptionCardProps) {
  return (
    <label className="block cursor-pointer">
      <input
        type={type}
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      <span
        className={cn(
          "flex min-h-14 items-center gap-3 rounded-[14px] border-[1.5px] border-border-input bg-surface px-4 py-3 text-base text-ink desk:min-h-[72px] desk:rounded-option desk:px-5",
          "hover:bg-primary-tint",
          "peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary",
          "peer-checked:border-primary peer-checked:bg-primary-tint peer-checked:font-semibold peer-checked:shadow-[inset_0_0_0_1px_var(--primary)]",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "grid size-6 shrink-0 place-items-center border-[1.5px] text-white",
            type === "radio" ? "rounded-full" : "rounded-md",
            checked ? "border-primary bg-primary" : "border-border-input bg-surface",
          )}
        >
          {checked && <CheckIcon className="size-3.5" />}
        </span>
        {label}
      </span>
    </label>
  );
}

type OptionGroupProps = {
  /** Read by screen readers. The visible question is the page heading. */
  legend: string;
  className?: string;
  children: ReactNode;
};

export function OptionGroup({ legend, className, children }: OptionGroupProps) {
  return (
    <fieldset className="min-w-0 border-0 p-0">
      <legend className="sr-only">{legend}</legend>
      <div className={cn("grid gap-3", className)}>{children}</div>
    </fieldset>
  );
}
