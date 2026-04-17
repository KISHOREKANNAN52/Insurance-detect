import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ClaimRow } from "@/lib/types";
import { fmtCurrency, riskTone } from "@/lib/format";
import { AlertTriangle } from "lucide-react";

const TONE: Record<ReturnType<typeof riskTone>, string> = {
  critical: "bg-destructive text-destructive-foreground",
  high: "bg-warning text-warning-foreground",
  medium: "bg-accent text-accent-foreground",
  low: "bg-muted text-muted-foreground",
};

export function TopRiskyTable({ rows }: { rows: ClaimRow[] }) {
  return (
    <Card className="shadow-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <AlertTriangle className="h-4 w-4 text-warning" />
          Top High-Risk Transactions
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Claim ID</th>
                <th className="px-4 py-2 text-left font-medium">Date</th>
                <th className="px-4 py-2 text-left font-medium">Type</th>
                <th className="px-4 py-2 text-right font-medium">Amount</th>
                <th className="px-4 py-2 text-right font-medium">Severity</th>
                <th className="px-4 py-2 text-right font-medium">Prior</th>
                <th className="px-4 py-2 text-right font-medium">Risk</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const tone = riskTone(r.risk_score ?? 0);
                return (
                  <tr key={r.claim_id} className="border-t border-border">
                    <td className="px-4 py-2 font-mono text-xs">{r.claim_id}</td>
                    <td className="px-4 py-2 text-muted-foreground">{r.date}</td>
                    <td className="px-4 py-2">{r.claim_type}</td>
                    <td className="px-4 py-2 text-right font-medium">{fmtCurrency(r.claim_amount)}</td>
                    <td className="px-4 py-2 text-right">{r.incident_severity}</td>
                    <td className="px-4 py-2 text-right">{r.prior_claims}</td>
                    <td className="px-4 py-2 text-right">
                      <Badge className={TONE[tone]}>{r.risk_score}</Badge>
                    </td>
                  </tr>
                );
              })}
              {!rows.length && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No data — upload a CSV or load the sample dataset.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
