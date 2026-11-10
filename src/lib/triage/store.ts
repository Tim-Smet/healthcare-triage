import type { TriageRecord } from "./schema";

/**
 * Storage interface. In-memory for now; step 5 swaps in Neon + Drizzle
 * behind the same interface.
 */
export interface TriageStore {
  save(record: TriageRecord): Promise<void>;
  get(id: string): Promise<TriageRecord | null>;
  /** Newest first. For the admin page. */
  list(limit: number): Promise<TriageRecord[]>;
}

// Kept on globalThis so the data survives hot reloads in dev.
const globalForStore = globalThis as unknown as {
  __triageRecords?: Map<string, TriageRecord>;
};
const records = (globalForStore.__triageRecords ??= new Map());

export const memoryStore: TriageStore = {
  async save(record) {
    records.set(record.id, record);
  },
  async get(id) {
    return records.get(id) ?? null;
  },
  async list(limit) {
    return [...records.values()]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  },
};
