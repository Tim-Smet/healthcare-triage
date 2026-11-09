import type { TriageRecord } from "./schema";

/**
 * Storage interface. In-memory for now; step 5 swaps in Neon + Drizzle
 * behind the same interface.
 */
export interface TriageStore {
  save(record: TriageRecord): Promise<void>;
  get(id: string): Promise<TriageRecord | null>;
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
};
