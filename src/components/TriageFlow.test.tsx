// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
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

const screenResult = (body: unknown) => Response.json(body);
const toQuestions = (category = "Cardiology") => screenResult({ next: "questions", category });

async function typeSymptoms(user: ReturnType<typeof userEvent.setup>, text = "Dry cough") {
  await user.type(screen.getByLabelText("Your symptoms"), text);
  await user.click(button("Continue"));
}

const pick = (user: ReturnType<typeof userEvent.setup>, role: "radio" | "checkbox", name: string | RegExp) =>
  user.click(screen.getByRole(role, { name }));

/** Describe -> screening (Cardiology) -> duration -> severity. Stops on the first category question. */
async function reachCategoryQuestions(user: ReturnType<typeof userEvent.setup>) {
  fetchMock.mockResolvedValueOnce(toQuestions());
  await typeSymptoms(user);
  await screen.findByRole("heading", { level: 1, name: /How long/ });
  await pick(user, "radio", "A few days");
  await user.click(button("Continue"));
  await pick(user, "radio", /^Moderate/);
  await user.click(button("Continue"));
}

/** Walks through every step and stops on the last one, ready to submit. */
async function reachLastStep(user: ReturnType<typeof userEvent.setup>) {
  await reachCategoryQuestions(user);
  await pick(user, "radio", "When I'm active or climbing stairs");
  await user.click(button("Continue"));
  await pick(user, "checkbox", "Dizziness or fainting");
  await user.click(button("Continue"));
  await pick(user, "radio", "No");
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
    fetchMock.mockResolvedValueOnce(toQuestions());
    await typeSymptoms(user);

    expect(await screen.findByRole("heading", { level: 1, name: /How long/ })).toBeTruthy();
    expect((button("Continue") as HTMLButtonElement).disabled).toBe(true);

    await user.click(screen.getByRole("radio", { name: "A few days" }));
    expect((button("Continue") as HTMLButtonElement).disabled).toBe(false);
  });

  it("keeps earlier answers when going back", async () => {
    const user = userEvent.setup();
    render(<TriageFlow />);
    fetchMock.mockResolvedValueOnce(toQuestions());
    await typeSymptoms(user, "Dry cough");
    await user.click(await screen.findByRole("radio", { name: "A few weeks" }));
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
    await reachCategoryQuestions(user);
    await pick(user, "radio", "It comes and goes for no clear reason");
    await user.click(button("Continue"));
    await pick(user, "checkbox", "Dizziness or fainting");
    const checked = (name: string) =>
      (screen.getByRole("checkbox", { name }) as HTMLInputElement).checked;

    await user.click(screen.getByRole("checkbox", { name: "None of these" }));
    expect(checked("None of these")).toBe(true);
    expect(checked("Dizziness or fainting")).toBe(false);

    await user.click(screen.getByRole("checkbox", { name: "Dizziness or fainting" }));
    expect(checked("Dizziness or fainting")).toBe(true);
    expect(checked("None of these")).toBe(false);
  });

  it("submits the answers and navigates to the result", async () => {
    const user = userEvent.setup();
    render(<TriageFlow />);
    await reachLastStep(user);
    fetchMock.mockResolvedValueOnce(Response.json({ id: ID }, { status: 201 }));

    await user.click(button("Check my symptoms"));

    await waitFor(() => expect(push).toHaveBeenCalledWith(`/triage/${ID}`));
    expect(fetchMock).toHaveBeenCalledTimes(2); // screen, then submit
    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe("/api/triage");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({
      text: "Dry cough",
      category: "Cardiology",
      duration: "few_days",
      severity: "moderate",
      answers: {
        heart_trigger: ["with_activity"],
        heart_also: ["dizziness_fainting"],
        heart_history: ["no"],
      },
    });
  });

  it("shows an error and keeps the answers when the request fails", async () => {
    const user = userEvent.setup();
    render(<TriageFlow />);
    await reachLastStep(user);
    fetchMock.mockResolvedValueOnce(Response.json({ error: "boom" }, { status: 500 }));

    await user.click(button("Check my symptoms"));

    expect(await screen.findByText(/Something went wrong on our side/)).toBeTruthy();
    expect(push).not.toHaveBeenCalled();
    expect((screen.getByRole("radio", { name: "No" }) as HTMLInputElement).checked).toBe(true);
    expect(button("Check my symptoms")).toBeTruthy();
  });
});

