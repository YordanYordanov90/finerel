import { and, arrayOverlaps, desc, eq } from "drizzle-orm";

import { fetchWatchlistNews } from "@/lib/agent/tools/fetch-watchlist-news";
import { getAuthOrDemoUserId, isDemoUser } from "@/lib/auth";
import { db, newsItems, watchlists } from "@/lib/db";

export const maxDuration = 60;

const FEED_LIMIT = 60;

export async function GET(request: Request) {
  const userId = await getAuthOrDemoUserId(request);

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const refresh = url.searchParams.get("refresh") === "true";

  try {
    const tickerRows = await db
      .select({ ticker: watchlists.ticker })
      .from(watchlists)
      .where(eq(watchlists.userId, userId));

    const tickers = tickerRows.map((row) => row.ticker);

    if (tickers.length === 0) {
      return Response.json({ data: { news: [] } });
    }

    // Hybrid: stored news returns instantly; a refresh pulls fresh
    // articles from Finnhub (which also persists them) before we read back.
    if (refresh && !isDemoUser(userId)) {
      try {
        await fetchWatchlistNews({ userId, tickers, limitPerTicker: 15 });
      } catch (error) {
        console.error("[api/news] refresh failed", {
          error: error instanceof Error ? error.message : "unknown",
        });
      }
    }

    const rows = await db
      .select({
        id: newsItems.id,
        headline: newsItems.headline,
        summary: newsItems.summary,
        url: newsItems.url,
        source: newsItems.source,
        publishedAt: newsItems.publishedAt,
        mentionedTickers: newsItems.mentionedTickers,
      })
      .from(newsItems)
      .where(
        and(
          eq(newsItems.userId, userId),
          arrayOverlaps(newsItems.mentionedTickers, tickers),
        ),
      )
      .orderBy(desc(newsItems.publishedAt))
      .limit(FEED_LIMIT);

    return Response.json({
      data: {
        news: rows.map((row) => ({
          id: row.id,
          headline: row.headline,
          summary: row.summary,
          url: row.url,
          source: row.source,
          publishedAt: row.publishedAt.toISOString(),
          mentionedTickers: row.mentionedTickers,
        })),
      },
    });
  } catch (error) {
    console.error("[api/news] database error", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
