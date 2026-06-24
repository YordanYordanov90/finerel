import { Skeleton } from "@/components/ui/skeleton";

export default function DemoGraphLoading() {
  return (
    <div className="-m-4 md:-m-6">
      <Skeleton className="h-[calc(100vh-8rem)] w-full rounded-xl" />
    </div>
  );
}
