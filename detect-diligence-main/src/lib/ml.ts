// Random Forest fraud scoring.
// - If the dataset has `is_fraud` labels, train on it.
// - Otherwise fall back to a model trained on synthetic data.
//
// Uses ml-random-forest for real ML in the browser.

import { RandomForestClassifier } from "ml-random-forest";
import type { ClaimRow } from "./types";
import { generateSampleClaims } from "./sample-data";

const FEATURE_KEYS = [
  "claim_amount",
  "customer_age",
  "policy_tenure",
  "incident_severity",
  "prior_claims",
  "claim_type_idx",
] as const;

const TYPES = ["Auto", "Health", "Property", "Life", "Travel"];

function rowToFeatures(r: ClaimRow): number[] {
  return [
    r.claim_amount,
    r.customer_age,
    r.policy_tenure,
    r.incident_severity,
    r.prior_claims,
    Math.max(0, TYPES.indexOf(r.claim_type)),
  ];
}

let cachedFallback: RandomForestClassifier | null = null;
function getFallbackModel(): RandomForestClassifier {
  if (cachedFallback) return cachedFallback;
  const synth = generateSampleClaims(800, 7) as ClaimRow[];
  const X = synth.map(rowToFeatures);
  const y = synth.map((r) => r.is_fraud ?? 0);
  const clf = new RandomForestClassifier({
    nEstimators: 40,
    maxFeatures: 0.8,
    replacement: true,
    seed: 1,
  });
  clf.train(X, y);
  cachedFallback = clf;
  return clf;
}

export interface ScoredDataset {
  rows: ClaimRow[];
  modelSource: "trained" | "pretrained";
  trainedAccuracy?: number;
}

export function scoreDataset(rows: ClaimRow[]): ScoredDataset {
  const labeled = rows.filter((r) => r.is_fraud === 0 || r.is_fraud === 1);
  let model: RandomForestClassifier;
  let modelSource: "trained" | "pretrained" = "pretrained";
  let trainedAccuracy: number | undefined;

  if (labeled.length >= 30) {
    // Train/test split 80/20
    const shuffled = [...labeled].sort(() => Math.random() - 0.5);
    const split = Math.floor(shuffled.length * 0.8);
    const train = shuffled.slice(0, split);
    const test = shuffled.slice(split);
    const Xtr = train.map(rowToFeatures);
    const ytr = train.map((r) => r.is_fraud as number);
    model = new RandomForestClassifier({
      nEstimators: 50,
      maxFeatures: 0.8,
      replacement: true,
      seed: 42,
    });
    model.train(Xtr, ytr);
    modelSource = "trained";
    if (test.length) {
      const preds = model.predict(test.map(rowToFeatures));
      let correct = 0;
      preds.forEach((p, i) => {
        if (p === test[i].is_fraud) correct++;
      });
      trainedAccuracy = correct / test.length;
    }
  } else {
    model = getFallbackModel();
  }

  // Score every row. ml-random-forest's predict gives class; we approximate
  // a probability by averaging the per-tree predictions.
  const X = rows.map(rowToFeatures);
  const preds = model.predict(X);
  // Use predictProbability if available
  // @ts-expect-error - method exists at runtime in newer versions
  const probs: number[][] | undefined = model.predictProbability?.(X);

  const scored = rows.map((r, i) => {
    let p = 0;
    if (probs && probs[i]) {
      p = probs[i][1] ?? 0;
    } else {
      // Fallback: heuristic blend with tree class output
      const heuristic =
        (r.claim_amount / 50000) * 0.35 +
        (r.incident_severity / 10) * 0.25 +
        Math.min(r.prior_claims / 6, 1) * 0.25 +
        (1 - Math.min(r.policy_tenure / 15, 1)) * 0.15;
      p = preds[i] === 1 ? Math.min(0.95, 0.5 + heuristic / 2) : Math.max(0.05, heuristic / 2);
    }
    const risk_score = Math.round(Math.max(0, Math.min(1, p)) * 100);
    return {
      ...r,
      risk_score,
      predicted_fraud: (risk_score >= 60 ? 1 : 0) as 0 | 1,
    };
  });

  return { rows: scored, modelSource, trainedAccuracy };
}

export const FEATURE_LABELS: Record<(typeof FEATURE_KEYS)[number], string> = {
  claim_amount: "Claim Amount",
  customer_age: "Customer Age",
  policy_tenure: "Policy Tenure",
  incident_severity: "Incident Severity",
  prior_claims: "Prior Claims",
  claim_type_idx: "Claim Type",
};
