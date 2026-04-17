import { Card, CardContent } from "@/components/ui/card";
import { ShieldAlert, FileSpreadsheet } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function EmptyState() {
  return (
    <Card className="shadow-card">
      <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full gradient-primary text-primary-foreground">
          <FileSpreadsheet className="h-7 w-7" />
        </div>
        <div>
          <p className="text-base font-semibold">No dataset loaded</p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Upload an insurance claims CSV or click <strong>Use sample</strong> above to explore the
            full dashboard, charts, ML predictions, and AI insights.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function HighRiskAlert({ count, total }: { count: number; total: number }) {
  if (!count) return null;
  return (
    <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm">
      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-destructive">
          {count} critical-risk claim{count === 1 ? "" : "s"} detected
        </p>
        <p className="text-xs text-muted-foreground">
          {((count / total) * 100).toFixed(1)}% of the current dataset has a risk score ≥ 75. Review
          immediately.
        </p>
      </div>
      <Link
        to="/predictions"
        className="shrink-0 rounded-md bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground hover:opacity-90"
      >
        Review
      </Link>
    </div>
  );
}
