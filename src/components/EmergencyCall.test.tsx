// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

// EMERGENCY_NUMBER is read when the module loads, so reload modules per test.
async function renderWithNumber(number: string) {
  vi.stubEnv("NEXT_PUBLIC_EMERGENCY_NUMBER", number);
  vi.resetModules();
  const { EmergencyCall } = await import("./EmergencyCall");
  render(<EmergencyCall className="x">Call now</EmergencyCall>);
}

afterEach(() => vi.unstubAllEnvs());

describe("EmergencyCall", () => {
  it("never dials when no number is configured: it is a button, not a tel: link", async () => {
    await renderWithNumber("");

    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByRole("button", { name: "Call now" })).toBeTruthy();
  });

  it("toggles the prototype notice when pressed", async () => {
    await renderWithNumber("");
    const user = userEvent.setup();
    const trigger = screen.getByRole("button", { name: "Call now" });

    expect(screen.queryByRole("status")).toBeNull(); // hidden
    expect(trigger.getAttribute("aria-expanded")).toBe("false");

    await user.click(trigger);
    expect(screen.getByRole("status").textContent).toMatch(/no number is connected/);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");

    await user.click(trigger);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("is a tel: link when a number is configured", async () => {
    await renderWithNumber(" 112 ");

    expect(screen.getByRole("link", { name: "Call now" }).getAttribute("href")).toBe("tel:112");
    expect(screen.queryByRole("button")).toBeNull();
  });
});
