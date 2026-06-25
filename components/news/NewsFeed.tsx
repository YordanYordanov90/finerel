"use client";

import { Newspaper, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import {
  fetchNews,
  formatNewsDate,
  type NewsArticle,
} from "@/lib/utils/news-api";

type NewsFeedProps = {
  isDemo?: boolean;
};

function TickerPill({ ticker }: { ticker: string }) {
  return (
    <span className="font-mono rounded-md border border-zinc-800 bg-black/55 px-1.5 py-0.5 text-xs text-cyan-300/95">
      {ticker}
    </span>
  );
}

function ArticleCard({ article }: { article: NewsArticle }) {
  return (
    <article className="fr-card p-4">
      <div className="flex items-start justify-between gap-4">
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-zinc-100 hover:text-cyan-300"
        >
          {article.headline}
        </a>
        <span className="shrink-0 font-mono text-xs text-zinc-500">
          {formatNewsDate(article.publishedAt)}
        </span>
      </div>

      {article.summary ? (
        <p className="mt-2 line-clamp-2 text-sm text-zinc-400">
          {article.summary}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-zinc-500">{article.source}</span>
        {article.mentionedTickers.length > 0 ? (
          <span className="text-zinc-700">·</span>
        ) : null}
        {article.mentionedTickers.slice(0, 5).map((ticker) => (
          <TickerPill key={ticker} ticker={ticker} />
        ))}
      </div>
    </article>
  );
}

function NewsSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="fr-card p-4">
          <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-800" />
          <div className="mt-3 h-3 w-full animate-pulse rounded bg-zinc-800/60" />
          <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-zinc-800/60" />
        </div>
      ))}
    </div>
  );
}

export function NewsFeed({ isDemo = false }: NewsFeedProps) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const didInitialRefresh = useRef(false);

  const refresh = useCallback(async () => {
    if (isDemo) {
      return;
    }

    setRefreshing(true);

    try {
      const fresh = await fetchNews({ isDemo, refresh: true });
      setArticles(fresh);
      setError(null);
    } catch {
      // Background refresh failure is non-fatal — stored news still shows.
    } finally {
      setRefreshing(false);
    }
  }, [isDemo]);

  useEffect(() => {
    let cancelled = false;

    async function loadStored() {
      try {
        const stored = await fetchNews({ isDemo });

        if (cancelled) {
          return;
        }

        setArticles(stored);
      } catch (loadError) {
        if (cancelled) {
          return;
        }

        setError(
          loadError instanceof Error ? loadError.message : "Failed to load news",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }

      // Hybrid: after the instant stored load, pull fresh in the background.
      if (!cancelled && !didInitialRefresh.current) {
        didInitialRefresh.current = true;
        void refresh();
      }
    }

    void loadStored();

    return () => {
      cancelled = true;
    };
  }, [isDemo, refresh]);

  if (loading) {
    return <NewsSkeleton />;
  }

  return (
    <div className="space-y-4">
      {!isDemo ? (
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-500">
            {refreshing ? "Checking for new articles…" : "Up to date"}
          </p>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-md border border-zinc-800 px-2.5 py-1 text-xs text-zinc-400 transition-colors hover:text-zinc-100 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      ) : null}

      {error ? (
        <div className="fr-card border-rose-500/30 bg-rose-500/10 p-4">
          <p className="text-sm text-rose-200">{error}</p>
        </div>
      ) : null}

      {articles.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          message="No news yet for your watchlist tickers. Add tickers or check back soon."
        />
      ) : (
        <div className="space-y-4">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
