import { hasConcerningAnswer } from "./questions";
import type {
  AiAssessment,
  AiScreening,
  ConsultationType,
  Pathway,
  TriageInput,
  Urgency,
} from "./schema";

/**
 * Stand-in for the Mastra agent (step 5 swaps it in). Same signature as the
 * real thing: input in, a validated `AiAssessment` out.
 */
export type AssessFn = (input: TriageInput) => Promise<AiAssessment>;

const KEYWORDS: Record<Exclude<Pathway, "General Practice">, RegExp> = {
  Cardiology: /(chest|heart|palpitation)/,
  Pulmonology: /(breath|cough|wheez|lung)/,
  Gastroenterology: /(stomach|belly|abdomen|nausea|vomit|heartburn|reflux|bowel)/,
  Dietetics: /(diet|weight|nutrition|calorie|food|eating|allerg|intoleran|cholesterol)/,
};

function pickPathways(text: string): Pathway[] {
  const matches = (Object.keys(KEYWORDS) as Array<keyof typeof KEYWORDS>).filter((p) =>
    KEYWORDS[p].test(text),
  );
  return [...matches, "General Practice"];
}

/** Stand-in for the screening agent: picks a category by keyword and never flags an emergency. */
export type ScreenFn = (text: string) => Promise<AiScreening>;

export const screenWithStub: ScreenFn = async (text) => ({
  emergency: false,
  category: pickPathways(text.toLowerCase())[0],
});

function pickUrgency(input: TriageInput, pathway: Pathway): Urgency {
  if (input.severity === "severe") return "urgent";
  if (input.severity === "moderate" && pathway === "Cardiology") return "urgent";
  if (hasConcerningAnswer(input.category, input.answers)) return "urgent";
  return "routine";
}

function pickConsultation(pathway: Pathway, urgency: Urgency): ConsultationType {
  switch (pathway) {
    case "Cardiology":
      return urgency === "routine" ? "check-up" : "cardiography";
    case "Pulmonology":
      return "lung-function-test";
    case "Dietetics":
      return "diet-consultation";
    default:
      return "first-appointment";
  }
}

export const assessWithStub: AssessFn = async (input) => {
  // The screening step already chose the category, so it leads the ranking.
  const others = pickPathways(input.text.toLowerCase()).filter(
    (p) => p !== input.category && p !== "General Practice",
  );
  const ranked: Pathway[] =
    input.category === "General Practice"
      ? ["General Practice", ...others]
      : [input.category, ...others, "General Practice"];
  const pathway = ranked[0];
  const urgency = pickUrgency(input, pathway);

  return {
    urgency,
    rankedPathways: ranked.map((p) => ({
      pathway: p,
      rationale: `Your description fits ${p}.`,
    })),
    consultationType: pickConsultation(pathway, urgency),
    nextSteps:
      urgency === "urgent"
        ? [
            "Book an appointment within the next day or two.",
            "Bring a list of your symptoms and any medicines you take.",
            "If you feel worse, call your local emergency number.",
          ]
        : [
            "Book an appointment in the coming weeks.",
            "Note when your symptoms happen and what makes them better or worse.",
            "If you feel worse, contact us again or call your local emergency number.",
          ],
  };
};
