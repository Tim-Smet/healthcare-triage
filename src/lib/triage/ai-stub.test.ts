import { describe, expect, it } from "vitest";
import { assessWithStub } from "./ai-stub";
import { AiAssessmentSchema } from "./schema";
import { makeInput } from "./test-helpers";

describe("assessWithStub", () => {
  it("always returns a schema-valid assessment", async () => {
    const result = await assessWithStub(makeInput());
    expect(AiAssessmentSchema.safeParse(result).success).toBe(true);
  });

  it("ranks the keyword-matched pathway first and General Practice last", async () => {
    const result = await assessWithStub(makeInput({ text: "I keep coughing and my heart races" }));
    expect(result.rankedPathways.map((p) => p.pathway)).toEqual([
      "Cardiology",
      "Pulmonology",
      "General Practice",
    ]);
  });

  it("falls back to General Practice when nothing matches", async () => {
    const result = await assessWithStub(makeInput({ text: "itchy elbow" }));
    expect(result.rankedPathways.map((p) => p.pathway)).toEqual(["General Practice"]);
    expect(result.consultationType).toBe("first-appointment");
  });

  it("is routine for mild symptoms with no associated symptoms", async () => {
    expect((await assessWithStub(makeInput())).urgency).toBe("routine");
  });

  it("is urgent for severe symptoms or any associated symptom", async () => {
    expect((await assessWithStub(makeInput({ severity: "severe" }))).urgency).toBe("urgent");
    expect((await assessWithStub(makeInput({ associated: ["fever"] }))).urgency).toBe("urgent");
  });

  it("books a cardiography for urgent heart complaints", async () => {
    const result = await assessWithStub(makeInput({ text: "palpitations", severity: "moderate" }));
    expect(result).toMatchObject({ urgency: "urgent", consultationType: "cardiography" });
  });
});
