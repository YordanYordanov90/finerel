import { Network } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { RelationshipGraph } from "@/components/graph/RelationshipGraph";
import { getDemoUserId } from "@/lib/auth";
import { getGraphData } from "@/lib/data/graph";

export default async function DemoGraphPage() {
  const userId = getDemoUserId();
  const { nodes, edges } = await getGraphData(userId);

  if (edges.length === 0) {
    return (
      <EmptyState
        icon={Network}
        message="No relationships yet. Demo data will appear after the morning briefing runs."
      />
    );
  }

  return (
    <div className="-m-4 md:-m-6">
      <RelationshipGraph nodes={nodes} edges={edges} />
    </div>
  );
}
