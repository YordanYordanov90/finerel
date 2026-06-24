import { auth } from "@clerk/nextjs/server";

import { getGraphData } from "@/lib/data/graph";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await getGraphData(userId);
    return Response.json({ data });
  } catch (error) {
    console.error("[api/graph] database error", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return Response.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}