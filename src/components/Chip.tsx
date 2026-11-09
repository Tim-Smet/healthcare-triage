import type { ButtonHTMLAttributes } from "react";

export function Chip(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className="min-h-11 rounded-full border-[1.5px] border-border-input bg-surface px-4 text-[15px] font-medium text-ink hover:bg-primary-tint"
      {...props}
    />
  );
}
