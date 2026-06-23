import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";

import { isDemoUser } from "@/lib/auth";
import { db, watchlists } from "@/lib/db";

type RouteContext = {
  params: Promise<{ ticker: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isDemoUser(userId)) {
    return Response.json(
      { error: "Demo account is read-only" },
      { status: 403 },
    );
  }

  const { ticker } = await context.params;
  const normalizedTicker = ticker.toUpperCase();

  const deleted = await db
    .delete(watchlists)
    .where(
      and(
        eq(watchlists.userId, userId),
        eq(watchlists.ticker, normalizedTicker),
      ),
    )
    .returning({ ticker: watchlists.ticker });

  if (deleted.length === 0) {
    return Response.json(
      { error: "Ticker not found in watchlist" },
      { status: 404 },
    );
  }

  return Response.json({
    data: {
      ticker: deleted[0].ticker,
      removed: true,
    },
  });
}