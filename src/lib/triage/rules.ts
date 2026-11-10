import { hasAnswer } from "./questions";
import type { Pathway, StoredInput } from "./schema";

/**
 * Deterministic red-flag rules. If one matches, the result is `emergency`
 * and the AI is not asked. Prototype only: not medically validated.
 *
 * The matching is deliberately conservative (it errs towards "emergency").
 * It does not understand negation, so "no chest pain" can still match.
 *
 * It also runs on text alone (while screening, before any question is asked),
 * so every rule has to cope with missing severity and answers.
 */

export type RedFlagRule = {
  id: string;
  pathway: Pathway;
  /** Plain-language reason, shown on the emergency screen. */
  reason: string;
  matches: (input: StoredInput, text: string) => boolean;
};

const mentionsChestPain = (text: string) =>
  /\bchest\b/.test(text) &&
  /(pain|tight|pressure|crush|squeez|hurt|ache)/.test(text);

const mentionsAny = (text: string, patterns: RegExp[]) =>
  patterns.some((pattern) => pattern.test(text));

export const RED_FLAG_RULES: RedFlagRule[] = [
  {
    id: "chest-pain-with-breathlessness",
    pathway: "Cardiology",
    reason:
      "Chest pain with shortness of breath can be a sign of a heart problem that needs help right away.",
    matches: (input, text) =>
      mentionsChestPain(text) && hasAnswer(input.answers, "shortness_of_breath"),
  },
  {
    id: "chest-pain-radiating",
    pathway: "Cardiology",
    reason:
      "Chest pain that spreads to the arm, jaw or back can be a sign of a heart attack.",
    matches: (input, text) =>
      mentionsChestPain(text) && hasAnswer(input.answers, "radiating_pain"),
  },
  {
    id: "chest-pain-with-fainting",
    pathway: "Cardiology",
    reason:
      "Chest pain with dizziness or fainting can be a sign of a serious heart problem.",
    matches: (input, text) =>
      mentionsChestPain(text) && hasAnswer(input.answers, "dizziness_fainting"),
  },
  {
    id: "severe-chest-pain",
    pathway: "Cardiology",
    reason:
      "Severe chest pain can be a sign of a heart problem that needs help right away.",
    matches: (input, text) => mentionsChestPain(text) && input.severity === "severe",
  },
  {
    id: "crushing-chest-pain",
    pathway: "Cardiology",
    reason:
      "A crushing or squeezing feeling in the chest can be a sign of a heart attack.",
    matches: (_input, text) =>
      mentionsAny(text, [/crushing/, /squeezing/, /elephant on (my )?chest/, /heart attack/]),
  },
  {
    id: "severe-breathlessness",
    pathway: "Pulmonology",
    reason: "Severe trouble breathing needs help right away.",
    matches: (input, text) =>
      (input.severity === "severe" && hasAnswer(input.answers, "shortness_of_breath")) ||
      mentionsAny(text, [
        /can'?t breathe/,
        /cannot breathe/,
        /struggling to breathe/,
        /gasping/,
        /choking/,
      ]),
  },
  {
    id: "stroke-signs",
    pathway: "General Practice",
    reason:
      "Face drooping, slurred speech or sudden weakness on one side can be signs of a stroke.",
    matches: (_input, text) =>
      mentionsAny(text, [
        /face (is )?droop/,
        /droopy face/,
        /slurred speech/,
        /can'?t speak/,
        /(arm|leg|side).*(weak|numb)/,
        /(weak|numb).*(one side)/,
      ]),
  },
  {
    id: "coughing-or-vomiting-blood",
    pathway: "General Practice",
    reason: "Coughing up or vomiting blood needs help right away.",
    matches: (_input, text) =>
      mentionsAny(text, [/(cough|coughing|vomit|vomiting|throwing up).*blood/, /blood.*(cough|vomit)/]),
  },
  {
    id: "fainted-or-unconscious",
    pathway: "General Practice",
    reason: "Fainting or passing out can be a sign of a serious problem.",
    matches: (_input, text) =>
      mentionsAny(text, [/fainted/, /passed out/, /blacked out/, /unconscious/, /unresponsive/]),
  },
];

export type RuleMatch = {
  ruleId: string;
  pathway: Pathway;
  reason: string;
};

/** Returns the first matching red-flag rule, or null. */
export function evaluateRules(input: StoredInput): RuleMatch | null {
  const text = input.text.toLowerCase();
  for (const rule of RED_FLAG_RULES) {
    if (rule.matches(input, text)) {
      return { ruleId: rule.id, pathway: rule.pathway, reason: rule.reason };
    }
  }
  return null;
}
