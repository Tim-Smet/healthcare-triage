import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import {
  CONSULTATION_TYPES,
  NEXT_ACTIONS,
  PATHWAYS,
  RESULT_SOURCES,
  URGENCIES,
  type Pathway,
  type StoredInput,
} from "@/lib/triage/schema";

/** One row per triage. Core fields are real columns so a hospital system can query them. */
export const triageSessions = pgTable("triage_sessions", {
  id: uuid("id").primaryKey(),
  urgency: text("urgency", { enum: URGENCIES }).notNull(),
  pathway: text("pathway", { enum: PATHWAYS }).notNull(),
  next: text("next", { enum: NEXT_ACTIONS }).notNull(),
  consultationType: text("consultation_type", { enum: CONSULTATION_TYPES }).notNull(),
  source: text("source", { enum: RESULT_SOURCES }).notNull(),
  reason: text("reason"),
  rankedPathways: jsonb("ranked_pathways").$type<Pathway[]>().notNull(),
  nextSteps: jsonb("next_steps").$type<string[]>().notNull(),
  input: jsonb("input").$type<StoredInput>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
