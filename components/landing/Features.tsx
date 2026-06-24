import { Clock3, Layers, Mail, Search, Shield } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const FEATURES: Feature[] = [
  {
    icon: Layers,
    title: "Five typed relationships",
    description:
      "Partnership, supply chain, investment, exec mention, product collaboration — structured, never freeform.",
  },
  {
    icon: Search,
    title: "Scored, not guessed",
    description:
      "Every edge carries a confidence score and impact level, so you weight signal instead of trusting it blindly.",
  },
  {
    icon: Mail,
    title: "Zero-maintenance briefing",
    description:
      "The 09:00 summary arrives every day on its own. No configuration, no manual refresh.",
  },
  {
    icon: Clock3,
    title: "Searchable history",
    description:
      "Filter past briefings by ticker, type, confidence, and date range to trace how a relationship developed.",
  },
  {
    icon: Shield,
    title: "Scoped to you",
    description:
      "Every watchlist, edge, and briefing is bound to your account from the first request.",
  },
];

const GRAPH_NODES = [
  { id: "nvda", label: "NVDA", x: 150, y: 90, hub: true },
  { id: "tsm", label: "TSM", x: 60, y: 40 },
  { id: "msft", label: "MSFT", x: 248, y: 48 },
  { id: "aapl", label: "AAPL", x: 250, y: 140 },
  { id: "amd", label: "AMD", x: 56, y: 148 },
  { id: "avgo", label: "AVGO", x: 150, y: 178 },
];

const GRAPH_EDGES = [
  { from: "nvda", to: "tsm", color: "#2dd4bf" },
  { from: "nvda", to: "msft", color: "#22d3ee" },
  { from: "nvda", to: "aapl", color: "#38bdf8" },
  { from: "nvda", to: "amd", color: "#a78bfa" },
  { from: "nvda", to: "avgo", color: "#f5a524" },
];

function MiniGraph() {
  const nodeById = Object.fromEntries(GRAPH_NODES.map((n) => [n.id, n]));

  return (
    <svg
      viewBox="0 0 300 210"
      className="h-full w-full"
      fill="none"
      role="img"
      aria-label="A relationship graph with NVIDIA connected to five companies"
    >
      {GRAPH_EDGES.map((edge) => {
        const a = nodeById[edge.from];
        const b = nodeById[edge.to];
        return (
          <line
            key={`${edge.from}-${edge.to}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke={edge.color}
            strokeWidth="1.25"
            opacity="0.55"
          />
        );
      })}
      {GRAPH_NODES.map((node) => (
        <g key={node.id}>
          <circle
            cx={node.x}
            cy={node.y}
            r={node.hub ? 7 : 4.5}
            fill={node.hub ? "var(--lp-cyan)" : "var(--lp-panel-2)"}
            stroke={node.hub ? "var(--lp-cyan)" : "var(--lp-line-bright)"}
            strokeWidth="1.5"
          />
          <text
            x={node.x}
            y={node.y - (node.hub ? 13 : 10)}
            textAnchor="middle"
            fontSize="9"
            fontFamily="var(--font-mono), monospace"
            fill={node.hub ? "var(--lp-cyan)" : "var(--lp-faint)"}
          >
            {node.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function Features() {
  return (
    <section id="features" className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="lp-eyebrow">Built for signal</p>
          <h2 className="fr-heading mt-5 text-2xl font-semibold tracking-tight text-[color:var(--lp-text)] md:text-3xl">
            A research tool, not a news feed
          </h2>
          <p className="mt-4 text-sm text-[color:var(--lp-muted)] md:text-base">
            Every part of FinRel exists to surface a connection you&apos;d
            otherwise miss.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <article className="lp-panel flex flex-col justify-between gap-6 p-6 sm:col-span-2 lg:row-span-2">
            <div>
              <p className="lp-eyebrow">The artifact</p>
              <h3 className="fr-heading mt-4 text-xl font-semibold text-[color:var(--lp-text)]">
                A relationship graph that grows
              </h3>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-[color:var(--lp-muted)]">
                Each morning&apos;s extractions accrue into one explorable graph —
                companies as nodes, typed edges between them, thickening as the
                evidence stacks up.
              </p>
            </div>
            <div className="min-h-[180px] flex-1 rounded-lg border border-[color:var(--lp-line)] bg-[color:var(--lp-ink)]/60 p-3">
              <MiniGraph />
            </div>
          </article>

          {FEATURES.map(({ icon: Icon, title, description }) => (
            <article key={title} className="lp-panel p-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-md border border-[color:var(--lp-cyan)]/30 bg-[color:var(--lp-cyan)]/10">
                <Icon className="h-4 w-4 text-[color:var(--lp-cyan)]" />
              </div>
              <h3 className="fr-heading mt-4 text-base font-semibold text-[color:var(--lp-text)]">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[color:var(--lp-muted)]">
                {description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
