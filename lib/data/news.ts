import { and, arrayOverlaps, desc, eq, gte, ilike, lte, or } from "drizzle-orm";

import { db, newsItems, watchlists } from "@/lib/db";

const SUMMARY_MAX = 300;
const DEFAULT_LIMIT = 15;
const MAX_LIMIT = 30;

export type NewsSearchParams = {
  ticker?: string;
  query?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
};

export type NewsRecord = {
  id: string;
  headline: string;
  summary: string;
  source: string;
  publishedAt: string;
  url: string;
  mentionedTickers: string[];
};

export async function searchNews(
  userId: string,
  params: NewsSearchParams = {},
): Promise<NewsRecord[]> {
  const limit = Math.min(params.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
  const conditions = [eq(newsItems.userId, userId)];

  if (params.ticker) {
    conditions.push(arrayOverlaps(newsItems.mentionedTickers, [params.ticker]));
  } else {
    const tickerRows = await db
      .select({ ticker: watchlists.ticker })
      .from(watchlists)
      .where(eq(watchlists.userId, userId));

    const tickers = tickerRows.map((row) => row.ticker);
    if (tickers.length === 0) {
      return [];
    }

    conditions.push(arrayOverlaps(newsItems.mentionedTickers, tickers));
  }

  if (params.query) {
    const pattern = `%${params.query}%`;
    conditions.push(
      or(
        ilike(newsItems.headline, pattern),
        ilike(newsItems.summary, pattern),
      )!,
    );
  }

  if (params.startDate) {
    conditions.push(gte(newsItems.publishedAt, new Date(params.startDate)));
  }

  if (params.endDate) {
    conditions.push(
      lte(newsItems.publishedAt, new Date(`${params.endDate}T23:59:59.999Z`)),
    );
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
    .where(and(...conditions))
    .orderBy(desc(newsItems.publishedAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    headline: row.headline,
    summary: row.summary.slice(0, SUMMARY_MAX),
    source: row.source,
    publishedAt: row.publishedAt.toISOString(),
    url: row.url,
    mentionedTickers: row.mentionedTickers,
  }));
}