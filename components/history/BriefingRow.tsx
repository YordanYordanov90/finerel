"use client";

import { ChevronDown } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

import {
  RelationshipCard,
  type RelationshipCardData,
} from "@/components/relationships/RelationshipCard";
import { RelationshipCardSkeleton } from "@/components/skeletons/RelationshipCardSkeleton";
import type { HistoryFilters } from "@/lib/schemas/history-filters";
import type { Briefing } from "@/lib/utils/history-api";
import { fetchBriefingRelationships } from "@/lib/utils/history-api";
import { cn } from "@/lib/utils";

type BriefingRowProps = {
  briefing: Briefing;
  filters: HistoryFilters;
  isExpanded: boolean;
  onToggle: () => void;
  isDemo?: boolean;
};

const SUMMARY_TRUNCATE_LENGTH = 120;

function formatBriefingDate(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function BriefingRow({
  briefing,
  filters,
  isExpanded,
  onToggle,
  isDemo = false,
}: BriefingRowProps) {
  const [relationships, setRelationships] = useState<RelationshipCardData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const truncatedSummary =
    briefing.summary.length > SUMMARY_TRUNCATE_LENGTH
      ? `${briefing.summary.slice(0, SUMMARY_TRUNCATE_LENGTH)}…`
      : briefing.summary;

  const loadRelationships = useCallback(async (cancelled?: () => boolean) => {
    setLoading(true);
    setError(null);

    try {
      const rows = await fetchBriefingRelationships(
        filters,
        briefing.id,
        briefing.briefingDate,
        isDemo,
      );

      if (cancelled?.()) {
        return;
      }

      setRelationships(rows);
    } catch (loadError) {
      if (cancelled?.()) {
        return;
      }

      const message =
        loadError instanceof Error ? loadError.message : "Failed to load relationships";
      setError(message);
      setRelationships([]);
    } finally {
      if (!cancelled?.()) {
        setLoading(false);
      }
    }
  }, [filters, briefing.id, briefing.briefingDate, isDemo]);

  useEffect(() => {
    if (!isExpanded) {
      return;
    }

    let cancelled = false;

    void loadRelationships(() => cancelled);

    return () => {
      cancelled = true;
    };
  }, [isExpanded, loadRelationships]);

  return (
    <div className="border-b border-zinc-800 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-zinc-900/40"
        aria-expanded={isExpanded}
      >
        <ChevronDown
          className={cn(
            "mt-0.5 h-4 w-4 shrink-0 text-zinc-400 transition-transform",
            isExpanded && "rotate-180",
          )}
        />

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-zinc-100">
              {formatBriefingDate(briefing.briefingDate)}
            </span>
            <span className="fr-badge">{briefing.itemsProcessed} items</span>
            <span className="fr-badge">{briefing.relationshipsFound} relationships</span>
          </div>
          <p className="text-sm text-zinc-400">{truncatedSummary}</p>
        </div>
      </button>

      {isExpanded ? (
        <div className="space-y-4 border-t border-zinc-800 bg-zinc-950/30 px-4 py-4 pl-11">
          <div>
            <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
              Full summary
            </h4>
            <p className="text-sm leading-relaxed text-zinc-300">{briefing.summary}</p>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
              Relationships
            </h4>

            {loading ? (
              <div className="flex flex-col gap-4">
                <RelationshipCardSkeleton />
                <RelationshipCardSkeleton />
              </div>
            ) : error ? (
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-rose-400">{error}</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void loadRelationships(undefined)}
                  className="shrink-0 border-zinc-800 bg-transparent text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100"
                >
                  Retry
                </Button>
              </div>
            ) : relationships.length > 0 ? (
              <div className="flex flex-col gap-4">
                {relationships.map((relationship) => (
                  <RelationshipCard
                    key={`${relationship.sourceCompany}-${relationship.targetCompany}-${relationship.relationType}-${relationship.sourceUrl}`}
                    relationship={relationship}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-400">
                No relationships match the current filters for this briefing.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}