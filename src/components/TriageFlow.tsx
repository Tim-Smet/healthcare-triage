"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { DURATION_OPTIONS, EXAMPLE_SYMPTOMS, SEVERITY_OPTIONS } from "@/lib/labels";
import { NONE_OPTION, questionsFor, type Question } from "@/lib/triage/questions";
import {
  ScreenResultSchema,
  TriageRecordSchema,
  type Answers,
  type Pathway,
  type StoredInput,
  type TriageInput,
} from "@/lib/triage/schema";
import { Chip } from "./Chip";
import { OptionCard, OptionGroup } from "./OptionCard";
import { PageShell, TwoColumn } from "./PageShell";
import { ResultLoading } from "./ResultLoading";
import { ScreeningProgress } from "./ScreeningProgress";
import { SafetyNote } from "./SafetyNote";
import { Stepper } from "./Stepper";
import { StepActions } from "./StepActions";
import { SummaryCard } from "./SummaryCard";
import { SymptomInput } from "./SymptomInput";

type Phase = "describe" | "screening" | "questions" | "submitting";

const DESCRIBE_TITLE = "Describe your symptoms";
const GENERIC_STEPS = {
  duration: "How long have you had these symptoms?",
  severity: "How strong are your symptoms?",
} as const;

export function TriageFlow() {
  const router = useRouter();

  // All answers live here, so going back or editing never asks for them again (WCAG 3.3.7).
  const [phase, setPhase] = useState<Phase>("describe");
  const [step, setStep] = useState(0);
  const [text, setText] = useState("");
  // The category comes from screening the text. We remember which text it was for,
  // so going back and continuing without edits doesn't call the AI again.
  const [category, setCategory] = useState<Pathway>();
  const [screenedText, setScreenedText] = useState<string>();
  const [duration, setDuration] = useState<TriageInput["duration"]>();
  const [severity, setSeverity] = useState<TriageInput["severity"]>();
  const [answers, setAnswers] = useState<Answers>({});
  const [textError, setTextError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const firstRender = useRef(true);

  const questions = category ? questionsFor(category) : [];
  // Two fixed questions for everyone, then the ones for the screened category.
  const stepIds = ["duration", "severity", ...questions.map((q) => q.id)];
  const stepId = stepIds[step];
  const question = questions.find((q) => q.id === stepId);

  const stepTitle =
    stepId === "duration" || stepId === "severity"
      ? GENERIC_STEPS[stepId]
      : (question?.text ?? "");

  // Each step gets its own <title>, and focus moves to the step heading (WCAG 2.4.2, 2.4.3).
  useEffect(() => {
    if (phase === "screening" || phase === "submitting") return;
    const title = phase === "describe" ? DESCRIBE_TITLE : stepTitle;
    document.title = `${title} · Healthcare Triage`;
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [phase, stepTitle]);

  async function continueFromDescribe() {
    const trimmed = text.trim();
    if (!trimmed) {
      setTextError("Tell us what's bothering you so we can help.");
      textRef.current?.focus();
      return;
    }
    setTextError(null);

    if (category && screenedText === trimmed) {
      setStep(0);
      setPhase("questions");
      return;
    }

    setPhase("screening");
    document.title = "Looking at your symptoms · Healthcare Triage";

    try {
      const response = await fetch("/api/triage/screen", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      if (!response.ok) throw new Error(`Request failed with ${response.status}`);
      const result = ScreenResultSchema.parse(await response.json());

      // An emergency ends the flow here: no follow-up questions.
      if (result.next === "emergency") {
        router.push(`/triage/${result.id}`);
        return;
      }

      // Answers belong to one category's questions, so a new category starts clean.
      if (result.category !== category) setAnswers({});
      setCategory(result.category);
      setScreenedText(trimmed);
      setStep(0);
      setPhase("questions");
    } catch {
      setTextError("Something went wrong on our side. Your description is still here, so please try again.");
      setPhase("describe");
    }
  }

  function selectAnswer(item: Question, value: string) {
    setAnswers((current) => {
      if (item.kind === "single") return { ...current, [item.id]: [value] };

      // "None of these" is exclusive: it clears the others, and any other clears it.
      const selected = current[item.id] ?? [];
      let next: string[];
      if (value === NONE_OPTION.value) {
        next = selected.includes(value) ? [] : [value];
      } else {
        const without = selected.filter((v) => v !== NONE_OPTION.value && v !== value);
        next = selected.includes(value) ? without : [...without, value];
      }
      return { ...current, [item.id]: next };
    });
  }

  async function submit() {
    if (!category || !duration || !severity) return;

    setSubmitError(null);
    setPhase("submitting");
    document.title = "Checking your symptoms · Healthcare Triage";

    try {
      const response = await fetch("/api/triage", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: text.trim(), category, duration, severity, answers }),
      });
      if (!response.ok) throw new Error(`Request failed with ${response.status}`);

      const { id } = TriageRecordSchema.pick({ id: true }).parse(await response.json());
      router.push(`/triage/${id}`);
    } catch {
      setSubmitError(
        "Something went wrong on our side. Your answers are still here, so please try again.",
      );
      setPhase("questions");
    }
  }

  const summary: Partial<StoredInput> = {
    text: text.trim() || undefined,
    category,
    duration,
    severity,
    answers: Object.keys(answers).length ? answers : undefined,
  };

  if (phase === "screening") return <ScreeningProgress text={text.trim()} />;
  if (phase === "submitting") return <ResultLoading input={summary} />;

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

                <StepActions onContinue={() => void continueFromDescribe()}>Takes about a minute</StepActions>
              </>
            ) : (
              <QuestionStep
                headingRef={headingRef}
                stepId={stepId}
                title={stepTitle}
                question={question}
                number={step + 1}
                total={stepIds.length}
                duration={duration}
                severity={severity}
                answers={answers}
                submitError={submitError}
                onDuration={setDuration}
                onSeverity={setSeverity}
                onAnswer={selectAnswer}
                onBack={() => (step === 0 ? setPhase("describe") : setStep(step - 1))}
                onContinue={() => (step === stepIds.length - 1 ? submit() : setStep(step + 1))}
              />
            )}
          </>
        }
        aside={
          <>
            {!isDescribe && (
              <SummaryCard input={summary} onEdit={() => setPhase("describe")} />
            )}
            <SafetyNote />
          </>
        }
      />
    </PageShell>
  );
}

