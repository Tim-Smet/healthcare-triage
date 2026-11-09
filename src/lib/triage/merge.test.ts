import { describe, expect, it } from "vitest";
import { maxUrgency } from "./merge";

describe("maxUrgency", () => {
  it.each([
    ["routine", "urgent", "urgent"],
    ["urgent", "routine", "urgent"],
    ["urgent", "emergency", "emergency"],
    ["emergency", "routine", "emergency"],
    ["routine", "routine", "routine"],
  ] as const)("%s vs %s -> %s", (a, b, expected) => {
    expect(maxUrgency(a, b)).toBe(expected);
  });
});
