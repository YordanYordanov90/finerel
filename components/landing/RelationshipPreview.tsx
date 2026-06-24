import { ExternalLink } from "lucide-react";

type PreviewCard = {
  from: { name: string; ticker: string };
  to: { name: string; ticker: string };
  type: string;
  typeLabel: string;
  confidence: number;
  impact: "high" | "medium" | "low";
  snippet: string;
};

const TYPES = [
  { type: "supply_chain", label: "Supply chain" },
  { type: "partnership", label: "Partnership" },
  { type: "investment", label: "Investment" },
  { type: "executive_mention", label: "Exec mention" },
  { type: "product_collaboration", label: "Product collab" },
] as const;

const CARDS: PreviewCard[] = [
  {
    from: { name: "NVIDIA", ticker: "NVDA" },
    to: { name: "TSMC", ticker: "TSM" },
    type: "supply_chain",
    typeLabel: "Supply chain",
    confidence: 82,
    impact: "high",
    snippet:
      "TSMC confirmed expanded wafer capacity for NVIDIA's Blackwell generation, reinforcing the primary manufacturing link.",
  },
  {
    from: { name: "Microsoft", ticker: "MSFT" },
    to: { name: "OpenAI", ticker: "—" },
    type: "investment",
    typeLabel: "Investment",
    confidence: 76,
    impact: "high",
    snippet:
      "Microsoft extended its multiyear investment and product collaboration with OpenAI across its model stack.",
  },
  {
    from: { name: "Apple", ticker: "AAPL" },
    to: { name: "Alphabet", ticker: "GOOGL" },
    type: "partnership",
    typeLabel: "Partnership",
    confidence: 64,
    impact: "medium",
    snippet:
      "Apple and Alphabet renewed their search distribution agreement — a long-running partnership with material revenue stakes.",
  },
];

function ConfidenceMeter({ value }: { value: number }) {
  const filled = Math.round((value / 100) * 10);

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-[2px]" aria-hidden="true">
        {Array.from({ length: 10 }).map((_, i) => (
          <span
            key={i}
            className="h-2.5 w-[3px] rounded-full"
            style={{
              backgroundColor:
                i < filled ? "var(--lp-cyan)" : "var(--lp-line-bright)",
            }}
          />
        ))}
      </div>
      <span className="lp-mono text-xs font-medium text-[color:var(--lp-text)]">
        {value}%
      </span>
    </div>
  );
}

function PreviewCardItem({ card }: { card: PreviewCard }) {
  return (
    <article className="lp-panel flex flex-col gap-4 p-5 transition-colors hover:border-[color:var(--lp-line-bright)]">
      <div className="flex items-start justify-between gap-2">
        <span className={`lp-edge-chip lp-edge--${card.type}`}>
          {card.typeLabel}
        </span>
        {card.impact === "high" ? (
          <span
            className="lp-mono flex items-center gap-1 text-[10px] tracking-wider uppercase"
            style={{ color: "var(--lp-amber)" }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: "var(--lp-amber)" }}
            />
            High
          </span>
        ) : null}
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className="fr-heading font-semibold text-[color:var(--lp-text)]">
          {card.from.name}
        </span>
        <span className="lp-ticker">{card.from.ticker}</span>
        <span className="text-[color:var(--lp-cyan)]">→</span>
        <span className="fr-heading font-semibold text-[color:var(--lp-text)]">
          {card.to.name}
        </span>
        <span className="lp-ticker">{card.to.ticker}</span>
      </div>

      <p className="text-sm leading-relaxed text-[color:var(--lp-muted)]">
        {card.snippet}
      </p>

      <div className="flex items-center justify-between border-t border-[color:var(--lp-line)] pt-3">
        <ConfidenceMeter value={card.confidence} />
        <span
          className="text-[color:var(--lp-faint)]"
          aria-hidden="true"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </span>
      </div>
    </article>
  );
}

export function RelationshipPreview() {
  return (
    <section id="briefing" className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="lp-eyebrow">Inside a briefing</p>
            <h2 className="fr-heading mt-5 text-2xl font-semibold tracking-tight text-[color:var(--lp-text)] md:text-3xl">
              Every edge is typed, scored, and sourced
            </h2>
            <p className="mt-4 text-sm text-[color:var(--lp-muted)] md:text-base">
              Not a feed of headlines — a set of structured relationships you can
              filter, trust, and trace back to the source.
            </p>
          </div>

          <p className="lp-mono shrink-0 text-xs text-[color:var(--lp-faint)]">
            Jun 23 · 3 relationships
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {CARDS.map((card) => (
            <PreviewCardItem key={`${card.from.ticker}-${card.to.ticker}`} card={card} />
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[color:var(--lp-line)] pt-6">
          <span className="lp-mono text-[10px] tracking-wider text-[color:var(--lp-faint)] uppercase">
            Edge types
          </span>
          {TYPES.map((item) => (
            <span key={item.type} className={`lp-edge-chip lp-edge--${item.type}`}>
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
