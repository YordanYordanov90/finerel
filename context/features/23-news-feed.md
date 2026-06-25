# Feature 23 — News Feed Page

## Status: ✅ Done (June 25, 2026)

## Summary

In-app news feed showing the latest headlines for the user's watchlist tickers. Uses a hybrid approach: stored news from the DB renders instantly, then a background Finnhub refresh updates the feed silently.

## Files

- `app/api/news/route.ts` — `GET /api/news`. Auth-gated, demo-friendly (`?demo=true`). Fetches user's watchlist tickers, queries `newsItems` table filtered with `arrayOverlaps(mentionedTickers, tickers)`, ordered `publishedAt DESC`, limit 60. With `?refresh=true` (and not demo), calls `fetchWatchlistNews({ userId, tickers, limitPerTicker: 15 })` to pull fresh articles from Finnhub (persisting new ones) before reading back. `maxDuration = 60`.
- `lib/utils/news-api.ts` — `fetchNews({ isDemo, refresh })` client helper. `formatNewsDate(isoDate)` — relative time ("Just now", "3h ago", "2d ago") with fallback to "Jun 24" for older items. `NewsArticle` type.
- `components/news/NewsFeed.tsx` — `"use client"` component. On mount: loads stored news → shows instantly → fires background refresh (once per mount, tracked with `useRef`). Manual Refresh button (spinner icon, hidden in demo). Skeleton loading state (4 animated cards). Empty state (no tickers / no news yet). Error state.
- `app/(app)/news/page.tsx` — Auth-gated server wrapper.
- `app/demo/news/page.tsx` — Demo wrapper (passes `isDemo`; no refresh calls, no Refresh button shown).
- `components/AppSidebar.tsx` — Added "News" nav item (Lucide `Newspaper` icon) between Overview and Graph.

## Data Flow

```
Page load
  → fetchNews() → GET /api/news (stored news) → render immediately
  → fetchNews({ refresh: true }) → GET /api/news?refresh=true
      → fetchWatchlistNews (Finnhub, last 24h, 15/ticker) → persist new
      → re-query DB → update feed silently
```

## Notes

- The `arrayOverlaps` Drizzle helper filters news items whose `mentionedTickers` array overlaps with the user's current watchlist tickers.
- Demo users see stored demo-seeded news; the Finnhub refresh is skipped for demo to avoid spending API calls on a shared account.
- The news feed is independent of the morning briefing cron — it reflects all stored news regardless of briefing dates.
