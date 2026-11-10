import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./[id]/route";
import { POST as SCREEN } from "./screen/route";
import { POST } from "./route";

// Real routes + real service + stub AI + in-memory store (no key, no DATABASE_URL).
beforeEach(() => {
  vi.stubEnv("ANTHROPIC_API_KEY", "");
  vi.stubEnv("DATABASE_URL", "");
});

const post = (body: unknown) =>
  POST(
    new Request("http://test/api/triage", {
      method: "POST",
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );

const get = (id: string) =>
  GET(new Request(`http://test/api/triage/${id}`), {
    params: Promise.resolve({ id }),
  } as Parameters<typeof GET>[1]);

const valid = {
  text: "mild cough for a few days",
  duration: "few_days",
  severity: "mild",
  category: "Pulmonology",
  answers: {
    lung_breathing: ["fine"],
    lung_also: ["mucus"],
    lung_smoking: ["never"],
  },
};

describe("POST /api/triage", () => {
  it("400s on invalid JSON", async () => {
    const res = await post("{not json");
    expect(res.status).toBe(400);
  });

  it("400s with field errors on invalid input", async () => {
    const res = await post({ ...valid, text: "", answers: {} });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(Object.keys(body.fields).sort()).toEqual(["text"]);
  });

  it("400s when the answers don't fit the category", async () => {
    const res = await post({ ...valid, answers: { lung_breathing: ["fine"] } });
    expect(res.status).toBe(400);
    expect((await res.json()).fields.answers[0]).toMatch(/Answer every/);
  });

  it("201s with a routable record for a normal case", async () => {
    const res = await post(valid);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toMatchObject({ source: "ai", next: "schedule", pathway: "Pulmonology" });
  });

  it("returns an emergency for a red-flag input", async () => {
    const res = await post({ ...valid, text: "I can't breathe" });
    expect(await res.json()).toMatchObject({ urgency: "emergency", next: "emergency", source: "rules" });
  });
});

const screen = (body: unknown) =>
  SCREEN(new Request("http://test/api/triage/screen", { method: "POST", body: JSON.stringify(body) }));

describe("POST /api/triage/screen", () => {
  it("400s on empty text", async () => {
    const res = await screen({ text: " " });
    expect(res.status).toBe(400);
    expect(Object.keys((await res.json()).fields)).toEqual(["text"]);
  });

  it("returns the category to ask questions for", async () => {
    const res = await screen({ text: "I want to change my diet" });
    expect(await res.json()).toEqual({ next: "questions", category: "Dietetics" });
  });

  it("returns an emergency id for a red flag, and that id can be fetched", async () => {
    const body = await (await screen({ text: "I can't breathe" })).json();
    expect(body).toMatchObject({ next: "emergency" });

    const record = await (await get(body.id)).json();
    expect(record).toMatchObject({ urgency: "emergency", next: "emergency", source: "rules" });
  });
});

describe("GET /api/triage/[id]", () => {
  it("returns the record that POST created", async () => {
    const created = await (await post(valid)).json();
    const res = await get(created.id);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(created);
  });

  it("400s on a malformed id", async () => {
    expect((await get("nope")).status).toBe(400);
  });

  it("404s on an unknown uuid", async () => {
    expect((await get(crypto.randomUUID())).status).toBe(404);
  });
});
