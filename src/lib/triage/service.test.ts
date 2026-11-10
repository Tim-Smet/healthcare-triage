import { describe, expect, it, vi } from "vitest";
import type { AssessFn, ScreenFn } from "./ai-stub";
import { type AiAssessment, type AiScreening, type TriageRecord } from "./schema";
import { getTriage, listTriages, runTriage, screenTriage } from "./service";
import type { TriageStore } from "./store";
import { makeInput } from "./test-helpers";

function fakeStore() {
  const saved = new Map<string, TriageRecord>();
  const store: TriageStore = {
    save: vi.fn(async (r) => void saved.set(r.id, r)),
    get: vi.fn(async (id) => saved.get(id) ?? null),
    list: vi.fn(async (limit) => [...saved.values()].reverse().slice(0, limit)),
  };
  return { store, saved };
}

const assessment = (overrides: Partial<AiAssessment> = {}): AiAssessment => ({
  urgency: "routine",
  rankedPathways: [
    { pathway: "Gastroenterology", rationale: "a" },
    { pathway: "General Practice", rationale: "b" },
  ],
  consultationType: "check-up",
  nextSteps: ["Book an appointment", "Bring your medication list"],
  reason: "You told us about a burning feeling after meals, which fits a digestive cause.",
  ...overrides,
});

describe("runTriage", () => {
  it("returns an emergency from the rules and never calls the AI", async () => {
    const assess = vi.fn<AssessFn>();
    const { store } = fakeStore();

    const record = await runTriage(makeInput({ text: "I can't breathe" }), { assess, store });

    expect(assess).not.toHaveBeenCalled();
    expect(record).toMatchObject({
      urgency: "emergency",
      next: "emergency",
      source: "rules",
      pathway: "Pulmonology",
      consultationType: "emergency-assessment",
    });
    expect(record.reason).toBeTruthy();
  });

  it("uses the AI result when no rule matches", async () => {
    const { store } = fakeStore();
    const record = await runTriage(makeInput(), { assess: async () => assessment(), store });

    expect(record).toMatchObject({
      urgency: "routine",
      next: "schedule",
      source: "ai",
      pathway: "Gastroenterology",
      rankedPathways: ["Gastroenterology", "General Practice"],
      consultationType: "check-up",
      nextSteps: ["Book an appointment", "Bring your medication list"],
      reason: "You told us about a burning feeling after meals, which fits a digestive cause.",
    });
  });

  it("escalates to the emergency screen when the AI says emergency", async () => {
    const { store } = fakeStore();
    const record = await runTriage(makeInput(), {
      assess: async () => assessment({ urgency: "emergency" }),
      store,
    });

    expect(record).toMatchObject({ urgency: "emergency", next: "emergency", source: "ai" });
    expect(record.reason).toBeTruthy();
  });

  it("falls back to a safe urgent GP result when the AI throws", async () => {
    const { store } = fakeStore();
    const record = await runTriage(makeInput(), {
      assess: async () => {
        throw new Error("boom");
      },
      store,
    });

    expect(record).toMatchObject({ urgency: "urgent", pathway: "General Practice", source: "fallback" });
  });

  it("falls back when the AI returns data that fails validation", async () => {
    const { store } = fakeStore();
    const bad = { urgency: "whenever" } as unknown as AiAssessment;
    const record = await runTriage(makeInput(), { assess: async () => bad, store });

    expect(record.source).toBe("fallback");
  });

  it("saves exactly the record it returns, with the original input", async () => {
    const { store, saved } = fakeStore();
    const input = makeInput({ text: "stomach ache" });
    const record = await runTriage(input, { assess: async () => assessment(), store });

    expect(store.save).toHaveBeenCalledOnce();
    expect(saved.get(record.id)).toEqual(record);
    expect(record.input).toEqual(input);
    expect(new Date(record.createdAt).toString()).not.toBe("Invalid Date");
  });
});

const screening = (overrides: Partial<AiScreening> = {}): AiScreening => ({
  emergency: false,
  category: "Dietetics",
  ...overrides,
});

describe("screenTriage", () => {
  it("goes straight to the emergency screen on a red flag, without calling the AI", async () => {
    const screen = vi.fn<ScreenFn>();
    const { store, saved } = fakeStore();

    const result = await screenTriage("I can't breathe", { screen, store });

    expect(screen).not.toHaveBeenCalled();
    if (result.next !== "emergency") throw new Error("expected emergency");
    expect(saved.get(result.id)).toMatchObject({
      urgency: "emergency",
      next: "emergency",
      source: "rules",
      pathway: "Pulmonology",
      input: { text: "I can't breathe" },
    });
  });

  it("goes to the emergency screen when the AI flags one", async () => {
    const { store, saved } = fakeStore();

    const result = await screenTriage("something frightening", {
      screen: async () => screening({ emergency: true, category: "Cardiology" }),
      store,
    });

    if (result.next !== "emergency") throw new Error("expected emergency");
    expect(saved.get(result.id)).toMatchObject({
      urgency: "emergency",
      source: "ai",
      pathway: "Cardiology",
      input: { text: "something frightening", category: "Cardiology" },
    });
  });

  it("returns the category to ask questions for, and saves nothing yet", async () => {
    const { store } = fakeStore();

    const result = await screenTriage("I want to eat healthier", {
      screen: async () => screening(),
      store,
    });

    expect(result).toEqual({ next: "questions", category: "Dietetics" });
    expect(store.save).not.toHaveBeenCalled();
  });

  it.each([
    ["throws", async () => { throw new Error("boom"); }],
    ["returns invalid data", async () => ({ emergency: "maybe" }) as unknown as AiScreening],
  ])("asks the General Practice questions when the AI %s", async (_name, screen) => {
    const { store } = fakeStore();
    expect(await screenTriage("a cough", { screen, store })).toEqual({
      next: "questions",
      category: "General Practice",
    });
  });
});

describe("getTriage", () => {
  it("returns a saved record", async () => {
    const { store } = fakeStore();
    const record = await runTriage(makeInput(), { assess: async () => assessment(), store });

    expect(await getTriage(record.id, { store })).toEqual(record);
  });

  it("returns null for an unknown uuid", async () => {
    const { store } = fakeStore();
    expect(await getTriage(crypto.randomUUID(), { store })).toBeNull();
  });

  it("returns null for a non-uuid without touching the store", async () => {
    const { store } = fakeStore();
    expect(await getTriage("not-a-uuid", { store })).toBeNull();
    expect(store.get).not.toHaveBeenCalled();
  });
});

describe("listTriages", () => {
  it("returns saved triages through the store", async () => {
    const { store } = fakeStore();
    const record = await runTriage(makeInput(), { assess: async () => assessment(), store });

    expect(await listTriages(10, { store })).toEqual([record]);
  });
});
