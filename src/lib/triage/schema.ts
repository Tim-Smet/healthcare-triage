import { z } from "zod";

/**
 * The shared contract for the whole app: UI form, API request/response,
 * AI agent output and (later) the database row all use these schemas.
 */

// ---------- Input ----------

export const PATHWAYS = [
  "Cardiology",
  "Pulmonology",
  "Gastroenterology",
  "Dietetics",
  "General Practice",
] as const;
export const PathwaySchema = z.enum(PATHWAYS);

export const DURATIONS = ["lt_day", "few_days", "few_weeks", "months_plus"] as const;
export const SEVERITIES = ["mild", "moderate", "severe"] as const;

const TextSchema = z
  .string()
  .trim()
  .min(1, "Tell us what's bothering you so we can help.")
  .max(2000, "Please keep this under 2000 characters.");

/** Step 1: only the free text. Sent to /api/triage/screen. */
export const ScreenInputSchema = z.object({ text: TextSchema });

/**
 * Answers to the category follow-up questions, keyed by question id. The values
 * are option values from the question bank (see `questions.ts`, which also
 * checks that they belong to the category).
 */
export const AnswersSchema = z.record(z.string(), z.array(z.string()).min(1));

/** Everything the patient filled in. Required by POST /api/triage. */
export const TriageInputSchema = z.object({
  text: TextSchema,
  /** Picked by the screening step, decides which follow-up questions were asked. */
  category: PathwaySchema,
  duration: z.enum(DURATIONS),
  severity: z.enum(SEVERITIES),
  answers: AnswersSchema,
});

/**
 * What a stored record keeps. An emergency found while screening ends the flow
 * early, so those records only have the text (and maybe the category).
 */
export const StoredInputSchema = TriageInputSchema.partial({
  category: true,
  duration: true,
  severity: true,
  answers: true,
});

export type TriageInput = z.infer<typeof TriageInputSchema>;
export type StoredInput = z.infer<typeof StoredInputSchema>;
export type Answers = z.infer<typeof AnswersSchema>;

// ---------- Output ----------

export const URGENCIES = ["emergency", "urgent", "routine"] as const;
export const NEXT_ACTIONS = ["emergency", "schedule"] as const;
export const CONSULTATION_TYPES = [
  "emergency-assessment",
  "first-appointment",
  "check-up",
  "cardiography",
  "lung-function-test",
  "diet-consultation",
] as const;
export const RESULT_SOURCES = ["rules", "ai", "fallback"] as const;

export const UrgencySchema = z.enum(URGENCIES);
export const ConsultationTypeSchema = z.enum(CONSULTATION_TYPES);

export type Urgency = z.infer<typeof UrgencySchema>;
export type Pathway = z.infer<typeof PathwaySchema>;
export type ConsultationType = z.infer<typeof ConsultationTypeSchema>;

/** What the AI agent must return. The rules layer never trusts it to lower urgency. */
export const AiAssessmentSchema = z.object({
  urgency: UrgencySchema.describe(
    '"emergency" = needs help right now, "urgent" = should be seen within a day or two, "routine" = can wait a few weeks. When unsure between two levels, choose the more urgent one.',
  ),
  rankedPathways: z
    .array(
      z.object({
        pathway: PathwaySchema.describe(
          'Use "General Practice" when no specialty clearly fits.',
        ),
        rationale: z
          .string()
          .describe("One plain-language sentence, in second person (you)."),
      }),
    )
    .min(1)
    .describe("Most likely pathway first."),
  consultationType: ConsultationTypeSchema.describe(
    'Use "emergency-assessment" only when urgency is "emergency".',
  ),
  nextSteps: z
    .array(z.string())
    .min(2)
    .max(3)
    .describe("Short, plain-language steps for the patient. No jargon."),
});

export type AiAssessment = z.infer<typeof AiAssessmentSchema>;

/** What the screening agent must return for the first free-text description. */
export const AiScreeningSchema = z.object({
  emergency: z
    .boolean()
    .describe(
      "true only when the description clearly suggests a life-threatening situation that needs help right now (for example crushing chest pain, struggling to breathe, stroke signs, heavy bleeding, collapse). When it is borderline, answer false: the patient still gets follow-up questions and a second check.",
    ),
  category: PathwaySchema.describe(
    'The kind of care that fits best. "Dietetics" is for food, weight, nutrition and diet questions. Use "General Practice" when no category clearly fits.',
  ),
});

export type AiScreening = z.infer<typeof AiScreeningSchema>;

/** What POST /api/triage/screen answers: stop on the emergency screen, or ask this category's questions. */
export const ScreenResultSchema = z.discriminatedUnion("next", [
  z.object({ next: z.literal("emergency"), id: z.uuid() }),
  z.object({ next: z.literal("questions"), category: PathwaySchema }),
]);

export type ScreenResult = z.infer<typeof ScreenResultSchema>;

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
  input: StoredInputSchema,
  createdAt: z.iso.datetime(),
});

export type TriageRecord = z.infer<typeof TriageRecordSchema>;
