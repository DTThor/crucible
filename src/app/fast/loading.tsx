import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/skeleton";

export default function FastLoading() {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3 pt-4">
        <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-8">
          <Skeleton className="h-[280px] w-[280px] rounded-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
