import { ExternalLink } from "lucide-react";

import { getConfidenceDisplay } from "@/lib/utils/confidence";

export type RelationshipCardData = {
  sourceCompany: string;
  sourceTicker: string | null;
  targetCompany: string;
  targetTicker: string | null;
  relationType: string;
  confidence: number;
  impactLevel: string;
  contextSnippet: string;
  sourceUrl: string;
};

function formatRelationType(relationType: string): string {
  return relationType
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatImpactLevel(impactLevel: string): string {
  return impactLevel.charAt(0).toUpperCase() + impactLevel.slice(1);
}

function TickerPill({ ticker }: { ticker: string }) {
  return (
    <span className="font-mono rounded-md border border-zinc-800 bg-black/55 px-1.5 py-0.5 text-xs text-cyan-300/95">
      {ticker}
    </span>
  );
}

export function RelationshipCard({ relationship }: { relationship: RelationshipCardData }) {
  const confidence = getConfidenceDisplay(relationship.confidence);
  const snippet =
    relationship.contextSnippet.length > 300
      ? `${relationship.contextSnippet.slice(0, 300)}…`
      : relationship.contextSnippet;

  return (
    <article className="fr-card flex flex-col gap-3 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-zinc-100">
            <span className="font-medium">{relationship.sourceCompany}</span>
            <span className="mx-2 text-zinc-600">→</span>
            <span className="font-medium">{relationship.targetCompany}</span>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {relationship.sourceTicker ? (
              <TickerPill ticker={relationship.sourceTicker} />
            ) : null}
            {relationship.targetTicker ? (
              <TickerPill ticker={relationship.targetTicker} />
            ) : null}
          </div>
        </div>
        <a
          href={relationship.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-md p-1.5 text-zinc-400 transition-colors hover:text-cyan-400"
          aria-label="Open source article"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="fr-badge">{formatRelationType(relationship.relationType)}</span>
        <span className="fr-badge">{formatImpactLevel(relationship.impactLevel)}</span>
        <span className={`text-sm font-medium ${confidence.className}`}>
          {confidence.percentage} {confidence.label}
        </span>
      </div>

      <p className="text-sm leading-relaxed text-zinc-400">{snippet}</p>
    </article>
  );
}