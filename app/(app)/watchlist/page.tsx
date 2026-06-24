import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { TickerList } from "@/components/watchlist/TickerList";
import { isDemoUser } from "@/lib/auth";

export default async function WatchlistPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const readOnly = isDemoUser(userId);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="fr-heading text-xl font-semibold text-zinc-100">
          Watchlist
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Manage the tickers monitored for relationship intelligence.
        </p>
      </div>

      <TickerList readOnly={readOnly} />
    </div>
  );
}