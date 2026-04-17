import Papa from "papaparse";
import type { ClaimRow } from "./types";

const REQUIRED = [
  "claim_id",
  "date",
  "claim_type",
  "claim_amount",
  "customer_age",
  "policy_tenure",
  "incident_severity",
  "prior_claims",
];

export function parseCsv(file: File): Promise<{ rows: ClaimRow[]; warnings: string[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const warnings: string[] = [];
        const headers = result.meta.fields ?? [];
        const missing = REQUIRED.filter((h) => !headers.includes(h));
        if (missing.length) {
          reject(new Error(`Missing required columns: ${missing.join(", ")}`));
          return;
        }

        const rows: ClaimRow[] = [];
        let dropped = 0;
        for (const r of result.data) {
          try {
            const claim_amount = Number(r.claim_amount);
            const customer_age = Number(r.customer_age);
            const policy_tenure = Number(r.policy_tenure);
            const incident_severity = Number(r.incident_severity);
            const prior_claims = Number(r.prior_claims);
            if (
              !r.claim_id ||
              !r.date ||
              !r.claim_type ||
              [
                claim_amount,
                customer_age,
                policy_tenure,
                incident_severity,
                prior_claims,
              ].some((n) => Number.isNaN(n))
            ) {
              dropped++;
              continue;
            }
            const row: ClaimRow = {
              claim_id: String(r.claim_id),
              date: String(r.date).slice(0, 10),
              claim_type: String(r.claim_type),
              claim_amount,
              customer_age,
              policy_tenure,
              incident_severity,
              prior_claims,
            };
            if (r.is_fraud !== undefined && r.is_fraud !== "") {
              const v = Number(r.is_fraud);
              if (v === 0 || v === 1) row.is_fraud = v as 0 | 1;
            }
            rows.push(row);
          } catch {
            dropped++;
          }
        }
        if (dropped) warnings.push(`Dropped ${dropped} invalid rows during ETL.`);
        if (!rows.length) {
          reject(new Error("No valid rows found in CSV."));
          return;
        }
        resolve({ rows, warnings });
      },
      error: (err) => reject(err),
    });
  });
}
