import Link from "next/link";
import { EmergencyButton } from "./EmergencyButton";
import { PulseIcon } from "./Icons";

export function AppHeader() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border px-5 desk:h-[72px] desk:px-14">
      <Link href="/" className="flex min-h-11 items-center gap-2 text-lg font-bold text-ink">
        <span className="grid size-9 place-items-center rounded-full bg-primary text-white">
          <PulseIcon className="size-5" />
        </span>
        Healthcare Triage
      </Link>
      <EmergencyButton />
    </header>
  );
}
