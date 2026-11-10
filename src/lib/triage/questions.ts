import type { Answers, Pathway } from "./schema";

/**
 * Follow-up questions per category. The screening step only picks the category,
 * so the AI never writes questions: this bank is fixed, reviewable and testable.
 * Prototype only: the wording is not medically validated.
 *
 * Option values are stable ids (stored with the triage). Labels are patient wording.
 */

export type QuestionOption = {
  value: string;
  label: string;
  /** Worth a closer look. The stub treats it as "urgent"; the real agent sees the label. */
  concerning?: true;
};

export type Question = {
  id: string;
  /** The question as the patient reads it. */
  text: string;
  /** Short name for the summary card. */
  label: string;
  kind: "single" | "multi";
  options: QuestionOption[];
};

/** Exclusive "none" option, ends every multi-select question. */
export const NONE_OPTION: QuestionOption = { value: "none", label: "None of these" };

const ALSO = "Do you have any of these as well?";

export const QUESTION_BANK: Record<Pathway, Question[]> = {
  Cardiology: [
    {
      id: "heart_trigger",
      text: "When do you notice it?",
      label: "When",
      kind: "single",
      options: [
        { value: "with_activity", label: "When I'm active or climbing stairs" },
        { value: "at_rest", label: "When I'm resting" },
        { value: "comes_and_goes", label: "It comes and goes for no clear reason" },
      ],
    },
    {
      id: "heart_also",
      text: ALSO,
      label: "Also",
      kind: "multi",
      options: [
        { value: "shortness_of_breath", label: "Shortness of breath", concerning: true },
        { value: "dizziness_fainting", label: "Dizziness or fainting", concerning: true },
        {
          value: "radiating_pain",
          label: "Pain that spreads to arm, jaw or back",
          concerning: true,
        },
        { value: "palpitations", label: "A racing or fluttering heartbeat" },
        NONE_OPTION,
      ],
    },
    {
      id: "heart_history",
      text: "Has a doctor told you that you have a heart condition or high blood pressure?",
      label: "History",
      kind: "single",
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
        { value: "not_sure", label: "I'm not sure" },
      ],
    },
  ],

  Pulmonology: [
    {
      id: "lung_breathing",
      text: "How is your breathing?",
      label: "Breathing",
      kind: "single",
      options: [
        { value: "fine", label: "Fine, apart from the cough" },
        { value: "short_when_active", label: "I get short of breath when I'm active" },
        {
          value: "shortness_of_breath",
          label: "I'm short of breath even when resting",
          concerning: true,
        },
      ],
    },
    {
      id: "lung_also",
      text: ALSO,
      label: "Also",
      kind: "multi",
      options: [
        { value: "wheezing", label: "Wheezing or a whistling sound" },
        { value: "fever", label: "Fever", concerning: true },
        { value: "mucus", label: "Coughing up mucus or phlegm" },
        {
          value: "night_sweats_weight_loss",
          label: "Night sweats or losing weight without trying",
          concerning: true,
        },
        NONE_OPTION,
      ],
    },
    {
      id: "lung_smoking",
      text: "Do you smoke?",
      label: "Smoking",
      kind: "single",
      options: [
        { value: "smoker", label: "Yes" },
        { value: "ex_smoker", label: "I used to" },
        { value: "never", label: "Never" },
      ],
    },
  ],

  Gastroenterology: [
    {
      id: "gi_location",
      text: "Where do you feel it most?",
      label: "Where",
      kind: "single",
      options: [
        { value: "upper_stomach", label: "Upper stomach" },
        { value: "lower_belly", label: "Lower belly" },
        { value: "whole_belly", label: "All over my belly" },
        { value: "behind_breastbone", label: "A burning feeling behind my breastbone" },
      ],
    },
    {
      id: "gi_also",
      text: ALSO,
      label: "Also",
      kind: "multi",
      options: [
        { value: "nausea_vomiting", label: "Nausea or vomiting" },
        { value: "fever", label: "Fever", concerning: true },
        { value: "bowel_changes", label: "Diarrhea or constipation" },
        {
          value: "blood_in_stool",
          label: "Blood in my stool, or black stool",
          concerning: true,
        },
        { value: "weight_loss", label: "Losing weight without trying", concerning: true },
        NONE_OPTION,
      ],
    },
    {
      id: "gi_meals",
      text: "Does it have anything to do with eating?",
      label: "Meals",
      kind: "single",
      options: [
        { value: "after_eating", label: "It starts or gets worse after eating" },
        { value: "empty_stomach", label: "It's worse on an empty stomach" },
        { value: "no_link", label: "No link that I can see" },
      ],
    },
  ],

  Dietetics: [
    {
      id: "diet_goal",
      text: "What would you like help with?",
      label: "Goal",
      kind: "single",
      options: [
        { value: "weight_loss", label: "Losing weight" },
        { value: "weight_gain", label: "Gaining weight" },
        { value: "intolerance", label: "A food allergy or intolerance" },
        {
          value: "medical_diet",
          label: "A diet for a health condition, like diabetes or high cholesterol",
        },
        { value: "healthy_eating", label: "Eating healthier in general" },
      ],
    },
    {
      id: "diet_conditions",
      text: "Do you have any of these?",
      label: "Conditions",
      kind: "multi",
      options: [
        { value: "diabetes", label: "Diabetes" },
        { value: "cholesterol_bp", label: "High cholesterol or high blood pressure" },
        { value: "digestive", label: "A digestive condition, like coeliac disease or IBS" },
        {
          value: "trouble_eating",
          label: "Trouble eating, or keeping food down",
          concerning: true,
        },
        NONE_OPTION,
      ],
    },
    {
      id: "diet_weight_change",
      text: "Has your weight changed without you trying?",
      label: "Weight",
      kind: "single",
      options: [
        { value: "lost_unintentionally", label: "Yes, I've lost weight", concerning: true },
        { value: "gained_unintentionally", label: "Yes, I've gained weight" },
        { value: "no", label: "No" },
      ],
    },
  ],

  "General Practice": [
    {
      id: "gp_also",
      text: ALSO,
      label: "Also",
      kind: "multi",
      options: [
        { value: "fever", label: "Fever", concerning: true },
        { value: "fatigue", label: "Feeling very tired" },
        { value: "dizziness_fainting", label: "Dizziness or fainting", concerning: true },
        { value: "weight_loss", label: "Losing weight without trying", concerning: true },
        NONE_OPTION,
      ],
    },
    {
      id: "gp_medicines",
      text: "Are you taking any regular medicines?",
      label: "Medicines",
      kind: "single",
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
      ],
    },
  ],
};

