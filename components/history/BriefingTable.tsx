"use client";

import { History } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { BriefingRow } from "@/components/history/BriefingRow";
import { FilterBar } from "@/components/history/FilterBar";
import { HistoryTableSkeleton } from "@/components/skeletons/HistorySkeletons";
import { Button } from "@/components/ui/button";
import {
  defaultHistoryFilters,
  type HistoryFilters,
} from "@/lib/schemas/history-filters";
import {
  fetchBriefings,
  filterBriefingsByDate,
  type Briefing,
} from "@/lib/utils/history-api";

const PAGE_SIZE = 20;

type BriefingTableProps = {
  isDemo?: boolean;
};

export function BriefingTable({ isDemo = false }: BriefingTableProps) {
  const [filters, setFilters] = useState<HistoryFilters>(defaultHistoryFilters);
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const loadBriefings = useCallback(async (nextOffset: number, append: boolean) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setExpandedId(null);
    }

    setError(null);

    try {
      const data = await fetchBriefings(PAGE_SIZE, nextOffset, isDemo);

      setBriefings((current) =>
        append ? [...current, ...data.briefings] : data.briefings,
      );
      setTotal(data.total);
      setOffset(nextOffset + data.briefings.length);
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : "Failed to load briefings";
      setError(message);

      if (!append) {
        setBriefings([]);
        setTotal(0);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [isDemo]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadBriefings(0, false);
  }, [loadBriefings]);

  const visibleBriefings = useMemo(
    () => filterBriefingsByDate(briefings, filters.startDate, filters.endDate),
    [briefings, filters.startDate, filters.endDate],
  );

  const hasMore = offset < total;

  if (loading) {
    return (
      <div className="space-y-4">
        <FilterBar filters={filters} onChange={setFilters} />
        <HistoryTableSkeleton />
      </div>
    );
  }

  if (total === 0 && !error) {
    return (
      <div className="space-y-4">
        <FilterBar filters={filters} onChange={setFilters} />
        <EmptyState
          icon={History}
          message="No briefings yet. Your morning briefing history will appear here after the first run."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <FilterBar filters={filters} onChange={setFilters} />

      {error ? (
        <div className="fr-card flex items-center justify-between gap-4 border-rose-500/30 bg-rose-500/10 p-4">
          <p className="text-sm text-rose-200">{error}</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void loadBriefings(0, false)}
            className="shrink-0 border-zinc-800 bg-transparent text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100"
          >
            Retry
          </Button>
        </div>
      ) : null}

      {visibleBriefings.length === 0 ? (
        <div className="fr-card p-6">
          <p className="text-sm text-zinc-400">
            No briefings match the selected date range.
          </p>
        </div>
      ) : (
        <div className="fr-card overflow-hidden">
          {visibleBriefings.map((briefing) => (
            <BriefingRow
              key={briefing.id}
              briefing={briefing}
              filters={filters}
              isExpanded={expandedId === briefing.id}
              onToggle={() =>
                setExpandedId((current) =>
                  current === briefing.id ? null : briefing.id,
                )
              }
              isDemo={isDemo}
            />
          ))}
        </div>
      )}

      {hasMore ? (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => void loadBriefings(offset, true)}
            disabled={loadingMore}
            className="border-zinc-800 bg-transparent text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100"
          >
            {loadingMore ? "Loading…" : "Load more"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}