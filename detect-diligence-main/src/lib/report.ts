import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ClaimRow, DatasetStats } from "./types";
import { fmtCurrency } from "./format";

export function downloadReport(opts: {
  fileName: string | null;
  stats: DatasetStats;
  modelSource: string | null;
  trainedAccuracy: number | null;
  topRisky: ClaimRow[];
  byType: { type: string; total: number; fraud: number }[];
}) {
  const doc = new jsPDF();
  const now = new Date().toLocaleString();
  doc.setFontSize(18);
  doc.text("Insurance Fraud Detection Report", 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`Generated ${now}`, 14, 25);
  if (opts.fileName) doc.text(`Dataset: ${opts.fileName}`, 14, 30);

  doc.setTextColor(0);
  doc.setFontSize(12);
  doc.text("Summary", 14, 42);
  autoTable(doc, {
    startY: 45,
    theme: "grid",
    head: [["Metric", "Value"]],
    body: [
      ["Total claims", String(opts.stats.total)],
      ["Predicted fraud", `${opts.stats.fraudCount} (${opts.stats.fraudPct.toFixed(1)}%)`],
      ["Critical-risk claims (≥75)", String(opts.stats.highRisk)],
      ["Total claim amount", fmtCurrency(opts.stats.totalAmount)],
      ["Fraud claim amount", fmtCurrency(opts.stats.fraudAmount)],
      ["Average risk score", opts.stats.avgRisk.toFixed(1)],
      [
        "Model",
        opts.modelSource === "trained"
          ? `Random Forest (trained on dataset${opts.trainedAccuracy ? `, ${(opts.trainedAccuracy * 100).toFixed(1)}% acc` : ""})`
          : "Random Forest (pre-trained)",
      ],
    ],
    styles: { fontSize: 10 },
  });

  const afterSummary = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(12);
  doc.text("Fraud by claim type", 14, afterSummary);
  autoTable(doc, {
    startY: afterSummary + 3,
    theme: "striped",
    head: [["Type", "Total", "Fraud", "Fraud rate"]],
    body: opts.byType.map((r) => [
      r.type,
      String(r.total),
      String(r.fraud),
      r.total ? `${((r.fraud / r.total) * 100).toFixed(1)}%` : "0%",
    ]),
    styles: { fontSize: 10 },
  });

  const afterType = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(12);
  doc.text("Top high-risk transactions", 14, afterType);
  autoTable(doc, {
    startY: afterType + 3,
    theme: "striped",
    head: [["Claim ID", "Date", "Type", "Amount", "Severity", "Prior", "Risk"]],
    body: opts.topRisky.map((r) => [
      r.claim_id,
      r.date,
      r.claim_type,
      fmtCurrency(r.claim_amount),
      String(r.incident_severity),
      String(r.prior_claims),
      String(r.risk_score),
    ]),
    styles: { fontSize: 9 },
  });

  doc.save(`fraud-report-${Date.now()}.pdf`);
}
