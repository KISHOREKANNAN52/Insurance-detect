export interface ClaimRow {
  claim_id: string;
  date: string; // ISO yyyy-mm-dd
  claim_type: string;
  claim_amount: number;
  customer_age: number;
  policy_tenure: number; // years
  incident_severity: number; // 1-10
  prior_claims: number;
  is_fraud?: 0 | 1;
  // computed
  risk_score?: number; // 0-100
  predicted_fraud?: 0 | 1;
}

export interface DatasetStats {
  total: number;
  fraudCount: number;
  fraudPct: number;
  totalAmount: number;
  fraudAmount: number;
  avgRisk: number;
  highRisk: number;
}

export interface FilterState {
  dateFrom: string | null;
  dateTo: string | null;
  claimType: string | null;
  minRisk: number;
}
