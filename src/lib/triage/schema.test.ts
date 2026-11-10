import { describe, expect, it } from "vitest";
import { AiAssessmentSchema, TriageInputSchema } from "./schema";
import { makeInput } from "./test-helpers";

describe("TriageInputSchema", () => {
  it("accepts a valid input and trims the text", () => {
    const parsed = TriageInputSchema.parse(makeInput({ text: "  sore throat  " }));
    expect(parsed.text).toBe("sore throat");
  });

  it("rejects empty or whitespace-only text", () => {
    expect(TriageInputSchema.safeParse(makeInput({ text: "   " })).success).toBe(false);
  });

  it("rejects text over 2000 characters", () => {
    expect(TriageInputSchema.safeParse(makeInput({ text: "a".repeat(2001) })).success).toBe(false);
    expect(TriageInputSchema.safeParse(makeInput({ text: "a".repeat(2000) })).success).toBe(true);
  });

  it("rejects an empty associated list", () => {
    expect(TriageInputSchema.safeParse(makeInput({ associated: [] })).success).toBe(false);
  });

  it('rejects "none" combined with another symptom', () => {
    expect(TriageInputSchema.safeParse(makeInput({ associated: ["none", "fever"] })).success).toBe(false);
  });

  it("rejects unknown enum values", () => {
    expect(TriageInputSchema.safeParse({ ...makeInput(), severity: "catastrophic" }).success).toBe(false);
  });
});

describe("AiAssessmentSchema", () => {
  const valid = {
    urgency: "urgent",
    rankedPathways: [{ pathway: "Cardiology", rationale: "x" }],
    consultationType: "check-up",
    nextSteps: ["one", "two"],
  };

  it("accepts a valid assessment", () => {
    expect(AiAssessmentSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects empty pathways, empty steps and more than 4 steps", () => {
    expect(AiAssessmentSchema.safeParse({ ...valid, rankedPathways: [] }).success).toBe(false);
    expect(AiAssessmentSchema.safeParse({ ...valid, nextSteps: [] }).success).toBe(false);
    expect(AiAssessmentSchema.safeParse({ ...valid, nextSteps: ["1", "2", "3", "4"] }).success).toBe(false);
  });
});
