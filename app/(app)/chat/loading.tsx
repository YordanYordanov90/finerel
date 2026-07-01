import { Skeleton } from "@/components/ui/skeleton";

export default function ChatLoading() {
  return (
    <div className="-m-4 flex h-[calc(100dvh-3.5rem)] overflow-hidden md:-m-6">
      <div className="w-56 shrink-0 border-r border-zinc-800 bg-[#111111] p-3">
        <Skeleton className="h-10 w-full rounded-md" />
        <div className="mt-3 space-y-2">
          <Skeleton className="h-8 w-full rounded-md" />
          <Skeleton className="h-8 w-full rounded-md" />
          <Skeleton className="h-8 w-full rounded-md" />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <Skeleton className="h-24 w-2/3 rounded-xl" />
        <Skeleton className="mt-4 h-32 w-full max-w-xl rounded-xl" />
      </div>
    </div>
  );
}