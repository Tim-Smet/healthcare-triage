import type {
  AssociatedSymptom,
  ConsultationType,
  Pathway,
  TriageInput,
  Urgency,
} from "./triage/schema";

/** Patient-facing wording for every enum value. Plain language, no jargon. */

export const DURATION_OPTIONS: Array<{ value: TriageInput["duration"]; label: string }> = [
  { value: "lt_day", label: "Less than a day" },
  { value: "few_days", label: "A few days" },
  { value: "few_weeks", label: "A few weeks" },
  { value: "months_plus", label: "Months or longer" },
];

export const SEVERITY_OPTIONS: Array<{ value: TriageInput["severity"]; label: string }> = [
  { value: "mild", label: "Mild: I can do everything as usual" },
  { value: "moderate", label: "Moderate: it gets in the way" },
  { value: "severe", label: "Severe: it's hard to do anything" },
];

export const ASSOCIATED_OPTIONS: Array<{ value: AssociatedSymptom; label: string }> = [
  { value: "shortness_of_breath", label: "Shortness of breath" },
  { value: "dizziness_fainting", label: "Dizziness or fainting" },
  { value: "fever", label: "Fever" },
  { value: "nausea_vomiting", label: "Nausea or vomiting" },
  { value: "radiating_pain", label: "Pain that spreads to arm, jaw or back" },
  { value: "none", label: "None of these" },
];

export const EXAMPLE_SYMPTOMS = ["Persistent cough", "Stomach pain after eating"];

const labelOf = <T extends string>(options: Array<{ value: T; label: string }>, value: T) =>
  options.find((option) => option.value === value)?.label ?? value;

export const durationLabel = (value: TriageInput["duration"]) =>
  labelOf(DURATION_OPTIONS, value);

/** "Mild: I can do everything as usual" -> "Mild" */
export const severityShortLabel = (value: TriageInput["severity"]) =>
  labelOf(SEVERITY_OPTIONS, value).split(":")[0];

export const associatedLabel = (value: AssociatedSymptom) =>
  labelOf(ASSOCIATED_OPTIONS, value);

export const URGENCY_LABEL: Record<Urgency, string> = {
  emergency: "Emergency",
  urgent: "Urgent",
  routine: "Routine",
};

/** "...with a heart specialist" */
export const SPECIALIST: Record<Pathway, string> = {
  Cardiology: "a heart specialist",
  Pulmonology: "a lung specialist",
  Gastroenterology: "a digestive health specialist",
  "General Practice": "a general practitioner",
};

/** Bold part of "Recommended: **a check-up** with a heart specialist" */
export const CONSULTATION_LABEL: Record<ConsultationType, string> = {
  "emergency-assessment": "an emergency assessment",
  "first-appointment": "a first appointment",
  "check-up": "a check-up",
  cardiography: "a heart tracing (cardiography)",
  "lung-function-test": "a lung function test",
};

/** Button labels name the action. */
export const SCHEDULE_CTA: Record<ConsultationType, string> = {
  "emergency-assessment": "Call your emergency number",
  "first-appointment": "Schedule a first appointment",
  "check-up": "Schedule a check-up",
  cardiography: "Schedule a heart tracing",
  "lung-function-test": "Schedule a lung function test",
};
