import type { TriageRecord } from "./schema";

/** Counts per value of one field, most common first. */
export function countBy<K extends string>(
  records: TriageRecord[],
  pick: (record: TriageRecord) => K,
): Array<[K, number]> {
  const counts = new Map<K, number>();
  for (const record of records) {
    const key = pick(record);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1]);
}
