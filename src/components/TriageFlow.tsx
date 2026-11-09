"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ASSOCIATED_OPTIONS,
  DURATION_OPTIONS,
  EXAMPLE_SYMPTOMS,
  SEVERITY_OPTIONS,
} from "@/lib/labels";
import {
  TriageRecordSchema,
  type AssociatedSymptom,
  type TriageInput,
} from "@/lib/triage/schema";
import { Chip } from "./Chip";
import { OptionCard, OptionGroup } from "./OptionCard";
import { PageShell, TwoColumn } from "./PageShell";
import { ResultLoading } from "./ResultLoading";
import { SafetyNote } from "./SafetyNote";
import { Stepper } from "./Stepper";
import { StepActions } from "./StepActions";
import { SummaryCard } from "./SummaryCard";
import { SymptomInput } from "./SymptomInput";

type Phase = "describe" | "duration" | "severity" | "associated" | "submitting";

const TITLES: Record<Exclude<Phase, "submitting">, string> = {
  describe: "Describe your symptoms",
  duration: "How long have you had these symptoms?",
  severity: "How strong are your symptoms?",
  associated: "Do you have any of these as well?",
};

const STEPS = ["describe", "duration", "severity", "associated"] as const;

const QUESTION_NUMBER = { duration: 1, severity: 2, associated: 3 } as const;

export function TriageFlow() {
  const router = useRouter();

  // All answers live here, so going back or editing never asks for them again (WCAG 3.3.7).
  const [phase, setPhase] = useState<Phase>("describe");
  const [text, setText] = useState("");
  const [duration, setDuration] = useState<TriageInput["duration"]>();
  const [severity, setSeverity] = useState<TriageInput["severity"]>();
  const [associated, setAssociated] = useState<AssociatedSymptom[]>([]);
  const [textError, setTextError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const firstRender = useRef(true);

  // Each step gets its own <title>, and focus moves to the step heading (WCAG 2.4.2, 2.4.3).
  useEffect(() => {
    if (phase === "submitting") return;
    document.title = `${TITLES[phase]} · Healthcare Triage`;
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [phase]);

  function continueFromDescribe() {
    if (!text.trim()) {
      setTextError("Tell us what's bothering you so we can help.");
      textRef.current?.focus();
      return;
    }
    setTextError(null);
    setPhase("duration");
  }

  function toggleAssociated(value: AssociatedSymptom) {
    setAssociated((current) => {
      // "None of these" is exclusive: it clears the others, and any other clears it.
      if (value === "none") return current.includes("none") ? [] : ["none"];
      const without = current.filter((item) => item !== "none" && item !== value);
      return current.includes(value) ? without : [...without, value];
    });
  }

  async function submit() {
    if (!duration || !severity || associated.length === 0) return;

    setSubmitError(null);
    setPhase("submitting");
    document.title = "Checking your symptoms · Healthcare Triage";

    try {
      const response = await fetch("/api/triage", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, duration, severity, associated }),
      });
      if (!response.ok) throw new Error(`Request failed with ${response.status}`);

      const { id } = TriageRecordSchema.pick({ id: true }).parse(await response.json());
      router.push(`/triage/${id}`);
    } catch {
      setSubmitError(
        "Something went wrong on our side. Your answers are still here, so please try again.",
      );
      setPhase("associated");
    }
  }

  const answers: Partial<TriageInput> = {
    text: text.trim() || undefined,
    duration,
    severity,
    associated: associated.length ? associated : undefined,
  };

  if (phase === "submitting") {
    return <ResultLoading input={answers} />;
  }

  const isDescribe = phase === "describe";

  return (
    <PageShell>
      <Stepper current={isDescribe ? 1 : 2} />

      <TwoColumn
        main={
          <>
            {isDescribe ? (
              <>
                <h1
                  ref={headingRef}
                  tabIndex={-1}
                  className="text-[32px] font-bold leading-[1.1] tracking-[-0.03em] text-ink outline-none desk:text-[52px] desk:leading-[1.08]"
                >
                  Tell us what you&apos;re feeling, in your own words.
                </h1>
                <p className="mt-4 text-[17px] leading-normal text-ink-muted desk:text-lg desk:leading-normal">
                  We&apos;ll point you to the right kind of care, so you don&apos;t have to know
                  which specialist to pick.
                </p>

                <div className="mt-8">
                  <SymptomInput
                    value={text}
                    onChange={(value) => {
                      setText(value);
                      if (textError && value.trim()) setTextError(null);
                    }}
                    error={textError}
                    inputRef={textRef}
                  />
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  {EXAMPLE_SYMPTOMS.map((example) => (
                    <Chip
                      key={example}
                      onClick={() => {
                        setText(example);
                        setTextError(null);
                        textRef.current?.focus();
                      }}
                    >
                      {example}
                    </Chip>
                  ))}
                </div>

                <StepActions onContinue={continueFromDescribe}>Takes about a minute</StepActions>
              </>
            ) : (
              <QuestionStep
                phase={phase}
                headingRef={headingRef}
                duration={duration}
                severity={severity}
                associated={associated}
                submitError={submitError}
                onDuration={setDuration}
                onSeverity={setSeverity}
                onToggleAssociated={toggleAssociated}
                onBack={() => setPhase(STEPS[STEPS.indexOf(phase) - 1])}
                onContinue={() =>
                  phase === "associated" ? submit() : setPhase(STEPS[STEPS.indexOf(phase) + 1])
                }
              />
            )}
          </>
        }
        aside={
          <>
            {!isDescribe && (
              <SummaryCard input={answers} onEdit={() => setPhase("describe")} />
            )}
            <SafetyNote />
          </>
        }
      />
    </PageShell>
  );
}

