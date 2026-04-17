import type { ClaimRow, DatasetStats } from "./types";

export function computeStats(rows: ClaimRow[]): DatasetStats {
  const total = rows.length;
  if (!total) {
    return { total: 0, fraudCount: 0, fraudPct: 0, totalAmount: 0, fraudAmount: 0, avgRisk: 0, highRisk: 0 };
  }
  let fraudCount = 0;
  let totalAmount = 0;
  let fraudAmount = 0;
  let riskSum = 0;
  let highRisk = 0;
  for (const r of rows) {
    totalAmount += r.claim_amount;
    if (r.predicted_fraud === 1) {
      fraudCount++;
      fraudAmount += r.claim_amount;
    }
    riskSum += r.risk_score ?? 0;
    if ((r.risk_score ?? 0) >= 75) highRisk++;
  }
  return {
    total,
    fraudCount,
    fraudPct: (fraudCount / total) * 100,
    totalAmount,
    fraudAmount,
    avgRisk: riskSum / total,
    highRisk,
  };
}

export function groupByType(rows: ClaimRow[]) {
  const m = new Map<string, { type: string; total: number; fraud: number; amount: number }>();
  for (const r of rows) {
    const k = r.claim_type;
    if (!m.has(k)) m.set(k, { type: k, total: 0, fraud: 0, amount: 0 });
    const e = m.get(k)!;
    e.total++;
    e.amount += r.claim_amount;
    if (r.predicted_fraud === 1) e.fraud++;
  }
  return Array.from(m.values()).sort((a, b) => b.total - a.total);
}

export function groupByMonth(rows: ClaimRow[]) {
  const m = new Map<string, { month: string; total: number; fraud: number }>();
  for (const r of rows) {
    const k = r.date.slice(0, 7);
    if (!m.has(k)) m.set(k, { month: k, total: 0, fraud: 0 });
    const e = m.get(k)!;
    e.total++;
    if (r.predicted_fraud === 1) e.fraud++;
  }
  return Array.from(m.values()).sort((a, b) => a.month.localeCompare(b.month));
}

export function riskDistribution(rows: ClaimRow[]) {
  const buckets = [
    { name: "Low (0-39)", value: 0, range: [0, 40] },
    { name: "Medium (40-59)", value: 0, range: [40, 60] },
    { name: "High (60-74)", value: 0, range: [60, 75] },
    { name: "Critical (75+)", value: 0, range: [75, 101] },
  ];
  for (const r of rows) {
    const s = r.risk_score ?? 0;
    const b = buckets.find((x) => s >= x.range[0] && s < x.range[1]);
    if (b) b.value++;
  }
  return buckets;
}

export function topRisky(rows: ClaimRow[], n = 10) {
  return [...rows].sort((a, b) => (b.risk_score ?? 0) - (a.risk_score ?? 0)).slice(0, n);
}