export const questionsFor = (category: Pathway): Question[] => QUESTION_BANK[category];

/** Returns an error message, or null when the answers fit the category's questions. */
export function validateAnswers(category: Pathway, answers: Answers): string | null {
  const questions = questionsFor(category);
  const known = new Set(questions.map((q) => q.id));

  if (Object.keys(answers).some((id) => !known.has(id))) {
    return "These answers don't match the questions for this category.";
  }

  for (const question of questions) {
    const given = answers[question.id];
    if (!given) return `Answer every question (missing: ${question.label}).`;

    const allowed = new Set(question.options.map((o) => o.value));
    if (given.some((value) => !allowed.has(value))) {
      return `Unknown option for: ${question.label}.`;
    }
    if (question.kind === "single" && given.length !== 1) {
      return `Choose one option for: ${question.label}.`;
    }
    if (given.includes(NONE_OPTION.value) && given.length > 1) {
      return `"${NONE_OPTION.label}" cannot be combined with other options.`;
    }
  }
  return null;
}

export type AnsweredQuestion = {
  question: Question;
  /** Chosen options, in the order the bank lists them. */
  chosen: QuestionOption[];
};

/** Joins stored answers back to their questions, skipping anything not in the bank. */
export function describeAnswers(category: Pathway, answers: Answers): AnsweredQuestion[] {
  return questionsFor(category).flatMap((question) => {
    const given = answers[question.id];
    if (!given) return [];
    const chosen = question.options.filter((option) => given.includes(option.value));
    return chosen.length ? [{ question, chosen }] : [];
  });
}

/** True when any question was answered with one of these option values. */
export function hasAnswer(answers: Answers | undefined, ...values: string[]): boolean {
  if (!answers) return false;
  return Object.values(answers).some((given) => given.some((value) => values.includes(value)));
}

/** True when the patient picked any option marked as concerning. */
export function hasConcerningAnswer(category: Pathway | undefined, answers: Answers | undefined) {
  if (!category || !answers) return false;
  return describeAnswers(category, answers).some(({ chosen }) =>
    chosen.some((option) => option.concerning),
  );
}
