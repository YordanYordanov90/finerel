import { processUserBriefing } from "@/lib/agent/process-user-briefing";
import { verifyQStashRequest } from "@/lib/agent/verify-qstash";
import { db, watchlists } from "@/lib/db";

export const maxDuration = 300;

async function getUsersWithWatchlists(): Promise<Map<string, string[]>> {
  const rows = await db
    .select({ userId: watchlists.userId, ticker: watchlists.ticker })
    .from(watchlists);

  const userTickers = new Map<string, string[]>();

  for (const row of rows) {
    const tickers = userTickers.get(row.userId) ?? [];
    tickers.push(row.ticker);
    userTickers.set(row.userId, tickers);
  }

  return userTickers;
}

export async function POST(request: Request) {
  const verification = await verifyQStashRequest(request);

  if (!verification.valid) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userTickers = await getUsersWithWatchlists();
  let processed = 0;

  for (const [userId, tickers] of userTickers) {
    try {
      await processUserBriefing(userId, tickers);
      processed += 1;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "unknown briefing error";

      console.error("[morning-briefing] user run failed", {
        userId,
        error: message,
      });
    }
  }

  console.log("[morning-briefing] completed", {
    timestamp: new Date().toISOString(),
    usersProcessed: processed,
    usersTotal: userTickers.size,
  });

  return Response.json({
    ok: true,
    usersProcessed: processed,
    usersTotal: userTickers.size,
  });
}