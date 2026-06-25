"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  type TickerEntry,
  searchTickers,
} from "@/lib/data/tickers";
import { addWatchlistTickerSchema } from "@/lib/schemas/watchlist";
import { addWatchlistTicker } from "@/lib/utils/watchlist-api";

const TICKER_PATTERN = /^[A-Za-z.]{1,5}$/;

type AddTickerInputProps = {
  readOnly: boolean;
  onAdded: () => void;
};

export function AddTickerInput({ readOnly, onAdded }: AddTickerInputProps) {
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState<TickerEntry[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectTicker(ticker: string) {
    setValue(ticker);
    setShowSuggestions(false);
    inputRef.current?.focus();
  }

  async function submit(ticker: string) {
    const parsed = addWatchlistTickerSchema.safeParse({ ticker });

    if (!parsed.success) {
      const message =
        parsed.error.issues[0]?.message ?? "Invalid ticker format";
      toast.error(message);
      return;
    }

    setSubmitting(true);

    try {
      await addWatchlistTicker(parsed.data.ticker);
      setValue("");
      toast.success(`${parsed.data.ticker} added to watchlist`);
      onAdded();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to add ticker";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (readOnly || submitting) {
      return;
    }

    setShowSuggestions(false);
    await submit(value);
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const next = event.target.value.toUpperCase();

    if (next === "" || TICKER_PATTERN.test(next)) {
      setValue(next);
      if (next.length >= 1) {
        const results = searchTickers(next);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
      setHighlightedIndex(-1);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!showSuggestions || suggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0,
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1,
      );
    } else if (event.key === "Enter" && highlightedIndex >= 0) {
      event.preventDefault();
      const selected = suggestions[highlightedIndex];
      if (selected) {
        selectTicker(selected.symbol);
      }
    } else if (event.key === "Escape") {
      setShowSuggestions(false);
    }
  }

  if (readOnly) {
    return null;
  }

  return (
    <div ref={containerRef} className="relative">
      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="flex gap-2"
      >
        <div className="relative max-w-xs flex-1">
          <Input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            placeholder="e.g. NVDA"
            maxLength={5}
            autoComplete="off"
            spellCheck={false}
            aria-label="Ticker symbol"
            aria-expanded={showSuggestions}
            aria-autocomplete="list"
            role="combobox"
            className="h-9 border-zinc-800 bg-[#111111] font-mono uppercase text-zinc-100 placeholder:normal-case placeholder:font-sans"
          />
          {showSuggestions && (
            <ul
              role="listbox"
              className="absolute top-full z-50 mt-1 w-full overflow-hidden rounded-md border border-zinc-800 bg-[#111111] shadow-lg"
            >
              {suggestions.map((entry, index) => (
                <li
                  key={entry.symbol}
                  role="option"
                  aria-selected={index === highlightedIndex}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectTicker(entry.symbol);
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`flex cursor-pointer items-center gap-3 px-3 py-2 text-sm ${
                    index === highlightedIndex
                      ? "bg-zinc-800 text-zinc-100"
                      : "text-zinc-400 hover:bg-zinc-800/50"
                  }`}
                >
                  <span className="w-14 shrink-0 font-mono text-cyan-300/95">
                    {entry.symbol}
                  </span>
                  <span className="truncate">{entry.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Button
          type="submit"
          disabled={submitting || value.length === 0}
          className="fr-cta-btn h-9 border-0 px-4"
        >
          {submitting ? "Adding…" : "Add ticker"}
        </Button>
      </form>
    </div>
  );
}
