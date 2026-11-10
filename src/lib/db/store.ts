import { neon } from "@neondatabase/serverless";
import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { TriageRecordSchema, type TriageRecord } from "@/lib/triage/schema";
import type { TriageStore } from "@/lib/triage/store";
import { triageSessions } from "./schema";

/** Postgres (Neon) implementation of the same `TriageStore` interface as the in-memory one. */
export function createPostgresStore(databaseUrl: string): TriageStore {
  const db = drizzle(neon(databaseUrl));

  return {
    async save(record) {
      await db.insert(triageSessions).values({
        id: record.id,
        urgency: record.urgency,
        pathway: record.pathway,
        next: record.next,
        consultationType: record.consultationType,
        source: record.source,
        reason: record.reason,
        rankedPathways: record.rankedPathways,
        nextSteps: record.nextSteps,
        input: record.input,
        createdAt: new Date(record.createdAt),
      });
    },

    async get(id) {
      const [row] = await db
        .select()
        .from(triageSessions)
        .where(eq(triageSessions.id, id))
        .limit(1);
      if (!row) return null;

      // Validate on the way out, so a bad row can never reach the UI or the hospital.
      const parsed = TriageRecordSchema.safeParse({
        ...row,
        createdAt: row.createdAt.toISOString(),
      });
      return parsed.success ? (parsed.data satisfies TriageRecord) : null;
    },

    async list(limit) {
      const rows = await db
        .select()
        .from(triageSessions)
        .orderBy(desc(triageSessions.createdAt))
        .limit(limit);

      // Rows that fail validation are skipped, same as in `get`.
      return rows.flatMap((row) => {
        const parsed = TriageRecordSchema.safeParse({
          ...row,
          createdAt: row.createdAt.toISOString(),
        });
        return parsed.success ? [parsed.data] : [];
      });
    },
  };
}
