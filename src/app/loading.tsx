import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/skeleton";

export default function TodayLoading() {
  return (
    <>
      <PageHeader title="Today" />
      <div className="space-y-4">
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
          <CardHeader>
            <Skeleton className="h-4 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="space-y-2 py-5">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-7 w-16" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-2 py-5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-7 w-20" />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
