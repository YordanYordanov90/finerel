import { processUserBriefing } from "@/lib/agent/process-user-briefing";
import { verifyQStashRequest } from "@/lib/agent/verify-qstash";
import { db, users, watchlists } from "@/lib/db";
import { eq } from "drizzle-orm";

export const maxDuration = 300;

// Returns the current HH:MM in EEST (UTC+3).
function currentEestTime(): string {
  const now = new Date();
  const eestOffset = 3 * 60;
  const eestMs = now.getTime() + eestOffset * 60 * 1000;
  const eest = new Date(eestMs);
  const hh = String(eest.getUTCHours()).padStart(2, "0");
  const mm = String(eest.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

async function getUsersScheduledNow(): Promise<Map<string, string[]>> {
  const currentTime = currentEestTime();

  const rows = await db
    .select({ userId: watchlists.userId, ticker: watchlists.ticker })
    .from(watchlists)
    .innerJoin(users, eq(watchlists.userId, users.id))
    .where(eq(users.briefingTime, currentTime));

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

  const currentTime = currentEestTime();
  const userTickers = await getUsersScheduledNow();
  let processed = 0;

  console.log("[morning-briefing] running", {
    currentEestTime: currentTime,
    usersScheduled: userTickers.size,
  });

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
    currentEestTime: currentTime,
    usersProcessed: processed,
    usersTotal: userTickers.size,
  });
}
