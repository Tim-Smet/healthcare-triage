import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EmergencyScreen } from "@/components/EmergencyScreen";
import { PageShell, TwoColumn } from "@/components/PageShell";
import { ResultCard } from "@/components/ResultCard";
import { ResultLoading } from "@/components/ResultLoading";
import { SafetyNote } from "@/components/SafetyNote";
import { Stepper } from "@/components/Stepper";
import { SummaryCard } from "@/components/SummaryCard";
import { getTriage } from "@/lib/triage/service";

export const metadata: Metadata = {
  title: "Your result · Healthcare Triage",
};

export default function ResultPage({ params }: PageProps<"/triage/[id]">) {
  // The stored result is read per request, so it streams in behind a loading state.
  return (
    <Suspense fallback={<ResultLoading />}>
      <Result params={params} />
    </Suspense>
  );
}

async function Result({ params }: { params: PageProps<"/triage/[id]">["params"] }) {
  const { id } = await params;
  const record = await getTriage(id);
  if (!record) notFound();

  if (record.urgency === "emergency") {
    return <EmergencyScreen record={record} />;
  }

  return (
    <PageShell>
      <Stepper current={3} complete />
      <TwoColumn
        main={
          <>
            <h1 className="mb-6 text-[32px] font-bold leading-[1.1] tracking-[-0.03em] text-ink desk:mb-8 desk:text-[52px]">
              Here&apos;s what we suggest.
            </h1>
            <ResultCard record={record} />
          </>
        }
        aside={
          <>
            <SummaryCard input={record.input} />
            <SafetyNote />
          </>
        }
      />
    </PageShell>
  );
}
