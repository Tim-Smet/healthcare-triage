import { describe, expect, it } from "vitest";
import {
  AiAssessmentSchema,
  AiScreeningSchema,
  ScreenInputSchema,
  StoredInputSchema,
  TriageInputSchema,
} from "./schema";
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

  it("rejects an answer with no chosen option", () => {
    expect(TriageInputSchema.safeParse(makeInput({ answers: { gp_also: [] } })).success).toBe(false);
  });

  it("rejects an unknown category", () => {
    expect(TriageInputSchema.safeParse({ ...makeInput(), category: "Dermatology" }).success).toBe(false);
  });

  it("rejects unknown enum values", () => {
    expect(TriageInputSchema.safeParse({ ...makeInput(), severity: "catastrophic" }).success).toBe(false);
  });
});

describe("ScreenInputSchema and StoredInputSchema", () => {
  it("screening needs only the text", () => {
    expect(ScreenInputSchema.safeParse({ text: "a cough" }).success).toBe(true);
    expect(ScreenInputSchema.safeParse({ text: " " }).success).toBe(false);
  });

  it("a stored record may stop after the text (emergency while screening)", () => {
    expect(StoredInputSchema.safeParse({ text: "can't breathe" }).success).toBe(true);
    expect(TriageInputSchema.safeParse({ text: "can't breathe" }).success).toBe(false);
  });
});

describe("AiScreeningSchema", () => {
  it("accepts a flag plus a category and rejects unknown categories", () => {
    expect(AiScreeningSchema.safeParse({ emergency: false, category: "Dietetics" }).success).toBe(true);
    expect(AiScreeningSchema.safeParse({ emergency: false, category: "Dermatology" }).success).toBe(false);
  });
});

describe("AiAssessmentSchema", () => {
  const valid = {
    urgency: "urgent",
    rankedPathways: [{ pathway: "Cardiology", rationale: "x" }],
    consultationType: "check-up",
    nextSteps: ["one", "two"],
    reason: "You told us x.",
  };

  it("accepts a valid assessment", () => {
    expect(AiAssessmentSchema.safeParse(valid).success).toBe(true);
  });

  it("requires a reason", () => {
    expect(AiAssessmentSchema.safeParse({ ...valid, reason: undefined }).success).toBe(false);
  });

  it("rejects empty pathways, empty steps and more than 4 steps", () => {
    expect(AiAssessmentSchema.safeParse({ ...valid, rankedPathways: [] }).success).toBe(false);
    expect(AiAssessmentSchema.safeParse({ ...valid, nextSteps: [] }).success).toBe(false);
    expect(AiAssessmentSchema.safeParse({ ...valid, nextSteps: ["1", "2", "3", "4"] }).success).toBe(false);
  });
});
