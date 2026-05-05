import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/skeleton";

export default function MeLoading() {
  return (
    <>
      <PageHeader title="Me" />
      <div className="space-y-4">
        <Card>
          <CardContent className="space-y-2 py-6">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-48" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5">
            <Skeleton className="h-5 w-24" />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
