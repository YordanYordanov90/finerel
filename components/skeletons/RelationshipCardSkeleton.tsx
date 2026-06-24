import { Skeleton } from "@/components/ui/skeleton";

export function RelationshipCardSkeleton() {
  return (
    <article className="fr-card flex flex-col gap-3 p-5">
      <Skeleton className="h-5 w-48" />
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-14" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </article>
  );
}