const STEPS = [
  {
    index: "01",
    title: "Add your watchlist",
    description:
      "Pick the tickers you track — NVDA, TSM, AAPL, MSFT. Only the companies your research actually touches.",
  },
  {
    index: "02",
    title: "The agent reads overnight",
    description:
      "At 09:00 EEST it pulls the night's news, extracts inter-company relationships, and scores each one for confidence and impact.",
  },
  {
    index: "03",
    title: "A clean briefing lands",
    description:
      "Open the dashboard to a dated summary, an explorable relationship graph, and a searchable history — before the open.",
  },
] as const;

export function HowItWorks() {
  return (
    <section id="how-it-works" className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="lp-eyebrow">The pipeline</p>
          <h2 className="fr-heading mt-5 text-2xl font-semibold tracking-tight text-[color:var(--lp-text)] md:text-3xl">
            Watchlist in, structured signal out
          </h2>
          <p className="mt-4 text-sm text-[color:var(--lp-muted)] md:text-base">
            One pass, every morning, with nothing for you to run.
          </p>
        </div>

        <div className="relative mt-14">
          <div
            className="lp-rail-line absolute top-[7px] right-0 left-0 hidden h-px md:block"
            aria-hidden="true"
          />

          <ol className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
            {STEPS.map((step) => (
              <li key={step.index} className="relative">
                <div className="mb-6 flex items-center gap-3">
                  <span
                    className="relative z-10 block h-3.5 w-3.5 rounded-full border-2 border-[color:var(--lp-cyan)] bg-[color:var(--lp-ink)]"
                    aria-hidden="true"
                  />
                  <span className="lp-mono text-xs tracking-wider text-[color:var(--lp-cyan)]">
                    {step.index}
                  </span>
                </div>

                <h3 className="fr-heading text-lg font-semibold text-[color:var(--lp-text)]">
                  {step.title}
                </h3>
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-[color:var(--lp-muted)]">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
