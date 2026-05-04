import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function FastPage() {
  return (
    <>
      <PageHeader title="Fast" subtitle="Phase 1 lands here next" />
      <div className="space-y-4">
        <Card>
          <CardContent className="py-10 text-center">
            <div className="mx-auto mb-4 flex h-32 w-32 items-center justify-center rounded-full border-4 border-dashed border-muted-foreground/30">
              <span className="font-mono text-xl text-muted-foreground">
                —h —m
              </span>
            </div>
            <Button size="lg" className="mt-2 w-full">
              Start a fast
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">
              Wired up in Phase 1.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-6">
            <p className="text-sm font-medium">Coming next</p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>• Live phase ring (Fed → Autophagy)</li>
              <li>• Water + weight quick-log</li>
              <li>• Calendar heatmap of fast lengths</li>
              <li>• Weekly plan editor (16:8 / OMAD / 36h)</li>
              <li>• Fung-anchored phase explainers</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
