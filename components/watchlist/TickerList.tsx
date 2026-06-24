"use client";

import { ListFilter, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { WatchlistListSkeleton } from "@/components/skeletons/WatchlistSkeletons";
import { AddTickerInput } from "@/components/watchlist/AddTickerInput";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import type { WatchlistTicker } from "@/lib/schemas/watchlist";
import {
  buildTickerActivityMap,
  fetchAllRelationships,
  fetchWatchlist,
  formatActivityDate,
  removeWatchlistTicker,
  type TickerActivity,
} from "@/lib/utils/watchlist-api";

type TickerListProps = {
  readOnly: boolean;
  isDemo?: boolean;
};

type TickerRow = WatchlistTicker & {
  activity: TickerActivity;
};

function TickerPill({ ticker }: { ticker: string }) {
  return (
    <span className="font-mono rounded-md border border-zinc-800 bg-black/55 px-1.5 py-0.5 text-xs text-cyan-300/95">
      {ticker}
    </span>
  );
}

function TickerRowItem({
  row,
  readOnly,
  onRemoved,
}: {
  row: TickerRow;
  readOnly: boolean;
  onRemoved: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);

  async function handleRemove() {
    setRemoving(true);

    try {
      await removeWatchlistTicker(row.ticker);
      toast.success(`${row.ticker} removed from watchlist`);
      onRemoved();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to remove ticker";
      toast.error(message);
    } finally {
      setRemoving(false);
      setConfirming(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-4 border-b border-zinc-800 px-4 py-3 last:border-b-0">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <TickerPill ticker={row.ticker} />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-400">
          <span>
            {row.activity.relationshipCount}{" "}
            {row.activity.relationshipCount === 1
              ? "relationship"
              : "relationships"}
          </span>
          <span className="font-mono text-xs">
            {row.activity.lastActivityDate
              ? `Last seen ${formatActivityDate(row.activity.lastActivityDate)}`
              : "No activity yet"}
          </span>
        </div>
      </div>

      {!readOnly ? (
        <div className="flex shrink-0 items-center gap-2">
          {confirming ? (
            <>
              <span className="text-xs text-zinc-400">Remove {row.ticker}?</span>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={removing}
                onClick={() => void handleRemove()}
              >
                {removing ? "Removing…" : "Confirm"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={removing}
                onClick={() => setConfirming(false)}
                className="text-zinc-400 hover:text-zinc-100"
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={() => setConfirming(true)}
              aria-label={`Remove ${row.ticker} from watchlist`}
              className="text-zinc-400 hover:text-rose-400"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function TickerList({ readOnly, isDemo = false }: TickerListProps) {
  const [rows, setRows] = useState<TickerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWatchlist = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const [tickers, relationships] = await Promise.all([
        fetchWatchlist(isDemo),
        fetchAllRelationships(isDemo),
      ]);
      const activityMap = buildTickerActivityMap(tickers, relationships);

      setRows(
        tickers.map((ticker) => ({
          ...ticker,
          activity: activityMap.get(ticker.ticker) ?? {
            relationshipCount: 0,
            lastActivityDate: null,
          },
        })),
      );
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : "Failed to load watchlist";
      setError(message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [isDemo]);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialWatchlist() {
      try {
        const [tickers, relationships] = await Promise.all([
          fetchWatchlist(isDemo),
          fetchAllRelationships(isDemo),
        ]);

        if (cancelled) {
          return;
        }

        const activityMap = buildTickerActivityMap(tickers, relationships);

        setRows(
          tickers.map((ticker) => ({
            ...ticker,
            activity: activityMap.get(ticker.ticker) ?? {
              relationshipCount: 0,
              lastActivityDate: null,
            },
          })),
        );
      } catch (loadError) {
        if (cancelled) {
          return;
        }

        const message =
          loadError instanceof Error
            ? loadError.message
            : "Failed to load watchlist";
        setError(message);
        setRows([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadInitialWatchlist();

    return () => {
      cancelled = true;
    };
  }, [isDemo]);

  if (loading) {
    return (
      <div className="space-y-4">
        {readOnly ? (
          <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
            Demo account — watchlist is read-only.
          </p>
        ) : null}
        <WatchlistListSkeleton showAddInput={!readOnly} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {readOnly ? (
        <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
          Demo account — watchlist is read-only.
        </p>
      ) : (
        <AddTickerInput readOnly={readOnly} onAdded={() => void loadWatchlist()} />
      )}

      {error ? (
        <div className="fr-card flex items-center justify-between gap-4 border-rose-500/30 bg-rose-500/10 p-4">
          <p className="text-sm text-rose-200">{error}</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void loadWatchlist()}
            className="shrink-0 border-zinc-800 bg-transparent text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100"
          >
            Retry
          </Button>
        </div>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState
          icon={ListFilter}
          message="Your watchlist is empty. Add tickers to start monitoring relationships."
        />
      ) : (
        <div className="fr-card overflow-hidden">
          {rows.map((row) => (
            <TickerRowItem
              key={row.ticker}
              row={row}
              readOnly={readOnly}
              onRemoved={() => void loadWatchlist()}
            />
          ))}
        </div>
      )}
    </div>
  );
}