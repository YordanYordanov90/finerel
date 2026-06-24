import { auth } from "@clerk/nextjs/server";
import { Network } from "lucide-react";
import { redirect } from "next/navigation";

import { EmptyState } from "@/components/EmptyState";
import { RelationshipGraph } from "@/components/graph/RelationshipGraph";
import { getGraphData } from "@/lib/data/graph";

export default async function GraphPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const { nodes, edges } = await getGraphData(userId);

  if (edges.length === 0) {
    return (
      <EmptyState
        icon={Network}
        message="No relationships yet. Add tickers to your watchlist and wait for your morning briefing."
      />
    );
  }

  return (
    <div className="-m-4 md:-m-6">
      <RelationshipGraph nodes={nodes} edges={edges} />
    </div>
  );
}