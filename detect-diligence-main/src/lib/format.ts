export const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export const fmtNumber = (n: number) => new Intl.NumberFormat("en-US").format(n);

export const fmtPct = (n: number, d = 1) => `${n.toFixed(d)}%`;

export function riskTone(score: number): "low" | "medium" | "high" | "critical" {
  if (score >= 75) return "critical";
  if (score >= 60) return "high";
  if (score >= 40) return "medium";
  return "low";
}
