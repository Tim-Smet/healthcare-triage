import { EMERGENCY_NUMBER } from "@/lib/config";
import { PhoneIcon } from "./Icons";

/** Always in the same place (header) on every screen: WCAG 3.2.6 consistent help. */
export function EmergencyButton() {
  return (
    <a
      href={`tel:${EMERGENCY_NUMBER}`}
      className="inline-flex min-h-11 items-center gap-2 rounded-full border-[1.5px] border-emergency-ink px-4 text-sm font-semibold text-emergency-ink hover:bg-emergency-ink hover:text-white desk:border-ink desk:px-5 desk:text-base desk:text-ink desk:hover:bg-ink"
    >
      <PhoneIcon className="size-4 desk:hidden" />
      <span className="desk:hidden">Emergency</span>
      <span className="hidden desk:inline">Emergency? Call now</span>
    </a>
  );
}
