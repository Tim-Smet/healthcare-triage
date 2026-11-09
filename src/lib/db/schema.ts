import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { TriageInput } from "@/lib/triage/schema";

/** One row per triage. Core fields are real columns so a hospital system can query them. */
export const triageSessions = pgTable("triage_sessions", {
  id: uuid("id").primaryKey(),
  urgency: text("urgency", { enum: ["emergency", "urgent", "routine"] }).notNull(),
  pathway: text("pathway").notNull(),
  next: text("next", { enum: ["emergency", "schedule"] }).notNull(),
  consultationType: text("consultation_type").notNull(),
  source: text("source", { enum: ["rules", "ai", "fallback"] }).notNull(),
  reason: text("reason"),
  rankedPathways: jsonb("ranked_pathways").$type<string[]>().notNull(),
  nextSteps: jsonb("next_steps").$type<string[]>().notNull(),
  input: jsonb("input").$type<TriageInput>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
