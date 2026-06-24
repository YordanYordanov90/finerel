import { Skeleton } from "@/components/ui/skeleton";

import { RelationshipCardSkeleton } from "@/components/skeletons/RelationshipCardSkeleton";

function BriefingSummarySkeleton() {
  return (
    <article className="fr-card flex flex-col gap-4 p-5">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-36" />
      </div>
    </article>
  );
}

export function OverviewLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <section className="flex flex-col gap-4 lg:col-span-2">
        <Skeleton className="h-5 w-44" />
        <div className="flex flex-col gap-4">
          <RelationshipCardSkeleton />
          <RelationshipCardSkeleton />
          <RelationshipCardSkeleton />
          <RelationshipCardSkeleton />
        </div>
      </section>

      <aside>
        <BriefingSummarySkeleton />
      </aside>
    </div>
  );
}