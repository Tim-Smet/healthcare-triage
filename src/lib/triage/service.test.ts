import { describe, expect, it, vi } from "vitest";
import type { AssessFn } from "./ai-stub";
import { type AiAssessment, type TriageRecord } from "./schema";
import { getTriage, runTriage } from "./service";
import type { TriageStore } from "./store";
import { makeInput } from "./test-helpers";

function fakeStore() {
  const saved = new Map<string, TriageRecord>();
  const store: TriageStore = {
    save: vi.fn(async (r) => void saved.set(r.id, r)),
    get: vi.fn(async (id) => saved.get(id) ?? null),
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
      reason: null,
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
