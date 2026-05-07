import { Skeleton } from "@/components/skeleton";

export default function TrainHistoryLoading() {
  return (
    <>
      <header className="sticky top-0 z-30 -mx-4 mb-3 flex items-center gap-2 border-b border-border bg-background/80 px-4 py-3">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-24" />
      </header>
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </>
  );
}
