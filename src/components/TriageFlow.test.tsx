// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TriageFlow } from "./TriageFlow";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const fetchMock = vi.fn();
const ID = "3f1c2b4e-8a5d-4c7e-9b1a-2d6f8e0a1b3c";

beforeEach(() => {
  push.mockReset();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

const heading = () => screen.getByRole("heading", { level: 1 });
const button = (name: string) => screen.getByRole("button", { name });

async function typeSymptoms(user: ReturnType<typeof userEvent.setup>, text = "Dry cough") {
  await user.type(screen.getByLabelText("Your symptoms"), text);
  await user.click(button("Continue"));
}

/** Walks through all steps and stops on the last one, ready to submit. */
async function reachLastStep(user: ReturnType<typeof userEvent.setup>) {
  await typeSymptoms(user);
  await user.click(screen.getByRole("radio", { name: "A few days" }));
  await user.click(button("Continue"));
  await user.click(screen.getByRole("radio", { name: /^Moderate/ }));
  await user.click(button("Continue"));
  await user.click(screen.getByRole("checkbox", { name: "Fever" }));
}

describe("TriageFlow", () => {
  it("blocks an empty description, shows an error and focuses the field", async () => {
    const user = userEvent.setup();
    render(<TriageFlow />);

    await user.click(button("Continue"));

    const field = screen.getByLabelText("Your symptoms");
    expect(screen.getByText("Tell us what's bothering you so we can help.")).toBeTruthy();
    expect(field.getAttribute("aria-invalid")).toBe("true");
    expect(document.activeElement).toBe(field);
    expect(heading().textContent).toMatch(/in your own words/);
  });

  it("clears the error once the user types", async () => {
    const user = userEvent.setup();
    render(<TriageFlow />);

    await user.click(button("Continue"));
    await user.type(screen.getByLabelText("Your symptoms"), "x");

    expect(screen.queryByText("Tell us what's bothering you so we can help.")).toBeNull();
  });

  it("fills the field from an example chip", async () => {
    const user = userEvent.setup();
    render(<TriageFlow />);

    await user.click(button("Persistent cough"));

    expect((screen.getByLabelText("Your symptoms") as HTMLTextAreaElement).value).toBe(
      "Persistent cough",
    );
  });

  it("disables Continue until an option is chosen", async () => {
    const user = userEvent.setup();
    render(<TriageFlow />);
    await typeSymptoms(user);

    expect(heading().textContent).toMatch(/How long/);
    expect((button("Continue") as HTMLButtonElement).disabled).toBe(true);

    await user.click(screen.getByRole("radio", { name: "A few days" }));
    expect((button("Continue") as HTMLButtonElement).disabled).toBe(false);
  });

  it("keeps earlier answers when going back", async () => {
    const user = userEvent.setup();
    render(<TriageFlow />);
    await typeSymptoms(user, "Dry cough");
    await user.click(screen.getByRole("radio", { name: "A few weeks" }));
    await user.click(button("Continue"));

    await user.click(button("Back"));
    expect((screen.getByRole("radio", { name: "A few weeks" }) as HTMLInputElement).checked).toBe(
      true,
    );

    await user.click(button("Back"));
    expect((screen.getByLabelText("Your symptoms") as HTMLTextAreaElement).value).toBe("Dry cough");
  });

  it('treats "None of these" as exclusive', async () => {
    const user = userEvent.setup();
    render(<TriageFlow />);
    await reachLastStep(user); // Fever is ticked
    const checked = (name: string) =>
      (screen.getByRole("checkbox", { name }) as HTMLInputElement).checked;

    await user.click(screen.getByRole("checkbox", { name: "None of these" }));
    expect(checked("None of these")).toBe(true);
    expect(checked("Fever")).toBe(false);

    await user.click(screen.getByRole("checkbox", { name: "Fever" }));
    expect(checked("Fever")).toBe(true);
    expect(checked("None of these")).toBe(false);
  });

  it("submits the answers and navigates to the result", async () => {
    fetchMock.mockResolvedValue(Response.json({ id: ID }, { status: 201 }));
    const user = userEvent.setup();
    render(<TriageFlow />);
    await reachLastStep(user);

    await user.click(button("Check my symptoms"));

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/triage");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({
      text: "Dry cough",
      duration: "few_days",
      severity: "moderate",
      associated: ["fever"],
    });
    expect(push).toHaveBeenCalledWith(`/triage/${ID}`);
  });

  it("shows an error and keeps the answers when the request fails", async () => {
    fetchMock.mockResolvedValue(Response.json({ error: "boom" }, { status: 500 }));
    const user = userEvent.setup();
    render(<TriageFlow />);
    await reachLastStep(user);

    await user.click(button("Check my symptoms"));

    expect(await screen.findByText(/Something went wrong on our side/)).toBeTruthy();
    expect(push).not.toHaveBeenCalled();
    expect((screen.getByRole("checkbox", { name: "Fever" }) as HTMLInputElement).checked).toBe(true);
    expect(button("Check my symptoms")).toBeTruthy();
  });
});
