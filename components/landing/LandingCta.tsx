import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function LandingCta() {
  return (
    <section className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="lp-panel relative overflow-hidden px-8 py-14 md:px-14 md:py-16">
          <div
            className="lp-grid-bg pointer-events-none absolute inset-0 opacity-60"
            aria-hidden="true"
          />

          <div className="relative max-w-2xl">
            <p className="lp-eyebrow">Start tracking</p>
            <h2 className="fr-heading mt-5 text-2xl font-semibold tracking-tight text-[color:var(--lp-text)] md:text-4xl">
              See the connections before the market does
            </h2>
            <p className="mt-4 max-w-lg text-sm text-[color:var(--lp-muted)] md:text-base">
              Explore the demo on pre-seeded data, or wire up your own watchlist
              and get tomorrow&apos;s briefing.
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
          </div>
        </div>
      </div>
    </section>
  );
}
