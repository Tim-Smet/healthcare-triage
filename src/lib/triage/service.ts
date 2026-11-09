import { randomUUID } from "node:crypto";
import { assessWithStub, type AssessFn } from "./ai-stub";
import { maxUrgency } from "./merge";
import { evaluateRules } from "./rules";
import {
  AiAssessmentSchema,
  type Pathway,
  type TriageInput,
  type TriageRecord,
} from "./schema";
import { memoryStore, type TriageStore } from "./store";

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

const defaultDeps: Deps = { assess: assessWithStub, store: memoryStore };

function emergencyRecord(
  input: TriageInput,
  pathway: Pathway,
  reason: string,
  source: "rules" | "ai",
): TriageRecord {
  return {
    id: randomUUID(),
    urgency: "emergency",
    pathway,
    next: "emergency",
    consultationType: "emergency-assessment",
    rankedPathways: [pathway],
    nextSteps: EMERGENCY_STEPS,
    reason,
    source,
    input,
    createdAt: new Date().toISOString(),
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

  let record: TriageRecord;

  if (match) {
    record = emergencyRecord(input, match.pathway, match.reason, "rules");
  } else {
    const assessment = await deps
      .assess(input)
      .then((raw) => AiAssessmentSchema.safeParse(raw))
      .then((parsed) => (parsed.success ? parsed.data : null))
      .catch(() => null);

    if (!assessment) {
      record = {
        id: randomUUID(),
        urgency: "urgent",
        pathway: "General Practice",
        next: "schedule",
        consultationType: "first-appointment",
        rankedPathways: ["General Practice"],
        nextSteps: FALLBACK_STEPS,
        reason: null,
        source: "fallback",
        input,
        createdAt: new Date().toISOString(),
      };
    } else {
      const pathways = assessment.rankedPathways.map((p) => p.pathway);
      // No rule matched, so the rules urgency is "routine" (the floor).
      const urgency = maxUrgency("routine", assessment.urgency);

      if (urgency === "emergency") {
        record = emergencyRecord(
          input,
          pathways[0],
          "Based on what you told us, you may need help right away.",
          "ai",
        );
      } else {
        record = {
          id: randomUUID(),
          urgency,
          pathway: pathways[0],
          next: "schedule",
          consultationType: assessment.consultationType,
          rankedPathways: pathways,
          nextSteps: assessment.nextSteps,
          reason: null,
          source: "ai",
          input,
          createdAt: new Date().toISOString(),
        };
      }
    }
  }

  await deps.store.save(record);
  return record;
}

export async function getTriage(
  id: string,
  deps: Pick<Deps, "store"> = defaultDeps,
): Promise<TriageRecord | null> {
  return deps.store.get(id);
}
