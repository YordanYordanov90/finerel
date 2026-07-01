import { getGraphData } from "@/lib/data/graph";
import { getWatchlist } from "@/lib/data/watchlist";
import type { RelationType } from "@/lib/schemas/relationships";

const TOP_CONNECTED_LIMIT = 5;

export type GraphStats = {
  nodeCount: number;
  edgeCount: number;
  mostConnected: Array<{
    company: string;
    ticker: string | null;
    connectionCount: number;
  }>;
  relationTypeCounts: Record<RelationType, number>;
  watchlistCoverage: {
    onGraph: number;
    total: number;
  };
};

const RELATION_TYPES: RelationType[] = [
  "partnership",
  "supply_chain",
  "executive_mention",
  "product_collaboration",
  "investment",
];

export async function getGraphStats(userId: string): Promise<GraphStats> {
  const [{ nodes, edges }, watchlist] = await Promise.all([
    getGraphData(userId),
    getWatchlist(userId),
  ]);

  const connectionCounts = new Map<string, number>();
  const relationTypeCounts = Object.fromEntries(
    RELATION_TYPES.map((type) => [type, 0]),
  ) as Record<RelationType, number>;

  for (const edge of edges) {
    connectionCounts.set(
      edge.source,
      (connectionCounts.get(edge.source) ?? 0) + 1,
    );
    connectionCounts.set(
      edge.target,
      (connectionCounts.get(edge.target) ?? 0) + 1,
    );
    relationTypeCounts[edge.data.relationType] += 1;
  }

  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  const mostConnected = [...connectionCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_CONNECTED_LIMIT)
    .map(([company, connectionCount]) => {
      const node = nodeById.get(company);
      return {
        company,
        ticker: node?.data.ticker ?? null,
        connectionCount,
      };
    });

  const graphTickers = new Set(
    nodes
      .map((node) => node.data.ticker)
      .filter((ticker): ticker is string => ticker !== null),
  );
  const onGraph = watchlist.filter((entry) =>
    graphTickers.has(entry.ticker),
  ).length;

  return {
    nodeCount: nodes.length,
    edgeCount: edges.length,
    mostConnected,
    relationTypeCounts,
    watchlistCoverage: {
      onGraph,
      total: watchlist.length,
    },
  };
}