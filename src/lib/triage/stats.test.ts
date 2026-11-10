import { describe, expect, it } from "vitest";
import type { TriageRecord } from "./schema";
import { countBy } from "./stats";

const record = (urgency: TriageRecord["urgency"]) => ({ urgency }) as TriageRecord;

describe("countBy", () => {
  it("counts values, most common first", () => {
    const records = [record("routine"), record("urgent"), record("urgent")];
    expect(countBy(records, (r) => r.urgency)).toEqual([
      ["urgent", 2],
      ["routine", 1],
    ]);
  });

  it("returns an empty list for no records", () => {
    expect(countBy([], (r) => r.urgency)).toEqual([]);
  });
});
