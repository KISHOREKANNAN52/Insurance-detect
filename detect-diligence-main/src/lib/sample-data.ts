// Generate a realistic synthetic insurance claims dataset.
// Used both for the downloadable sample CSV and to pre-train the fallback model.

const CLAIM_TYPES = ["Auto", "Health", "Property", "Life", "Travel"];

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function generateSampleClaims(n = 500, seed = 42) {
  const rand = seeded(seed);
  const rows = [];
  const start = new Date("2024-01-01").getTime();
  const end = new Date("2025-06-30").getTime();

  for (let i = 0; i < n; i++) {
    const claim_type = CLAIM_TYPES[Math.floor(rand() * CLAIM_TYPES.length)];
    const customer_age = Math.floor(18 + rand() * 60);
    const policy_tenure = +(rand() * 20).toFixed(1);
    const incident_severity = Math.floor(1 + rand() * 10);
    const prior_claims = Math.floor(rand() * 8);
    const claim_amount = Math.floor(500 + rand() * 49500);
    const date = new Date(start + rand() * (end - start)).toISOString().slice(0, 10);

    // Fraud likelihood: high amount + high severity + many prior claims + low tenure
    const fraudScore =
      (claim_amount / 50000) * 0.35 +
      (incident_severity / 10) * 0.25 +
      Math.min(prior_claims / 6, 1) * 0.25 +
      (1 - Math.min(policy_tenure / 15, 1)) * 0.15;

    const noisy = fraudScore + (rand() - 0.5) * 0.25;
    const is_fraud = noisy > 0.6 ? 1 : 0;

    rows.push({
      claim_id: `CLM-${String(100000 + i)}`,
      date,
      claim_type,
      claim_amount,
      customer_age,
      policy_tenure,
      incident_severity,
      prior_claims,
      is_fraud,
    });
  }
  return rows;
}

export function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join(
    "\n",
  );
}
