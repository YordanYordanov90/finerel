import type { WatchlistTicker } from "@/lib/schemas/watchlist";

type ApiErrorBody = {
  error?: string;
};

type WatchlistResponse = {
  data: {
    tickers: WatchlistTicker[];
  };
};

type RelationshipRow = {
  sourceTicker: string | null;
  targetTicker: string | null;
  extractedAt: string;
};

type RelationshipsResponse = {
  data: {
    relationships: RelationshipRow[];
    total: number;
  };
};

export type TickerActivity = {
  relationshipCount: number;
  lastActivityDate: string | null;
};

async function parseResponse<T>(response: Response): Promise<T> {
  let body: unknown;

  try {
    body = await response.json();
  } catch {
    throw new Error("Server error — please try again");
  }

  if (!response.ok) {
    const message =
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof (body as ApiErrorBody).error === "string"
        ? (body as ApiErrorBody).error
        : "Request failed";
    throw new Error(message);
  }

  return body as T;
}

export async function fetchWatchlist(isDemo = false): Promise<WatchlistTicker[]> {
  const url = isDemo ? "/api/watchlist?demo=true" : "/api/watchlist";
  const response = await fetch(url);
  const body = await parseResponse<WatchlistResponse>(response);
  return body.data.tickers;
}

export async function addWatchlistTicker(ticker: string): Promise<WatchlistTicker> {
  const response = await fetch("/api/watchlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticker }),
  });
  const body = await parseResponse<{ data: WatchlistTicker }>(response);
  return body.data;
}

export async function removeWatchlistTicker(ticker: string): Promise<void> {
  const response = await fetch(
    `/api/watchlist/${encodeURIComponent(ticker)}`,
    { method: "DELETE" },
  );
  await parseResponse<{ data: { ticker: string; removed: boolean } }>(response);
}

async function fetchRelationshipsPage(limit: number, offset: number, isDemo = false) {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  if (isDemo) {
    params.set("demo", "true");
  }

  const response = await fetch(`/api/relationships?${params.toString()}`);
  const body = await parseResponse<RelationshipsResponse>(response);
  return body.data;
}

export async function fetchAllRelationships(isDemo = false): Promise<RelationshipRow[]> {
  const MAX_PAGES = 50;
  const pageSize = 100;
  let offset = 0;
  let total = 0;
  let page = 0;
  const relationships: RelationshipRow[] = [];

  do {
    const result = await fetchRelationshipsPage(pageSize, offset, isDemo);
    relationships.push(...result.relationships);
    total = result.total;
    offset += result.relationships.length;
    page += 1;
    if (page >= MAX_PAGES) break;
  } while (offset < total);

  return relationships;
}

export function buildTickerActivityMap(
  tickers: WatchlistTicker[],
  relationships: RelationshipRow[],
): Map<string, TickerActivity> {
  const activity = new Map<string, TickerActivity>();

  for (const { ticker } of tickers) {
    activity.set(ticker, { relationshipCount: 0, lastActivityDate: null });
  }

  for (const relationship of relationships) {
    const involvedTickers = [relationship.sourceTicker, relationship.targetTicker].filter(
      (value): value is string => value !== null && activity.has(value),
    );

    for (const ticker of involvedTickers) {
      const current = activity.get(ticker)!;
      current.relationshipCount += 1;

      if (
        !current.lastActivityDate ||
        relationship.extractedAt > current.lastActivityDate
      ) {
        current.lastActivityDate = relationship.extractedAt;
      }
    }
  }

  return activity;
}

export function formatActivityDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}