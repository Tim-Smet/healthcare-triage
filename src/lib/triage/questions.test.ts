import { describe, expect, it } from "vitest";
import {
  QUESTION_BANK,
  describeAnswers,
  hasAnswer,
  hasConcerningAnswer,
  validateAnswers,
} from "./questions";
import { PATHWAYS } from "./schema";

describe("QUESTION_BANK", () => {
  it.each(PATHWAYS)("%s has 2 to 3 well-formed questions", (category) => {
    const questions = QUESTION_BANK[category];
    expect(questions.length).toBeGreaterThanOrEqual(2);
    expect(questions.length).toBeLessThanOrEqual(3);

    for (const q of questions) {
      const values = q.options.map((o) => o.value);
      expect(new Set(values).size).toBe(values.length);
      // Multi-select questions must offer an exclusive way out.
      if (q.kind === "multi") expect(values.at(-1)).toBe("none");
    }
  });

  it("uses unique question ids across categories", () => {
    const ids = PATHWAYS.flatMap((c) => QUESTION_BANK[c].map((q) => q.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});

const dietAnswers = {
  diet_goal: ["weight_loss"],
  diet_conditions: ["diabetes", "cholesterol_bp"],
  diet_weight_change: ["no"],
};

describe("validateAnswers", () => {
  it("accepts a complete, valid set", () => {
    expect(validateAnswers("Dietetics", dietAnswers)).toBeNull();
  });

  it("rejects missing questions, unknown ids and unknown options", () => {
    expect(validateAnswers("Dietetics", { diet_goal: ["weight_loss"] })).toMatch(/Answer every/);
    expect(validateAnswers("Dietetics", { ...dietAnswers, extra: ["x"] })).toMatch(/don't match/);
    expect(validateAnswers("Dietetics", { ...dietAnswers, diet_goal: ["nope"] })).toMatch(/Unknown/);
  });

  it("rejects answers that belong to another category", () => {
    expect(validateAnswers("Cardiology", dietAnswers)).toMatch(/don't match/);
  });

  it("rejects two options on a single-choice question", () => {
    expect(
      validateAnswers("Dietetics", { ...dietAnswers, diet_goal: ["weight_loss", "weight_gain"] }),
    ).toMatch(/Choose one/);
  });

  it('rejects "none" combined with another option', () => {
    expect(
      validateAnswers("Dietetics", { ...dietAnswers, diet_conditions: ["none", "diabetes"] }),
    ).toMatch(/cannot be combined/);
  });
});

describe("answer helpers", () => {
  it("describeAnswers joins answers to labels, in bank order", () => {
    const [goal, conditions] = describeAnswers("Dietetics", dietAnswers);
    expect(goal.question.label).toBe("Goal");
    expect(goal.chosen.map((o) => o.label)).toEqual(["Losing weight"]);
    expect(conditions.chosen).toHaveLength(2);
  });

  it("hasAnswer finds a value in any question", () => {
    expect(hasAnswer({ heart_also: ["radiating_pain"] }, "radiating_pain")).toBe(true);
    expect(hasAnswer({ heart_also: ["none"] }, "radiating_pain")).toBe(false);
    expect(hasAnswer(undefined, "radiating_pain")).toBe(false);
  });

  it("hasConcerningAnswer is true only for options marked concerning", () => {
    expect(hasConcerningAnswer("Dietetics", { ...dietAnswers, diet_weight_change: ["lost_unintentionally"] })).toBe(true);
    expect(hasConcerningAnswer("Dietetics", dietAnswers)).toBe(false);
    expect(hasConcerningAnswer(undefined, undefined)).toBe(false);
  });
});
