import { Skeleton } from "@/components/ui/skeleton";

function TickerRowSkeleton() {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-zinc-800 px-4 py-3 last:border-b-0">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-4 w-4 shrink-0 rounded" />
    </div>
  );
}

export function WatchlistListSkeleton({
  showAddInput = true,
  rows = 5,
}: {
  showAddInput?: boolean;
  rows?: number;
}) {
  return (
    <div className="space-y-4">
      {showAddInput ? <Skeleton className="h-9 w-64" /> : null}
      <div className="fr-card overflow-hidden">
        {Array.from({ length: rows }, (_, index) => (
          <TickerRowSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

export function WatchlistPageSkeleton() {
  return (
    <div className="space-y-4">
      <div>
        <Skeleton className="h-7 w-28" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>
      <WatchlistListSkeleton />
    </div>
  );
}