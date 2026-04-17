import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore, applyFilters } from "@/lib/store";
import { topRisky } from "@/lib/stats";
import { TopRiskyTable } from "@/components/top-risky-table";
import { EmptyState } from "@/components/info";
import { FilterBar } from "@/components/filter-bar";
import { ChartCard } from "@/components/chart-card";
import { RiskGauge } from "@/components/charts";
import { scoreDataset } from "@/lib/ml";
import type { ClaimRow } from "@/lib/types";
import { riskTone } from "@/lib/format";

export const Route = createFileRoute("/predictions")({
  head: () => ({
    meta: [
      { title: "Predictions — FraudIQ" },
      { name: "description", content: "Score individual claims and review high-risk transactions." },
    ],
  }),
  component: PredictionsPage,
});

const TONE_LABEL: Record<ReturnType<typeof riskTone>, string> = {
  critical: "Critical risk — investigate now",
  high: "High risk — recommend review",
  medium: "Moderate risk — verify documentation",
  low: "Low risk — likely legitimate",
};

const TONE_BG: Record<ReturnType<typeof riskTone>, string> = {
  critical: "bg-destructive text-destructive-foreground",
  high: "bg-warning text-warning-foreground",
  medium: "bg-accent text-accent-foreground",
  low: "bg-success text-success-foreground",
};

function PredictionsPage() {
  const rows = useAppStore((s) => s.rows);
  const filters = useAppStore((s) => s.filters);
  const filtered = useMemo(() => applyFilters(rows, filters), [rows, filters]);
  const top = useMemo(() => topRisky(filtered, 25), [filtered]);

  const [form, setForm] = useState({
    claim_type: "Auto",
    claim_amount: 12000,
    customer_age: 35,
    policy_tenure: 3,
    incident_severity: 6,
    prior_claims: 1,
  });
  const [score, setScore] = useState<number | null>(null);

  function predict() {
    const synthetic: ClaimRow = {
      claim_id: "SCORE-1",
      date: new Date().toISOString().slice(0, 10),
      ...form,
    };
    const { rows: scored } = scoreDataset([synthetic]);
    setScore(scored[0].risk_score ?? 0);
  }

  const tone = score !== null ? riskTone(score) : null;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Predictions & Scoring</h1>
        <p className="text-sm text-muted-foreground">
          Score new claims with the trained model, or review the highest-risk transactions in your dataset
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="shadow-card lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Score a single claim</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              <Field label="Claim type">
                <select
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                  value={form.claim_type}
                  onChange={(e) => setForm({ ...form, claim_type: e.target.value })}
                >
                  {["Auto", "Health", "Property", "Life", "Travel"].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Field>
              <Field label="Claim amount ($)">
                <Input
                  type="number"
                  value={form.claim_amount}
                  onChange={(e) => setForm({ ...form, claim_amount: Number(e.target.value) })}
                />
              </Field>
              <Field label="Customer age">
                <Input
                  type="number"
                  value={form.customer_age}
                  onChange={(e) => setForm({ ...form, customer_age: Number(e.target.value) })}
                />
              </Field>
              <Field label="Policy tenure (years)">
                <Input
                  type="number"
                  step="0.1"
                  value={form.policy_tenure}
                  onChange={(e) => setForm({ ...form, policy_tenure: Number(e.target.value) })}
                />
              </Field>
              <Field label="Incident severity (1-10)">
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={form.incident_severity}
                  onChange={(e) => setForm({ ...form, incident_severity: Number(e.target.value) })}
                />
              </Field>
              <Field label="Prior claims">
                <Input
                  type="number"
                  value={form.prior_claims}
                  onChange={(e) => setForm({ ...form, prior_claims: Number(e.target.value) })}
                />
              </Field>
            </div>
            <Button onClick={predict}>Run prediction</Button>
            {score !== null && tone && (
              <div className="mt-2 flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
                <Badge className={TONE_BG[tone]}>Risk {score}/100</Badge>
                <span className="text-sm">{TONE_LABEL[tone]}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <ChartCard title="Live risk score">
          <RiskGauge value={score ?? 0} />
        </ChartCard>
      </div>

      {!rows.length ? (
        <EmptyState />
      ) : (
        <>
          <FilterBar />
          <TopRiskyTable rows={top} />
        </>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
