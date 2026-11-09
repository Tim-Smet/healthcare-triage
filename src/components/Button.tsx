import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "dark" | "text";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full text-base font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const VARIANTS: Record<Variant, string> = {
  primary: "h-[52px] px-8 bg-primary text-white hover:bg-primary-ink",
  secondary:
    "h-[52px] px-8 border-[1.5px] border-primary bg-surface text-primary-ink hover:bg-primary-tint",
  dark: "h-[52px] px-8 bg-ink text-white hover:bg-ink-muted",
  // Link-style, but still a 44px target.
  text: "min-h-11 px-3 text-primary-ink underline underline-offset-4 hover:text-ink",
};

export function buttonClasses(variant: Variant, className?: string) {
  return cn(BASE, VARIANTS[variant], className);
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant };

export function Button({ variant = "primary", className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses(variant, className)} {...props} />;
}

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: Variant };

export function ButtonLink({ variant = "primary", className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClasses(variant, className)} {...props} />;
}
