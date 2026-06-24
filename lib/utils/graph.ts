import dagre from "@dagrejs/dagre";
import type { Edge, Node } from "@xyflow/react";

import type { GraphEdge, GraphNode } from "@/lib/data/graph";
import type { RelationType } from "@/lib/schemas/relationships";

export const RELATION_EDGE_COLORS: Record<RelationType, string> = {
  partnership: "#06B6D4",
  supply_chain: "#a78bfa",
  investment: "#34d399",
  executive_mention: "#fbbf24",
  product_collaboration: "#f472b6",
};

export function formatRelationType(relationType: string): string {
  return relationType
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function formatImpactLevel(impactLevel: string): string {
  return impactLevel.charAt(0).toUpperCase() + impactLevel.slice(1);
}

export function getEdgeStrokeWidth(confidence: number): number {
  return 1 + confidence * 4;
}

export function getNodeDimensions(isWatchlist: boolean) {
  return isWatchlist ? { width: 180, height: 72 } : { width: 150, height: 58 };
}

export function layoutGraph(nodes: GraphNode[], edges: GraphEdge[]): Node[] {
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({ rankdir: "TB", nodesep: 80, ranksep: 100 });

  for (const node of nodes) {
    const { width, height } = getNodeDimensions(node.data.isWatchlist);
    graph.setNode(node.id, { width, height });
  }

  for (const edge of edges) {
    graph.setEdge(edge.source, edge.target);
  }

  dagre.layout(graph);

  return nodes.map((node) => {
    const position = graph.node(node.id);
    const { width, height } = getNodeDimensions(node.data.isWatchlist);

    return {
      id: node.id,
      type: "company",
      position: {
        x: position.x - width / 2,
        y: position.y - height / 2,
      },
      data: node.data,
    };
  });
}

export function toFlowEdges(edges: GraphEdge[]): Edge[] {
  return edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: "relationship",
    data: edge.data,
  }));
}