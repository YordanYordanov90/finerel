import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { ExtractionSignature } from "@/components/landing/ExtractionSignature";

const STATS = [
  { value: "09:00", label: "daily briefing" },
  { value: "5", label: "edge types" },
  { value: "0", label: "manual refreshes" },
];

export function Hero() {
  return (
    <section className="relative px-6 pt-14 pb-20 md:pt-20 md:pb-28">
      <div
        className="lp-grid-bg pointer-events-none absolute inset-0"
        aria-hidden="true"
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div className="max-w-xl">
          <p className="lp-eyebrow">Relationship intelligence engine</p>

          <h1 className="fr-heading mt-6 text-4xl leading-[1.05] font-semibold tracking-tight text-[color:var(--lp-text)] sm:text-5xl md:text-6xl">
            Read the wires.{" "}
            <span className="text-[color:var(--lp-cyan)]">Map the moves.</span>
          </h1>

          <p className="mt-6 max-w-lg text-base leading-relaxed text-[color:var(--lp-muted)] md:text-lg">
            FinRel reads overnight financial news on your watchlist and turns it
            into a structured map of who&apos;s connected to whom — every
            partnership, supply line, and stake, scored and dated.
          </p>

          <div className="mt-9 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <Link href="/demo" className="fr-cta-btn gap-2 px-6 py-2.5 text-sm">
              Open the live demo
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center rounded-md border border-[color:var(--lp-line-bright)] bg-transparent px-6 py-2.5 text-sm font-medium text-[color:var(--lp-text)] transition-colors hover:border-[color:var(--lp-cyan)]/50 hover:bg-white/[0.02]"
            >
              Create your watchlist
            </Link>
          </div>

          <dl className="mt-12 flex items-center gap-8 border-t border-[color:var(--lp-line)] pt-6">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1">
                <dt className="fr-heading text-2xl font-semibold text-[color:var(--lp-text)]">
                  {stat.value}
                </dt>
                <dd className="lp-mono text-[10px] tracking-wider text-[color:var(--lp-faint)] uppercase">
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="w-full">
          <ExtractionSignature />
        </div>
      </div>
    </section>
  );
}
