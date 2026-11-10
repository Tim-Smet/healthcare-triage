// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { TriageRecord } from "@/lib/triage/schema";
import { EmergencyScreen } from "./EmergencyScreen";
import { ResultCard } from "./ResultCard";

const record: TriageRecord = {
  id: "3f1c2b4e-8a5d-4c7e-9b1a-2d6f8e0a1b3c",
  urgency: "urgent",
  pathway: "Cardiology",
  next: "schedule",
  consultationType: "cardiography",
  rankedPathways: ["Cardiology", "General Practice"],
  nextSteps: ["First step", "Second step"],
  reason: null,
  source: "ai",
  input: { text: "palpitations", category: "Cardiology", duration: "few_days", severity: "moderate", answers: {} },
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("ResultCard", () => {
  it("shows the pathway, plain-language recommendation, urgency and ordered steps", () => {
    render(<ResultCard record={record} />);

    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("Cardiology");
    expect(screen.getByText(/a heart tracing \(cardiography\)/)).toBeTruthy();
    expect(screen.getByText(/a heart specialist/)).toBeTruthy();
    expect(screen.getByText("Urgent")).toBeTruthy();
    expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual([
      "1First step",
      "2Second step",
    ]);
  });

  it("explains why under “Why we suggest this”, only when there is a reason", () => {
    const { rerender } = render(<ResultCard record={{ ...record, reason: "You told us about palpitations." }} />);
    expect(screen.getByRole("heading", { name: "Why we suggest this" })).toBeTruthy();
    expect(screen.getByText("You told us about palpitations.")).toBeTruthy();

    rerender(<ResultCard record={{ ...record, reason: null }} />);
    expect(screen.queryByRole("heading", { name: "Why we suggest this" })).toBeNull();
  });

  it("says scheduling is not connected, with the short reference, after pressing the CTA", async () => {
    const user = userEvent.setup();
    render(<ResultCard record={record} />);
    expect(screen.queryByText(/Scheduling isn't connected/)).toBeNull();

    await user.click(screen.getByRole("button", { name: "Schedule a heart tracing" }));

    expect(screen.getByText(/Scheduling isn't connected/).textContent).toContain("3f1c2b4e");
  });
});

describe("EmergencyScreen", () => {
  const emergency: TriageRecord = {
    ...record,
    urgency: "emergency",
    next: "emergency",
    consultationType: "emergency-assessment",
    reason: "Severe trouble breathing needs help right away.",
  };

  it("shows the reason, the steps and a call button", () => {
    render(<EmergencyScreen record={emergency} />);

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Call emergency services now.");
    expect(screen.getByText(emergency.reason!)).toBeTruthy();
    expect(screen.getByText("First step")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Call your emergency number" })).toBeTruthy();
  });

  it("reveals what the patient told us under “Why am I seeing this?”", async () => {
    const user = userEvent.setup();
    render(<EmergencyScreen record={emergency} />);
    const why = screen.getByRole("button", { name: "Why am I seeing this?" });
    expect(why.getAttribute("aria-expanded")).toBe("false");

    await user.click(why);

    expect(why.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText(/palpitations/)).toBeTruthy();
  });
});
