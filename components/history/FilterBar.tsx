"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  defaultHistoryFilters,
  parseHistoryFilters,
  RELATION_TYPES,
  type HistoryFilters,
} from "@/lib/schemas/history-filters";
import { formatRelationType } from "@/lib/utils/graph";
import { cn } from "@/lib/utils";

type FilterBarProps = {
  filters: HistoryFilters;
  onChange: (filters: HistoryFilters) => void;
};

const CONFIDENCE_OPTIONS = Array.from({ length: 11 }, (_, index) => index / 10);

function RelationTypeMultiSelect({
  selected,
  onChange,
}: {
  selected: HistoryFilters["relationTypes"];
  onChange: (types: HistoryFilters["relationTypes"]) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const label =
    selected.length === 0
      ? "All types"
      : selected.length === 1
        ? formatRelationType(selected[0])
        : `${selected.length} types`;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-9 w-full items-center justify-between rounded-md border border-zinc-800 bg-[#111111] px-3 text-sm text-zinc-100"
      >
        <span className="truncate">{label}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400" />
      </button>

      {open ? (
        <div className="absolute z-20 mt-1 w-full rounded-md border border-zinc-800 bg-[#111111] p-2 shadow-lg">
          {RELATION_TYPES.map((type) => {
            const checked = selected.includes(type);

            return (
              <label
                key={type}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-zinc-100 hover:bg-zinc-800/60"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    const next = checked
                      ? selected.filter((item) => item !== type)
                      : [...selected, type];
                    onChange(next);
                  }}
                  className="accent-cyan-500"
                />
                {formatRelationType(type)}
              </label>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function FilterBar({ filters, onChange }: FilterBarProps) {
  function updateFilters(partial: Partial<HistoryFilters>) {
    onChange(parseHistoryFilters({ ...filters, ...partial }));
  }

  return (
    <div className="fr-card p-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-1.5">
          <label className="text-xs text-zinc-400">Relation type</label>
          <RelationTypeMultiSelect
            selected={filters.relationTypes}
            onChange={(relationTypes) => updateFilters({ relationTypes })}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="min-confidence" className="text-xs text-zinc-400">
            Min confidence
          </label>
          <select
            id="min-confidence"
            value={filters.minConfidence ?? ""}
            onChange={(event) => {
              const value = event.target.value;
              updateFilters({
                minConfidence: value === "" ? null : Number(value),
              });
            }}
            className="h-9 w-full rounded-md border border-zinc-800 bg-[#111111] px-3 text-sm text-zinc-100"
          >
            <option value="">Any</option>
            {CONFIDENCE_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {Math.round(value * 100)}%
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <span className="text-xs text-zinc-400">Date range</span>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={filters.startDate}
              onChange={(event) => updateFilters({ startDate: event.target.value })}
              className="h-9 rounded-md border border-zinc-800 bg-[#111111] px-3 text-sm text-zinc-100"
              aria-label="Start date"
            />
            <input
              type="date"
              value={filters.endDate}
              onChange={(event) => updateFilters({ endDate: event.target.value })}
              className="h-9 rounded-md border border-zinc-800 bg-[#111111] px-3 text-sm text-zinc-100"
              aria-label="End date"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="ticker-filter" className="text-xs text-zinc-400">
            Ticker
          </label>
          <input
            id="ticker-filter"
            type="text"
            maxLength={5}
            value={filters.ticker}
            onChange={(event) =>
              updateFilters({ ticker: event.target.value.toUpperCase() })
            }
            placeholder="e.g. NVDA"
            className="h-9 w-full rounded-md border border-zinc-800 bg-[#111111] px-3 font-mono text-sm uppercase text-zinc-100 placeholder:text-zinc-600"
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange(defaultHistoryFilters)}
          className={cn(
            "border-zinc-800 bg-transparent text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100",
          )}
        >
          Clear filters
        </Button>
      </div>
    </div>
  );
}