"use client";

import "@xyflow/react/dist/style.css";

import {
  Background,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  type EdgeTypes,
  type NodeTypes,
} from "@xyflow/react";
import { useCallback, useMemo, useState } from "react";

import { CompanyNode } from "@/components/graph/CompanyNode";
import { GraphControls } from "@/components/graph/GraphControls";
import { NodeDetailDrawer } from "@/components/graph/NodeDetailDrawer";
import { RelationshipEdge } from "@/components/graph/RelationshipEdge";
import type { GraphEdge, GraphNode } from "@/lib/data/graph";
import { layoutGraph, toFlowEdges } from "@/lib/utils/graph";

const nodeTypes: NodeTypes = {
  company: CompanyNode,
};

const edgeTypes: EdgeTypes = {
  relationship: RelationshipEdge,
};

type RelationshipGraphProps = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

function RelationshipGraphCanvas({ nodes, edges }: RelationshipGraphProps) {
  const initialNodes = useMemo(() => layoutGraph(nodes, edges), [nodes, edges]);
  const initialEdges = useMemo(() => toFlowEdges(edges), [edges]);

  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState(initialNodes);
  const [flowEdges, , onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const resetLayout = useCallback(() => {
    setFlowNodes(layoutGraph(nodes, edges));
  }, [nodes, edges, setFlowNodes]);

  return (
    <div className="relative h-[calc(100vh-8rem)] w-full">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={(_, node) => setSelectedNodeId(node.id)}
        onPaneClick={() => setSelectedNodeId(null)}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#27272a" gap={20} size={1} />
        <GraphControls onResetLayout={resetLayout} />
      </ReactFlow>

      <NodeDetailDrawer
        nodeId={selectedNodeId}
        nodes={nodes}
        edges={edges}
        onClose={() => setSelectedNodeId(null)}
      />
    </div>
  );
}

export function RelationshipGraph({ nodes, edges }: RelationshipGraphProps) {
  return (
    <ReactFlowProvider>
      <RelationshipGraphCanvas nodes={nodes} edges={edges} />
    </ReactFlowProvider>
  );
}