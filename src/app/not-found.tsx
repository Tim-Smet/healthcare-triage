import { ButtonLink } from "@/components/Button";
import { PageShell } from "@/components/PageShell";

export default function NotFound() {
  return (
    <PageShell>
      <div className="mx-auto mt-8 max-w-xl desk:mt-16">
        <h1 className="text-[32px] font-bold leading-[1.1] tracking-[-0.03em] text-ink desk:text-[46px]">
          We couldn&apos;t find that result.
        </h1>
        <p className="mt-4 text-[17px] leading-normal text-ink-muted">
          The link may be wrong or the result may no longer be available. You can start again and
          it only takes a minute.
        </p>
        <ButtonLink href="/" className="mt-8">
          Start again
        </ButtonLink>
      </div>
    </PageShell>
  );
}
