import { NewsFeed } from "@/components/news/NewsFeed";

export default function DemoNewsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="fr-heading text-xl font-semibold text-zinc-100">News</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Latest headlines for the tickers on your watchlist.
        </p>
      </div>

      <NewsFeed isDemo />
    </div>
  );
}
