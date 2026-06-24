"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type Edge,
  type EdgeProps,
} from "@xyflow/react";
import { useState } from "react";

import type { GraphEdgeData } from "@/lib/data/graph";
import {
  formatRelationType,
  getEdgeStrokeWidth,
  RELATION_EDGE_COLORS,
} from "@/lib/utils/graph";

export function RelationshipEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps<Edge<GraphEdgeData, "relationship">>) {
  const [hovered, setHovered] = useState(false);
  const edgeData = data ?? {
    relationType: "partnership" as const,
    confidence: 0.5,
    impactLevel: "medium",
    contextSnippet: "",
    sourceUrl: "",
  };

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const stroke = RELATION_EDGE_COLORS[edgeData.relationType];
  const strokeWidth = getEdgeStrokeWidth(edgeData.confidence);

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{ stroke, strokeWidth }}
        interactionWidth={20}
      />
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />
      {hovered ? (
        <EdgeLabelRenderer>
          <div
            className="fr-badge pointer-events-none"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            {formatRelationType(edgeData.relationType)}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}