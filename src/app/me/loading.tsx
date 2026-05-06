import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/skeleton";

export default function MeLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 pt-4">
        <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <Card>
        <CardContent className="space-y-3 py-5">
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="py-5">
          <Skeleton className="h-5 w-24" />
        </CardContent>
      </Card>
    </div>
  );
}
