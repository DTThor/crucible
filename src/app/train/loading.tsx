import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/skeleton";

export default function TrainLoading() {
  return (
    <>
      <PageHeader title="Train" />
      <div className="space-y-4">
        <Card>
          <CardContent className="space-y-3 py-6">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
