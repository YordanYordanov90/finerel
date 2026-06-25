import { createHash } from "crypto";

import { and, eq, inArray } from "drizzle-orm";

import { env } from "@/lib/agent/env";
import { db, newsItems } from "@/lib/db";
import {
  fetchNewsInputSchema,
  fetchNewsOutputSchema,
  finnhubNewsResponseSchema,
  type FetchNewsOutput,
  type FinnhubArticle,
  type NewsItem,
} from "@/lib/schemas/news";

const FINNHUB_COMPANY_NEWS_URL = "https://finnhub.io/api/v1/company-news";

type NewsItemWithHash = NewsItem & { rawContentHash: string };

function hashUrl(url: string): string {
  return createHash("sha256").update(url).digest("hex");
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function resolveDateRange(fromDate?: string, toDate?: string) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  return {
    fromDate: fromDate ?? toIsoDate(yesterday),
    toDate: toDate ?? toIsoDate(today),
  };
}

function parseMentionedTickers(related: string | undefined, ticker: string) {
  const tickers = new Set([ticker.toUpperCase()]);

  if (related) {
    for (const symbol of related.split(",")) {
      const normalized = symbol.trim().toUpperCase();
      if (normalized) {
        tickers.add(normalized);
      }
    }
  }

  return [...tickers];
}

function normalizeArticle(
  article: FinnhubArticle,
  ticker: string,
): NewsItemWithHash {
  return {
    id: String(article.id),
    headline: article.headline,
    summary: article.summary,
    url: article.url,
    source: article.source,
    publishedAt: new Date(article.datetime * 1000).toISOString(),
    mentionedTickers: parseMentionedTickers(article.related, ticker),
    rawContentHash: hashUrl(article.url),
  };
}

async function fetchTickerNews(
  ticker: string,
  fromDate: string,
  toDate: string,
  limitPerTicker: number,
): Promise<NewsItemWithHash[]> {
  const url = new URL(FINNHUB_COMPANY_NEWS_URL);
  url.searchParams.set("symbol", ticker);
  url.searchParams.set("from", fromDate);
  url.searchParams.set("to", toDate);
  url.searchParams.set("token", env.FINNHUB_API_KEY);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const raw = await response.json();
  const parsed = finnhubNewsResponseSchema.safeParse(raw);

  if (!parsed.success) {
    throw new Error("Invalid Finnhub response shape");
  }

  return parsed.data
    .slice(0, limitPerTicker)
    .map((article) => normalizeArticle(article, ticker));
}

async function getExistingHashes(userId: string, hashes: string[]) {
  if (hashes.length === 0) {
    return new Set<string>();
  }

  const rows = await db
    .select({ rawContentHash: newsItems.rawContentHash })
    .from(newsItems)
    .where(
      and(
        eq(newsItems.userId, userId),
        inArray(newsItems.rawContentHash, hashes),
      ),
    );

  return new Set(rows.map((row) => row.rawContentHash));
}

async function persistNewsItems(userId: string, items: NewsItemWithHash[]) {
  if (items.length === 0) {
    return;
  }

  await db
    .insert(newsItems)
    .values(
      items.map((item) => ({
        id: item.id,
        userId,
        headline: item.headline,
        summary: item.summary,
        url: item.url,
        source: item.source,
        publishedAt: new Date(item.publishedAt),
        mentionedTickers: item.mentionedTickers,
        rawContentHash: item.rawContentHash,
      })),
    )
    .onConflictDoNothing();
}

export async function fetchWatchlistNews(
  rawInput: unknown,
): Promise<FetchNewsOutput> {
  const input = fetchNewsInputSchema.parse(rawInput);
  const { fromDate, toDate } = resolveDateRange(input.fromDate, input.toDate);
  const tickers = input.tickers.map((ticker) => ticker.toUpperCase());
  const collected: NewsItemWithHash[] = [];

  for (const ticker of tickers) {
    try {
      const items = await fetchTickerNews(
        ticker,
        fromDate,
        toDate,
        input.limitPerTicker,
      );
      collected.push(...items);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "unknown fetch error";

      console.error("[fetch_watchlist_news] ticker fetch failed", {
        ticker,
        fromDate,
        toDate,
        error: message,
      });
    }
  }

  const uniqueByHash = new Map<string, NewsItemWithHash>();
  for (const item of collected) {
    uniqueByHash.set(item.rawContentHash, item);
  }

  const candidates = [...uniqueByHash.values()];
  const existingHashes = await getExistingHashes(
    input.userId,
    candidates.map((item) => item.rawContentHash),
  );

  const newItems = candidates.filter(
    (item) => !existingHashes.has(item.rawContentHash),
  );

  await persistNewsItems(input.userId, newItems);

  const output = {
    newsItems: newItems.map(({ rawContentHash: _, ...item }) => item),
  };

  return fetchNewsOutputSchema.parse(output);
}