type QuestionStepProps = {
  headingRef: React.Ref<HTMLHeadingElement>;
  stepId: string;
  title: string;
  /** Set for category questions, undefined for duration and severity. */
  question?: Question;
  number: number;
  total: number;
  duration?: TriageInput["duration"];
  severity?: TriageInput["severity"];
  answers: Answers;
  submitError: string | null;
  onDuration: (value: TriageInput["duration"]) => void;
  onSeverity: (value: TriageInput["severity"]) => void;
  onAnswer: (question: Question, value: string) => void;
  onBack: () => void;
  onContinue: () => void;
};

function QuestionStep({
  headingRef,
  stepId,
  title,
  question,
  number,
  total,
  duration,
  severity,
  answers,
  submitError,
  onDuration,
  onSeverity,
  onAnswer,
  onBack,
  onContinue,
}: QuestionStepProps) {
  const isLast = number === total;
  const canContinue =
    stepId === "duration"
      ? !!duration
      : stepId === "severity"
        ? !!severity
        : (answers[stepId]?.length ?? 0) > 0;

  return (
    <>
      <p className="text-sm font-semibold text-ink-subtle">
        Question {number} of {total}
      </p>
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="mt-2 text-[28px] font-bold leading-[1.1] tracking-[-0.02em] text-ink outline-none desk:text-[40px]"
      >
        {title}
        {question?.kind === "multi" && (
          <span className="mt-2 block text-base font-normal tracking-normal text-ink-muted">
            Select all that apply.
          </span>
        )}
      </h1>

      <div className="mt-6 desk:mt-8">
        {stepId === "duration" && (
          <OptionGroup legend={title} className="desk:grid-cols-2">
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

        {stepId === "severity" && (
          <OptionGroup legend={title}>
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

        {question && (
          <OptionGroup
            // A new key per question resets the group, so radios never carry over.
            key={question.id}
            legend={question.kind === "multi" ? `${title} Select all that apply.` : title}
            className={question.kind === "multi" ? "desk:grid-cols-2" : undefined}
          >
            {question.options.map((option) => (
              <OptionCard
                key={option.value}
                type={question.kind === "multi" ? "checkbox" : "radio"}
                name={question.id}
                value={option.value}
                label={option.label}
                checked={answers[question.id]?.includes(option.value) ?? false}
                onChange={() => onAnswer(question, option.value)}
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
        continueLabel={isLast ? "Check my symptoms" : "Continue"}
      />
    </>
  );
}
