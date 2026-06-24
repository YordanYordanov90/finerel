import { Skeleton } from "@/components/ui/skeleton";

function HistoryTableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 border-b border-zinc-800 px-4 py-3 last:border-b-0">
      <Skeleton className="h-4 w-24 shrink-0" />
      <Skeleton className="h-4 w-64 min-w-0 flex-1" />
      <Skeleton className="h-4 w-12 shrink-0" />
      <Skeleton className="h-4 w-12 shrink-0" />
    </div>
  );
}

export function HistoryTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="fr-card overflow-hidden">
      {Array.from({ length: rows }, (_, index) => (
        <HistoryTableRowSkeleton key={index} />
      ))}
    </div>
  );
}

function HistoryFiltersSkeleton() {
  return (
    <div className="fr-card p-4">
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-40" />
      </div>
    </div>
  );
}

export function HistoryLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <HistoryFiltersSkeleton />
      <HistoryTableSkeleton />
    </div>
  );
}