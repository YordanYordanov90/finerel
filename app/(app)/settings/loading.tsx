import { Skeleton } from "@/components/ui/skeleton";

function SettingsSectionSkeleton() {
  return (
    <section className="fr-card p-6">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="mt-3 h-4 w-48" />
      <Skeleton className="mt-2 h-3 w-64" />
    </section>
  );
}

export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <Skeleton className="h-7 w-24" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>

      <SettingsSectionSkeleton />
      <SettingsSectionSkeleton />
    </div>
  );
}