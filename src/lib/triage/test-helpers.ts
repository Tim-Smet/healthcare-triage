import type { TriageInput } from "./schema";

/** A valid, non-alarming input. Override only the fields a test cares about. */
export function makeInput(overrides: Partial<TriageInput> = {}): TriageInput {
  return {
    text: "I have had a mild headache",
    duration: "few_days",
    severity: "mild",
    associated: ["none"],
    ...overrides,
  };
}
