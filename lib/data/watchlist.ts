import { desc, eq } from "drizzle-orm";

import { db, watchlists } from "@/lib/db";

export type WatchlistEntry = {
  ticker: string;
  addedAt: string;
};

export async function getWatchlist(userId: string): Promise<WatchlistEntry[]> {
  const rows = await db
    .select({ ticker: watchlists.ticker, addedAt: watchlists.addedAt })
    .from(watchlists)
    .where(eq(watchlists.userId, userId))
    .orderBy(desc(watchlists.addedAt));

  return rows.map((row) => ({
    ticker: row.ticker,
    addedAt: row.addedAt.toISOString(),
  }));
}