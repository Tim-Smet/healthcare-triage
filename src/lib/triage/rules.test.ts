import { describe, expect, it } from "vitest";
import { evaluateRules } from "./rules";
import type { TriageInput } from "./schema";
import { makeInput } from "./test-helpers";

describe("evaluateRules", () => {
  it("returns null for a non-alarming input", () => {
    expect(evaluateRules(makeInput())).toBeNull();
  });

  it.each<[string, Partial<TriageInput>]>([
    ["chest-pain-with-breathlessness", { text: "chest pain", answers: { heart_also: ["shortness_of_breath"] } }],
    ["chest-pain-radiating", { text: "tight chest", answers: { heart_also: ["radiating_pain"] } }],
    ["chest-pain-with-fainting", { text: "chest pressure", answers: { heart_also: ["dizziness_fainting"] } }],
    ["severe-chest-pain", { text: "my chest hurts", severity: "severe" }],
    ["crushing-chest-pain", { text: "it feels like an elephant on my chest" }],
    ["severe-breathlessness", { text: "I can't breathe" }],
    ["severe-breathlessness", { text: "winded", severity: "severe", answers: { lung_breathing: ["shortness_of_breath"] } }],
    ["stroke-signs", { text: "my face is drooping" }],
    ["stroke-signs", { text: "my left arm feels weak" }],
    ["coughing-or-vomiting-blood", { text: "I am coughing up blood" }],
    ["fainted-or-unconscious", { text: "I passed out this morning" }],
  ])("flags %s", (ruleId, overrides) => {
    expect(evaluateRules(makeInput(overrides))?.ruleId).toBe(ruleId);
  });

  it("is case-insensitive", () => {
    expect(evaluateRules(makeInput({ text: "I CAN'T BREATHE" }))?.ruleId).toBe("severe-breathlessness");
  });

  it("does not flag chest pain alone when mild with no other signs", () => {
    expect(evaluateRules(makeInput({ text: "slight chest ache" }))).toBeNull();
  });

  it("does not flag breathlessness unless it is severe", () => {
    const input = makeInput({ text: "a bit winded", severity: "moderate", answers: { lung_breathing: ["shortness_of_breath"] } });
    expect(evaluateRules(input)).toBeNull();
  });

  it("returns the first matching rule when several match", () => {
    const input = makeInput({ text: "chest pain, I can't breathe", answers: { heart_also: ["shortness_of_breath"] } });
    expect(evaluateRules(input)?.ruleId).toBe("chest-pain-with-breathlessness");
  });

  // Known limit, documented on purpose: the rules don't read negation, so this errs towards
  // "emergency". If this ever starts returning null, the rules got smarter: update the test.
  it("flags negated chest pain too (known limit: no negation handling)", () => {
    const input = makeInput({ text: "I have no chest pain", severity: "severe" });
    expect(evaluateRules(input)?.ruleId).toBe("severe-chest-pain");
  });

  it("works on the text alone, before any question is answered (screening)", () => {
    expect(evaluateRules({ text: "I can't breathe" })?.ruleId).toBe("severe-breathlessness");
    expect(evaluateRules({ text: "a dry cough" })).toBeNull();
  });

  it("returns the pathway and a reason for the emergency screen", () => {
    const match = evaluateRules(makeInput({ text: "I can't breathe" }));
    expect(match).toMatchObject({ pathway: "Pulmonology" });
    expect(match?.reason).toBeTruthy();
  });
});
