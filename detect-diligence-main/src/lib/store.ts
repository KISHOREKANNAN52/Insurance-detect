import { create } from "zustand";
import type { ClaimRow, FilterState } from "./types";

interface AppState {
  rows: ClaimRow[];
  fileName: string | null;
  modelSource: "trained" | "pretrained" | null;
  trainedAccuracy: number | null;
  filters: FilterState;
  setData: (
    rows: ClaimRow[],
    fileName: string,
    modelSource: "trained" | "pretrained",
    acc?: number,
  ) => void;
  reset: () => void;
  setFilters: (patch: Partial<FilterState>) => void;
}

const initialFilters: FilterState = {
  dateFrom: null,
  dateTo: null,
  claimType: null,
  minRisk: 0,
};

export const useAppStore = create<AppState>((set) => ({
  rows: [],
  fileName: null,
  modelSource: null,
  trainedAccuracy: null,
  filters: initialFilters,
  setData: (rows, fileName, modelSource, acc) =>
    set({
      rows,
      fileName,
      modelSource,
      trainedAccuracy: acc ?? null,
      filters: initialFilters,
    }),
  reset: () =>
    set({
      rows: [],
      fileName: null,
      modelSource: null,
      trainedAccuracy: null,
      filters: initialFilters,
    }),
  setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
}));

export function applyFilters(rows: ClaimRow[], f: FilterState): ClaimRow[] {
  return rows.filter((r) => {
    if (f.dateFrom && r.date < f.dateFrom) return false;
    if (f.dateTo && r.date > f.dateTo) return false;
    if (f.claimType && r.claim_type !== f.claimType) return false;
    if ((r.risk_score ?? 0) < f.minRisk) return false;
    return true;
  });
}
