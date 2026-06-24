import { eq } from "drizzle-orm";

import { db, relationships, watchlists } from "@/lib/db";
import type { RelationType } from "@/lib/schemas/relationships";

export type GraphNodeData = {
  name: string;
  ticker: string | null;
  isWatchlist: boolean;
};

export type GraphEdgeData = {
  relationType: RelationType;
  confidence: number;
  impactLevel: string;
  contextSnippet: string;
  sourceUrl: string;
};

export type GraphNode = {
  id: string;
  data: GraphNodeData;
};

export type GraphEdge = {
  id: string;
  source: string;
  target: string;
  data: GraphEdgeData;
};

export type GraphData = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export async function getGraphData(userId: string): Promise<GraphData> {
  const [rels, userWatchlist] = await Promise.all([
    db
      .select({
        id: relationships.id,
        sourceCompany: relationships.sourceCompany,
        sourceTicker: relationships.sourceTicker,
        targetCompany: relationships.targetCompany,
        targetTicker: relationships.targetTicker,
        relationType: relationships.relationType,
        confidence: relationships.confidence,
        impactLevel: relationships.impactLevel,
        contextSnippet: relationships.contextSnippet,
        sourceUrl: relationships.sourceUrl,
      })
      .from(relationships)
      .where(eq(relationships.userId, userId)),
    db
      .select({ ticker: watchlists.ticker })
      .from(watchlists)
      .where(eq(watchlists.userId, userId)),
  ]);

  const watchlistTickers = new Set(userWatchlist.map((w) => w.ticker));
  const nodeMap = new Map<string, GraphNodeData>();

  for (const rel of rels) {
    if (!nodeMap.has(rel.sourceCompany)) {
      nodeMap.set(rel.sourceCompany, {
        name: rel.sourceCompany,
        ticker: rel.sourceTicker,
        isWatchlist: rel.sourceTicker ? watchlistTickers.has(rel.sourceTicker) : false,
      });
    }

    if (!nodeMap.has(rel.targetCompany)) {
      nodeMap.set(rel.targetCompany, {
        name: rel.targetCompany,
        ticker: rel.targetTicker,
        isWatchlist: rel.targetTicker ? watchlistTickers.has(rel.targetTicker) : false,
      });
    }
  }

  const nodes = Array.from(nodeMap.entries()).map(([id, data]) => ({
    id,
    data,
  }));

  const edges = rels.map((rel) => ({
    id: String(rel.id),
    source: rel.sourceCompany,
    target: rel.targetCompany,
    data: {
      relationType: rel.relationType as RelationType,
      confidence: rel.confidence,
      impactLevel: rel.impactLevel,
      contextSnippet: rel.contextSnippet,
      sourceUrl: rel.sourceUrl,
    },
  }));

  return { nodes, edges };
}