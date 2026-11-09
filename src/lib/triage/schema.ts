import { z } from "zod";

/**
 * The shared contract for the whole app: UI form, API request/response,
 * AI agent output and (later) the database row all use these schemas.
 */

// ---------- Input ----------

export const DURATIONS = ["lt_day", "few_days", "few_weeks", "months_plus"] as const;
export const SEVERITIES = ["mild", "moderate", "severe"] as const;
export const ASSOCIATED_SYMPTOMS = [
  "shortness_of_breath",
  "dizziness_fainting",
  "fever",
  "nausea_vomiting",
  "radiating_pain",
  "none",
] as const;

export const TriageInputSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Tell us what's bothering you so we can help.")
    .max(2000, "Please keep this under 2000 characters."),
  duration: z.enum(DURATIONS),
  severity: z.enum(SEVERITIES),
  associated: z
    .array(z.enum(ASSOCIATED_SYMPTOMS))
    .min(1, "Select at least one option.")
    .refine((list) => !list.includes("none") || list.length === 1, {
      message: '"None of these" cannot be combined with other options.',
    }),
});

export type TriageInput = z.infer<typeof TriageInputSchema>;
export type AssociatedSymptom = (typeof ASSOCIATED_SYMPTOMS)[number];

// ---------- Output ----------

export const URGENCIES = ["emergency", "urgent", "routine"] as const;
export const PATHWAYS = [
  "Cardiology",
  "Pulmonology",
  "Gastroenterology",
  "General Practice",
] as const;
export const NEXT_ACTIONS = ["emergency", "schedule"] as const;
export const CONSULTATION_TYPES = [
  "emergency-assessment",
  "first-appointment",
  "check-up",
  "cardiography",
  "lung-function-test",
] as const;
export const RESULT_SOURCES = ["rules", "ai", "fallback"] as const;

export const UrgencySchema = z.enum(URGENCIES);
export const PathwaySchema = z.enum(PATHWAYS);
export const ConsultationTypeSchema = z.enum(CONSULTATION_TYPES);

export type Urgency = z.infer<typeof UrgencySchema>;
export type Pathway = z.infer<typeof PathwaySchema>;
export type ConsultationType = z.infer<typeof ConsultationTypeSchema>;

/** What the AI agent must return. The rules layer never trusts it to lower urgency. */
export const AiAssessmentSchema = z.object({
  urgency: UrgencySchema,
  rankedPathways: z
    .array(z.object({ pathway: PathwaySchema, rationale: z.string() }))
    .min(1),
  consultationType: ConsultationTypeSchema,
  nextSteps: z.array(z.string()).min(1).max(4),
});

export type AiAssessment = z.infer<typeof AiAssessmentSchema>;

/**
 * What a hospital system consumes (id, urgency, pathway, next, consultationType)
 * plus the extra fields the UI needs.
 */
export const TriageResultSchema = z.object({
  id: z.uuid(),
  urgency: UrgencySchema,
  pathway: PathwaySchema,
  next: z.enum(NEXT_ACTIONS),
  consultationType: ConsultationTypeSchema,
  rankedPathways: z.array(PathwaySchema).min(1),
  nextSteps: z.array(z.string()).min(1),
  /** Plain-language reason, shown on the emergency screen. */
  reason: z.string().nullable(),
  /** Which layer made the decision. */
  source: z.enum(RESULT_SOURCES),
});

export type TriageResult = z.infer<typeof TriageResultSchema>;

/** A stored triage: the result plus the patient input and a timestamp. */
export const TriageRecordSchema = TriageResultSchema.extend({
  input: TriageInputSchema,
  createdAt: z.iso.datetime(),
});

export type TriageRecord = z.infer<typeof TriageRecordSchema>;
