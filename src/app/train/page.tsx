import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function TrainPage() {
  return (
    <>
      <PageHeader title="Train" subtitle="Phase 2 lands here next" />
      <div className="space-y-4">
        <Card>
          <CardContent className="py-6">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Today's session
            </p>
            <p className="mt-1 text-lg font-semibold">
              Lift · 30 min · DB upper body
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Suggested workout will populate from your training template once
              Phase 2 is live.
            </p>
            <Button size="lg" className="mt-4 w-full">
              Start workout
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-6">
            <p className="text-sm font-medium">Coming next</p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>• In-workout set logger with smart weight suggestions</li>
              <li>• GTX class card (Lifetime South Austin schedule)</li>
              <li>• Sauna + cold-plunge quick-log</li>
              <li>• Per-exercise progression charts</li>
              <li>• Weekly volume by muscle group</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