type QuestionStepProps = {
  phase: "duration" | "severity" | "associated";
  headingRef: React.Ref<HTMLHeadingElement>;
  duration?: TriageInput["duration"];
  severity?: TriageInput["severity"];
  associated: AssociatedSymptom[];
  submitError: string | null;
  onDuration: (value: TriageInput["duration"]) => void;
  onSeverity: (value: TriageInput["severity"]) => void;
  onToggleAssociated: (value: AssociatedSymptom) => void;
  onBack: () => void;
  onContinue: () => void;
};

function QuestionStep({
  phase,
  headingRef,
  duration,
  severity,
  associated,
  submitError,
  onDuration,
  onSeverity,
  onToggleAssociated,
  onBack,
  onContinue,
}: QuestionStepProps) {
  const canContinue =
    phase === "duration" ? !!duration : phase === "severity" ? !!severity : associated.length > 0;

  return (
    <>
      <p className="text-sm font-semibold text-ink-subtle">
        Question {QUESTION_NUMBER[phase]} of 3
      </p>
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="mt-2 text-[28px] font-bold leading-[1.1] tracking-[-0.02em] text-ink outline-none desk:text-[40px]"
      >
        {TITLES[phase]}
        {phase === "associated" && (
          <span className="mt-2 block text-base font-normal tracking-normal text-ink-muted">
            Select all that apply.
          </span>
        )}
      </h1>

      <div className="mt-6 desk:mt-8">
        {phase === "duration" && (
          <OptionGroup legend={TITLES.duration} className="desk:grid-cols-2">
            {DURATION_OPTIONS.map((option) => (
              <OptionCard
                key={option.value}
                type="radio"
                name="duration"
                value={option.value}
                label={option.label}
                checked={duration === option.value}
                onChange={() => onDuration(option.value)}
              />
            ))}
          </OptionGroup>
        )}

        {phase === "severity" && (
          <OptionGroup legend={TITLES.severity}>
            {SEVERITY_OPTIONS.map((option) => (
              <OptionCard
                key={option.value}
                type="radio"
                name="severity"
                value={option.value}
                label={option.label}
                checked={severity === option.value}
                onChange={() => onSeverity(option.value)}
              />
            ))}
          </OptionGroup>
        )}

        {phase === "associated" && (
          <OptionGroup
            legend={`${TITLES.associated} Select all that apply.`}
            className="desk:grid-cols-2"
          >
            {ASSOCIATED_OPTIONS.map((option) => (
              <OptionCard
                key={option.value}
                type="checkbox"
                name="associated"
                value={option.value}
                label={option.label}
                checked={associated.includes(option.value)}
                onChange={() => onToggleAssociated(option.value)}
              />
            ))}
          </OptionGroup>
        )}
      </div>

      {/* Errors are text, say what to do, and are announced politely (WCAG 3.3.1, 4.1.3). */}
      <div aria-live="polite">
        {submitError && (
          <p className="mt-5 rounded-input bg-urgent-bg p-4 text-base font-medium text-urgent-ink">
            {submitError}
          </p>
        )}
      </div>

      <StepActions
        onBack={onBack}
        onContinue={onContinue}
        continueDisabled={!canContinue}
        continueLabel={phase === "associated" ? "Check my symptoms" : "Continue"}
      />
    </>
  );
}
