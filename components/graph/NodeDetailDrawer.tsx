"use client";

import { ExternalLink } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { GraphEdge, GraphNode } from "@/lib/data/graph";
import { getConfidenceDisplay } from "@/lib/utils/confidence";
import { formatImpactLevel, formatRelationType } from "@/lib/utils/graph";

type NodeDetailDrawerProps = {
  nodeId: string | null;
  nodes: GraphNode[];
  edges: GraphEdge[];
  onClose: () => void;
};

function TickerPill({ ticker }: { ticker: string }) {
  return (
    <span className="rounded-md border border-zinc-800 bg-black/55 px-1.5 py-0.5 font-mono text-xs text-cyan-300/95">
      {ticker}
    </span>
  );
}

export function NodeDetailDrawer({
  nodeId,
  nodes,
  edges,
  onClose,
}: NodeDetailDrawerProps) {
  const node = nodes.find((item) => item.id === nodeId) ?? null;
  const relatedEdges = edges.filter(
    (edge) => edge.source === nodeId || edge.target === nodeId,
  );

  return (
    <Sheet open={nodeId !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto border-zinc-800 bg-[#111111] sm:max-w-md"
      >
        {node ? (
          <>
            <SheetHeader className="border-b border-zinc-800 pb-4">
              <SheetTitle className="fr-heading text-xl font-semibold text-zinc-100">
                {node.data.name}
              </SheetTitle>
              <SheetDescription className="sr-only">
                Company details and relationships
              </SheetDescription>
              {node.data.ticker ? (
                <div className="pt-2">
                  <TickerPill ticker={node.data.ticker} />
                </div>
              ) : null}
            </SheetHeader>

            <div className="flex flex-col gap-4 p-4">
              <h3 className="text-sm font-medium text-zinc-400">
                Relationships ({relatedEdges.length})
              </h3>

              {relatedEdges.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {relatedEdges.map((edge) => {
                    const isSource = edge.source === nodeId;
                    const otherCompany = isSource ? edge.target : edge.source;
                    const confidence = getConfidenceDisplay(edge.data.confidence);
                    const snippet =
                      edge.data.contextSnippet.length > 300
                        ? `${edge.data.contextSnippet.slice(0, 300)}…`
                        : edge.data.contextSnippet;

                    return (
                      <article
                        key={edge.id}
                        className="flex flex-col gap-3 rounded-xl border border-zinc-800 p-4"
                      >
                        <p className="text-sm text-zinc-100">
                          <span className="font-medium">
                            {isSource ? node.data.name : otherCompany}
                          </span>
                          <span className="mx-2 text-zinc-600">→</span>
                          <span className="font-medium">
                            {isSource ? otherCompany : node.data.name}
                          </span>
                        </p>

                        <div className="flex flex-wrap items-center gap-2">
                          <span className="fr-badge">
                            {formatRelationType(edge.data.relationType)}
                          </span>
                          <span className="fr-badge">
                            {formatImpactLevel(edge.data.impactLevel)}
                          </span>
                          <span className={`text-sm font-medium ${confidence.className}`}>
                            {confidence.percentage} {confidence.label}
                          </span>
                        </div>

                        <p className="text-sm leading-relaxed text-zinc-400">{snippet}</p>

                        <a
                          href={edge.data.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-cyan-400 transition-colors hover:text-cyan-300"
                        >
                          View source
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-zinc-400">
                  No relationships found for this company.
                </p>
              )}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}