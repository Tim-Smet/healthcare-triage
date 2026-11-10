import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SessionRow } from "@/components/admin/SessionRow";
import { URGENCY_LABEL } from "@/lib/labels";
import { countBy } from "@/lib/triage/stats";
import { listTriages } from "@/lib/triage/service";

export const metadata: Metadata = {
  title: "Admin · Healthcare Triage",
  // Keep it out of search results until there is a login in front of it.
  robots: { index: false, follow: false },
};

const LIMIT = 100;

// TODO: put authentication in front of this page. Until then it is open to anyone with the link.
export default function AdminPage() {
  return (
    <>
      <header className="flex h-16 items-center justify-between border-b border-border px-5 desk:h-[72px] desk:px-14">
        <Link href="/" className="flex min-h-11 items-center text-lg font-bold text-ink">
          Healthcare Triage <span className="ml-2 font-medium text-ink-subtle">/ Admin</span>
        </Link>
      </header>
      <main id="main" className="flex-1 px-5 py-8 desk:px-14 desk:py-12">
        <h1 className="text-[32px] font-bold leading-[1.1] tracking-[-0.03em] text-ink desk:text-[46px]">
          What the tool received and decided
        </h1>
        <p className="mt-3 max-w-2xl text-[17px] text-ink-muted">
          The latest {LIMIT} triages, newest first. Open one to see the patient&apos;s input next to the output.
        </p>
        <Suspense
          fallback={
            <p role="status" className="mt-8 text-ink-muted">
              Loading triages…
            </p>
          }
        >
          <Sessions />
        </Suspense>
      </main>
    </>
  );
}

async function Sessions() {
  const records = await listTriages(LIMIT);

  if (records.length === 0) {
    return <p className="mt-8 text-[17px] text-ink-muted">No triages yet.</p>;
  }

  const groups = [
    { title: "Urgency", counts: countBy(records, (r) => URGENCY_LABEL[r.urgency]) },
    { title: "Pathway", counts: countBy(records, (r) => r.pathway) },
    {
      title: "Decided by",
      counts: countBy(records, (r) => ({ rules: "Rules", ai: "AI", fallback: "Fallback" })[r.source]),
    },
  ];

  return (
    <>
      <section aria-label="Overview" className="mt-8 grid gap-5 desk:grid-cols-3">
        {groups.map(({ title, counts }) => (
          <div key={title} className="rounded-option bg-primary-tint p-5">
            <h2 className="text-xs font-bold uppercase tracking-[0.1em] text-ink-subtle">{title}</h2>
            <dl className="mt-3 space-y-1 text-[15px]">
              {counts.map(([label, n]) => (
                <div key={label} className="flex justify-between gap-3">
                  <dt className="text-ink">{label}</dt>
                  <dd className="font-semibold text-ink">{n}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </section>

      <section aria-label="Triages" className="mt-8 flex flex-col gap-3">
        {records.map((record) => (
          <SessionRow key={record.id} record={record} />
        ))}
      </section>
    </>
  );
}
