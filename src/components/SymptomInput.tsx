import { cn } from "@/lib/cn";

type Props = {
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  /** Lets the parent move focus here after a failed submit. */
  inputRef?: React.Ref<HTMLTextAreaElement>;
};

export function SymptomInput({ value, onChange, error, inputRef }: Props) {
  return (
    <div>
      <label htmlFor="symptoms" className="block text-base font-semibold text-ink">
        Your symptoms
      </label>
      <textarea
        ref={inputRef}
        id="symptoms"
        name="symptoms"
        rows={4}
        maxLength={2000}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "symptoms-error" : undefined}
        className={cn(
          "mt-2 block w-full resize-none rounded-input border-[1.5px] bg-surface p-4 text-[17px] leading-normal text-ink placeholder:text-ink-subtle",
          error ? "border-emergency-ink" : "border-border-input",
        )}
        placeholder="For example: a tight feeling in my chest when I climb the stairs"
      />
      {error && (
        <p id="symptoms-error" className="mt-2 text-base font-medium text-emergency-ink">
          {error}
        </p>
      )}
    </div>
  );
}
