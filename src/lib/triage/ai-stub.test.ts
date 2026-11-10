import { describe, expect, it } from "vitest";
import { assessWithStub, screenWithStub } from "./ai-stub";
import { AiAssessmentSchema } from "./schema";
import { makeInput } from "./test-helpers";

describe("assessWithStub", () => {
  it("always returns a schema-valid assessment", async () => {
    const result = await assessWithStub(makeInput());
    expect(AiAssessmentSchema.safeParse(result).success).toBe(true);
  });

  it("ranks the keyword-matched pathway first and General Practice last", async () => {
    const result = await assessWithStub(makeInput({ text: "I keep coughing and my heart races", category: "Cardiology" }));
    expect(result.rankedPathways.map((p) => p.pathway)).toEqual([
      "Cardiology",
      "Pulmonology",
      "General Practice",
    ]);
  });

  it("puts the screened category first, even when the keywords say otherwise", async () => {
    const result = await assessWithStub(makeInput({ text: "my chest hurts", category: "Dietetics" }));
    expect(result.rankedPathways.map((p) => p.pathway)).toEqual([
      "Dietetics",
      "Cardiology",
      "General Practice",
    ]);
    expect(result.consultationType).toBe("diet-consultation");
  });

  it("falls back to General Practice when nothing matches", async () => {
    const result = await assessWithStub(makeInput({ text: "itchy elbow" }));
    expect(result.rankedPathways.map((p) => p.pathway)).toEqual(["General Practice"]);
    expect(result.consultationType).toBe("first-appointment");
  });

  it("is routine for mild symptoms with nothing concerning", async () => {
    expect((await assessWithStub(makeInput())).urgency).toBe("routine");
  });

  it("is urgent for severe symptoms or a concerning answer", async () => {
    expect((await assessWithStub(makeInput({ severity: "severe" }))).urgency).toBe("urgent");
    expect((await assessWithStub(makeInput({ answers: { gp_also: ["fever"], gp_medicines: ["no"] } }))).urgency).toBe("urgent");
  });

  it("books a cardiography for urgent heart complaints", async () => {
    const result = await assessWithStub(makeInput({ text: "palpitations", category: "Cardiology", severity: "moderate" }));
    expect(result).toMatchObject({ urgency: "urgent", consultationType: "cardiography" });
  });
});

describe("screenWithStub", () => {
  it.each([
    ["my chest feels tight", "Cardiology"],
    ["I keep coughing", "Pulmonology"],
    ["stomach pain after eating", "Gastroenterology"],
    ["I want to lose weight and change my diet", "Dietetics"],
    ["itchy elbow", "General Practice"],
  ])("picks a category for %j", async (text, category) => {
    expect(await screenWithStub(text)).toEqual({ emergency: false, category });
  });
});