describe("TriageFlow screening", () => {
  it("shows a progress bar while the description is being screened", async () => {
    let finish!: (r: Response) => void;
    fetchMock.mockReturnValueOnce(new Promise<Response>((resolve) => (finish = resolve)));
    const user = userEvent.setup();
    render(<TriageFlow />);

    await typeSymptoms(user);

    expect(screen.getByRole("progressbar", { name: "Looking at your symptoms" })).toBeTruthy();
    expect(screen.getByRole("status").textContent).toMatch(/Reading what you wrote/);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/triage/screen",
      expect.objectContaining({ body: JSON.stringify({ text: "Dry cough" }) }),
    );

    finish(toQuestions());
    expect(await screen.findByRole("heading", { level: 1, name: /How long/ })).toBeTruthy();
    expect(screen.queryByRole("progressbar")).toBeNull();
  });

  it("goes straight to the emergency screen and asks no follow-up questions", async () => {
    fetchMock.mockResolvedValueOnce(screenResult({ next: "emergency", id: ID }));
    const user = userEvent.setup();
    render(<TriageFlow />);

    await typeSymptoms(user, "I can't breathe");

    await waitFor(() => expect(push).toHaveBeenCalledWith(`/triage/${ID}`));
    expect(screen.queryByText(/Question 1 of/)).toBeNull();
  });

  it("asks the questions of the screened category", async () => {
    const user = userEvent.setup();
    render(<TriageFlow />);
    fetchMock.mockResolvedValueOnce(toQuestions("Dietetics"));
    await typeSymptoms(user, "Help with my diet");
    await screen.findByRole("heading", { level: 1, name: /How long/ });
    await pick(user, "radio", "A few weeks");
    await user.click(button("Continue"));
    await pick(user, "radio", /^Mild/);
    await user.click(button("Continue"));

    expect(screen.getByText("Question 3 of 5")).toBeTruthy();
    expect(heading().textContent).toBe("What would you like help with?");
    expect(screen.getByRole("radio", { name: "Losing weight" })).toBeTruthy();
  });

  it("returns to the description with an error when screening fails, keeping the text", async () => {
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    const user = userEvent.setup();
    render(<TriageFlow />);

    await typeSymptoms(user, "Dry cough");

    expect(await screen.findByText(/Something went wrong on our side/)).toBeTruthy();
    expect((screen.getByLabelText("Your symptoms") as HTMLTextAreaElement).value).toBe("Dry cough");
  });

  it("does not screen again when going back and continuing without edits", async () => {
    const user = userEvent.setup();
    render(<TriageFlow />);
    fetchMock.mockResolvedValueOnce(toQuestions());
    await typeSymptoms(user);
    await screen.findByRole("heading", { level: 1, name: /How long/ });

    await user.click(button("Back"));
    await user.click(button("Continue"));

    expect(await screen.findByRole("heading", { level: 1, name: /How long/ })).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("screens again, and drops old answers, when the text changes to another category", async () => {
    const user = userEvent.setup();
    render(<TriageFlow />);
    fetchMock.mockResolvedValueOnce(toQuestions("Cardiology"));
    await typeSymptoms(user);
    await screen.findByRole("heading", { level: 1, name: /How long/ });
    await user.click(button("Back"));

    fetchMock.mockResolvedValueOnce(toQuestions("Dietetics"));
    await user.type(screen.getByLabelText("Your symptoms"), " and my diet");
    await user.click(button("Continue"));

    await screen.findByRole("heading", { level: 1, name: /How long/ });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
