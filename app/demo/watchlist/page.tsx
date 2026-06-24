import { TickerList } from "@/components/watchlist/TickerList";

export default function DemoWatchlistPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="fr-heading text-xl font-semibold text-zinc-100">
          Watchlist
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Tickers monitored for relationship intelligence.
        </p>
      </div>

      <TickerList readOnly isDemo />
    </div>
  );
}
