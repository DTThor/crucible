import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/skeleton";

export default function FastLoading() {
  return (
    <>
      <PageHeader title="Fast" />
      <div className="space-y-4">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <Skeleton className="h-[280px] w-[280px] rounded-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
