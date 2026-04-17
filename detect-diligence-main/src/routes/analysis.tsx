import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore, applyFilters } from "@/lib/store";
import { groupByType, groupByMonth, computeStats, topRisky } from "@/lib/stats";
import { ChartCard } from "@/components/chart-card";
import { FraudByTypeChart, TrendLineChart, AmountVsRiskScatter } from "@/components/charts";
import { TopRiskyTable } from "@/components/top-risky-table";
import { EmptyState } from "@/components/info";
import { FilterBar } from "@/components/filter-bar";
import { fmtCurrency, fmtPct } from "@/lib/format";

export const Route = createFileRoute("/analysis")({
  head: () => ({
    meta: [
      { title: "Analysis — FraudIQ" },
      { name: "description", content: "Deep-dive fraud pattern analysis across claim types and time." },
    ],
  }),
  component: AnalysisPage,
});

function AnalysisPage() {
  const rows = useAppStore((s) => s.rows);
  const filters = useAppStore((s) => s.filters);
  const filtered = useMemo(() => applyFilters(rows, filters), [rows, filters]);
  const byType = useMemo(() => groupByType(filtered), [filtered]);
  const byMonth = useMemo(() => groupByMonth(filtered), [filtered]);
  const stats = useMemo(() => computeStats(filtered), [filtered]);
  const top = useMemo(() => topRisky(filtered, 15), [filtered]);
  const scatter = useMemo(
    () =>
      filtered.slice(0, 600).map((r) => ({
        claim_amount: r.claim_amount,
        risk_score: r.risk_score ?? 0,
        fraud: r.predicted_fraud ?? 0,
      })),
    [filtered],
  );

  if (!rows.length) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Fraud Pattern Analysis</h1>
        <EmptyState />
      </div>
    );
  }

  const worstType = [...byType].sort((a, b) => b.fraud / b.total - a.fraud / a.total)[0];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Fraud Pattern Analysis</h1>
        <p className="text-sm text-muted-foreground">
          Patterns, trends, and concentrations across the filtered dataset
        </p>
      </div>

      <FilterBar />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="shadow-card lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Headline patterns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Insight label="Overall fraud rate" value={fmtPct(stats.fraudPct)} />
            <Insight
              label="Highest-fraud type"
              value={worstType ? `${worstType.type} (${fmtPct((worstType.fraud / worstType.total) * 100)})` : "—"}
            />
            <Insight label="Fraud exposure" value={fmtCurrency(stats.fraudAmount)} />
            <Insight label="Avg risk score" value={stats.avgRisk.toFixed(1)} />
            <Insight label="Critical-risk count" value={String(stats.highRisk)} />
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <ChartCard title="Claims & fraud over time">
            <TrendLineChart data={byMonth} />
          </ChartCard>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Fraud by claim type">
          <FraudByTypeChart data={byType} />
        </ChartCard>
        <ChartCard title="Amount vs Risk">
          <AmountVsRiskScatter data={scatter} />
        </ChartCard>
      </div>

      <TopRiskyTable rows={top} />
    </div>
  );
}

function Insight({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-border pb-2 last:border-0">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
