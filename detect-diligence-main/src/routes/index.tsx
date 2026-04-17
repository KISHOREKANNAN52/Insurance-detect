import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  CircleDollarSign,
  ShieldCheck,
  TrendingUp,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UploadPanel } from "@/components/upload-panel";
import { FilterBar } from "@/components/filter-bar";
import { StatCard } from "@/components/stat-card";
import { ChartCard } from "@/components/chart-card";
import {
  FraudByTypeChart,
  RiskPieChart,
  TrendLineChart,
  AmountVsRiskScatter,
  RiskGauge,
} from "@/components/charts";
import { TopRiskyTable } from "@/components/top-risky-table";
import { EmptyState, HighRiskAlert } from "@/components/info";
import { useAppStore, applyFilters } from "@/lib/store";
import {
  computeStats,
  groupByMonth,
  groupByType,
  riskDistribution,
  topRisky,
} from "@/lib/stats";
import { fmtCurrency, fmtNumber, fmtPct } from "@/lib/format";
import { downloadReport } from "@/lib/report";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — FraudIQ" },
      { name: "description", content: "Insurance fraud detection dashboard with KPIs, charts, and AI insights." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const rows = useAppStore((s) => s.rows);
  const filters = useAppStore((s) => s.filters);
  const fileName = useAppStore((s) => s.fileName);
  const modelSource = useAppStore((s) => s.modelSource);
  const trainedAccuracy = useAppStore((s) => s.trainedAccuracy);

  const filtered = useMemo(() => applyFilters(rows, filters), [rows, filters]);
  const stats = useMemo(() => computeStats(filtered), [filtered]);
  const byType = useMemo(() => groupByType(filtered), [filtered]);
  const byMonth = useMemo(() => groupByMonth(filtered), [filtered]);
  const dist = useMemo(() => riskDistribution(filtered), [filtered]);
  const top = useMemo(() => topRisky(filtered, 10), [filtered]);
  const scatter = useMemo(
    () =>
      filtered.slice(0, 400).map((r) => ({
        claim_amount: r.claim_amount,
        risk_score: r.risk_score ?? 0,
        fraud: r.predicted_fraud ?? 0,
      })),
    [filtered],
  );

  const handleReport = () =>
    downloadReport({ fileName, stats, modelSource, trainedAccuracy, topRisky: top, byType });

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Fraud Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Real-time insurance claim analysis & risk scoring
          </p>
        </div>
        {!!rows.length && (
          <Button variant="outline" onClick={handleReport}>
            <Download className="mr-2 h-4 w-4" />
            PDF Report
          </Button>
        )}
      </div>

      <UploadPanel />

      {!rows.length ? (
        <EmptyState />
      ) : (
        <>
          <HighRiskAlert count={stats.highRisk} total={stats.total} />
          <FilterBar />

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Total Claims"
              value={fmtNumber(stats.total)}
              hint={`${fmtCurrency(stats.totalAmount)} total exposure`}
              icon={Activity}
              tone="primary"
            />
            <StatCard
              label="Predicted Fraud"
              value={fmtNumber(stats.fraudCount)}
              hint={fmtPct(stats.fraudPct)}
              icon={AlertTriangle}
              tone="danger"
            />
            <StatCard
              label="Fraud Amount"
              value={fmtCurrency(stats.fraudAmount)}
              hint={`${stats.totalAmount ? fmtPct((stats.fraudAmount / stats.totalAmount) * 100) : "0%"} of total`}
              icon={CircleDollarSign}
              tone="warning"
            />
            <StatCard
              label="Critical Risk"
              value={fmtNumber(stats.highRisk)}
              hint="Score ≥ 75"
              icon={ShieldCheck}
              tone="success"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ChartCard title="Claims & fraud over time" hint="Monthly trend">
                <TrendLineChart data={byMonth} />
              </ChartCard>
            </div>
            <ChartCard title="Average risk score" hint="0 = safe · 100 = critical">
              <RiskGauge value={stats.avgRisk} />
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <ChartCard title="Fraud by claim type">
              <FraudByTypeChart data={byType} />
            </ChartCard>
            <ChartCard title="Risk distribution">
              <RiskPieChart data={dist} />
            </ChartCard>
            <ChartCard title="Amount vs Risk" hint="First 400 claims">
              <AmountVsRiskScatter data={scatter} />
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <TopRiskyTable rows={top} />
          </div>

          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3" /> Model:{" "}
            {modelSource === "trained"
              ? `Random Forest trained on uploaded data${trainedAccuracy ? ` · ${(trainedAccuracy * 100).toFixed(1)}% accuracy` : ""}`
              : "Random Forest pre-trained on synthetic data"}
          </p>
        </>
      )}
    </div>
  );
}
