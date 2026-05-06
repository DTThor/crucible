import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/skeleton";

export default function TodayLoading() {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3 pt-4">
        <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-9 w-44" />
          <Skeleton className="h-2 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="py-5 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-2 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
