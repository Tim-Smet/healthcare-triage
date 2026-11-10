import { randomUUID } from "node:crypto";
import { z } from "zod";
import { assessWithStub, screenWithStub, type AssessFn, type ScreenFn } from "./ai-stub";
import { maxUrgency } from "./merge";
import { evaluateRules } from "./rules";
import {
  AiAssessmentSchema,
  AiScreeningSchema,
  type AiAssessment,
  type AiScreening,
  type Pathway,
  type ScreenResult,
  type StoredInput,
  type TriageInput,
  type TriageRecord,
} from "./schema";
import { memoryStore, type TriageStore } from "./store";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

const EMERGENCY_STEPS = [
  "Sit down and try to stay calm.",
  "Unlock your front door if you can.",
  "Don't drive yourself to the hospital.",
];

const FALLBACK_STEPS = [
  "We couldn't fully assess your symptoms, so we suggest seeing a general practitioner.",
  "Book an appointment in the next few days.",
  "If you feel worse, call your local emergency number.",
];

type Deps = {
  assess: AssessFn;
  screen: ScreenFn;
  store: TriageStore;
};

/**
 * Uses the Mastra agent when an API key is configured, otherwise the stub, so
 * the app still runs locally without one. Loaded lazily to keep Mastra out of
 * the way until it is needed.
 */
const assessDefault: AssessFn = async (input) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    // In production a missing key must not quietly downgrade to the keyword stub.
    // The error is caught by `assessSafely`, which uses the safe fallback result.
    if (IS_PRODUCTION) throw new Error("ANTHROPIC_API_KEY is not set");
    return assessWithStub(input);
  }
  const { assessWithMastra } = await import("@/lib/mastra/agent");
  return assessWithMastra(input);
};

/** Same key rules as `assessDefault`, for the screening agent. */
const screenDefault: ScreenFn = async (text) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    if (IS_PRODUCTION) throw new Error("ANTHROPIC_API_KEY is not set");
    return screenWithStub(text);
  }
  const { screenWithMastra } = await import("@/lib/mastra/agent");
  return screenWithMastra(text);
};

/** Postgres (Neon) when DATABASE_URL is set, otherwise in-memory for local development. */
const storeDefault: TriageStore = {
  async save(record) {
    return (await resolveStore()).save(record);
  },
  async get(id) {
    return (await resolveStore()).get(id);
  },
  async list(limit) {
    return (await resolveStore()).list(limit);
  },
};

let resolved: TriageStore | undefined;
async function resolveStore(): Promise<TriageStore> {
  if (resolved) return resolved;
  const url = process.env.DATABASE_URL;
  if (!url) {
    // In-memory results vanish between serverless instances, so never use them in production.
    if (IS_PRODUCTION) throw new Error("DATABASE_URL is not set");
    return (resolved = memoryStore);
  }
  const { createPostgresStore } = await import("@/lib/db/store");
  return (resolved = createPostgresStore(url));
}

const defaultDeps: Deps = { assess: assessDefault, screen: screenDefault, store: storeDefault };

type RecordFields = Omit<TriageRecord, "id" | "input" | "createdAt">;

function buildRecord(input: StoredInput, fields: RecordFields): TriageRecord {
  return { ...fields, id: randomUUID(), input, createdAt: new Date().toISOString() };
}

function emergencyFields(pathway: Pathway, reason: string, source: "rules" | "ai"): RecordFields {
  return {
    urgency: "emergency",
    pathway,
    next: "emergency",
    consultationType: "emergency-assessment",
    rankedPathways: [pathway],
    nextSteps: EMERGENCY_STEPS,
    reason,
    source,
  };
}

const FALLBACK_FIELDS: RecordFields = {
  urgency: "urgent",
  pathway: "General Practice",
  next: "schedule",
  consultationType: "first-appointment",
  rankedPathways: ["General Practice"],
  nextSteps: FALLBACK_STEPS,
  reason: null,
  source: "fallback",
};

/** Returns a validated assessment, or null if the AI failed or returned something invalid. */
async function assessSafely(assess: AssessFn, input: TriageInput): Promise<AiAssessment | null> {
  try {
    const parsed = AiAssessmentSchema.safeParse(await assess(input));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function fieldsFromAssessment(assessment: AiAssessment | null): RecordFields {
  if (!assessment) return FALLBACK_FIELDS;

  const pathways = assessment.rankedPathways.map((p) => p.pathway);
  // No rule matched, so the rules urgency is "routine" (the floor).
  const urgency = maxUrgency("routine", assessment.urgency);

  if (urgency === "emergency") {
    return emergencyFields(pathways[0], "Based on what you told us, you may need help right away.", "ai");
  }

  return {
    urgency,
    pathway: pathways[0],
    next: "schedule",
    consultationType: assessment.consultationType,
    rankedPathways: pathways,
    nextSteps: assessment.nextSteps,
    reason: assessment.reason,
    source: "ai",
  };
}

/** Returns a validated screening, or null if the AI failed or returned something invalid. */
async function screenSafely(screen: ScreenFn, text: string): Promise<AiScreening | null> {
  try {
    const parsed = AiScreeningSchema.safeParse(await screen(text));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/**
 * Step 1, on the free text alone, before any follow-up question:
 *   1. red-flag rules -> emergency record, the UI goes straight to the emergency screen
 *   2. AI screening -> emergency record, or the category that picks the follow-up questions
 *   3. if the AI fails, ask the General Practice questions so the patient is never stuck
 */
export async function screenTriage(
  text: string,
  deps: Pick<Deps, "screen" | "store"> = defaultDeps,
): Promise<ScreenResult> {
  const input: StoredInput = { text };

  const match = evaluateRules(input);
  if (match) {
    const record = buildRecord(input, emergencyFields(match.pathway, match.reason, "rules"));
    await deps.store.save(record);
    return { next: "emergency", id: record.id };
  }

  const screening = await screenSafely(deps.screen, text);
  if (screening?.emergency) {
    const fields = emergencyFields(
      screening.category,
      "Based on what you told us, you may need help right away.",
      "ai",
    );
    const record = buildRecord({ ...input, category: screening.category }, fields);
    await deps.store.save(record);
    return { next: "emergency", id: record.id };
  }

  return { next: "questions", category: screening?.category ?? "General Practice" };
}

/**
 * The triage flow:
 *   1. red-flag rules (deterministic, now with the follow-up answers) -> emergency, AI is skipped
 *   2. AI assessment, validated against the schema
 *   3. urgency = max(rules, AI); the AI can raise urgency, never lower it
 *   4. if the AI fails, fall back to a safe default so the patient still gets guidance
 */
export async function runTriage(
  input: TriageInput,
  deps: Pick<Deps, "assess" | "store"> = defaultDeps,
): Promise<TriageRecord> {
  const match = evaluateRules(input);
  const fields = match
    ? emergencyFields(match.pathway, match.reason, "rules")
    : fieldsFromAssessment(await assessSafely(deps.assess, input));

  const record = buildRecord(input, fields);
  await deps.store.save(record);
  return record;
}

export async function getTriage(
  id: string,
  deps: Pick<Deps, "store"> = defaultDeps,
): Promise<TriageRecord | null> {
  // The DB column is a uuid, so anything else would throw instead of "not found".
  if (!z.uuid().safeParse(id).success) return null;
  return deps.store.get(id);
}

/** The most recent triages, newest first. Read by the admin page. */
export async function listTriages(
  limit = 100,
  deps: Pick<Deps, "store"> = defaultDeps,
): Promise<TriageRecord[]> {
  return deps.store.list(limit);
}
