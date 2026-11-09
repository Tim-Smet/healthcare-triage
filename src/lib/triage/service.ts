import { randomUUID } from "node:crypto";
import { z } from "zod";
import { assessWithStub, type AssessFn } from "./ai-stub";
import { maxUrgency } from "./merge";
import { evaluateRules } from "./rules";
import {
  AiAssessmentSchema,
  type AiAssessment,
  type Pathway,
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

/** Postgres (Neon) when DATABASE_URL is set, otherwise in-memory for local development. */
const storeDefault: TriageStore = {
  async save(record) {
    return (await resolveStore()).save(record);
  },
  async get(id) {
    return (await resolveStore()).get(id);
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

const defaultDeps: Deps = { assess: assessDefault, store: storeDefault };

type RecordFields = Omit<TriageRecord, "id" | "input" | "createdAt">;

function buildRecord(input: TriageInput, fields: RecordFields): TriageRecord {
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
    reason: null,
    source: "ai",
  };
}

/**
 * The triage flow:
 *   1. red-flag rules (deterministic) -> emergency, AI is skipped
 *   2. AI assessment, validated against the schema
 *   3. urgency = max(rules, AI); the AI can raise urgency, never lower it
 *   4. if the AI fails, fall back to a safe default so the patient still gets guidance
 */
export async function runTriage(
  input: TriageInput,
  deps: Deps = defaultDeps,
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
