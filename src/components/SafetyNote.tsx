/** Desktop only. On mobile the same advice lives in the footer text. */
export function SafetyNote() {
  return (
    <aside className="hidden rounded-option bg-primary-tint p-5 text-[15px] leading-snug text-ink desk:block">
      <p className="font-semibold">Feeling worse right now?</p>
      <p className="mt-1 text-ink-muted">
        Severe chest pain, trouble breathing or fainting: call your local emergency number.
      </p>
    </aside>
  );
}
