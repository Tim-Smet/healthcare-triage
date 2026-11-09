import type { Urgency } from "./schema";

const RANK: Record<Urgency, number> = { routine: 0, urgent: 1, emergency: 2 };

/** The higher urgency wins. The AI can raise urgency but never lower it. */
export function maxUrgency(a: Urgency, b: Urgency): Urgency {
  return RANK[a] >= RANK[b] ? a : b;
}
