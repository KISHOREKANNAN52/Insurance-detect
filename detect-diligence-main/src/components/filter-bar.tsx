import { useAppStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";

export function FilterBar() {
  const rows = useAppStore((s) => s.rows);
  const filters = useAppStore((s) => s.filters);
  const setFilters = useAppStore((s) => s.setFilters);

  const types = useMemo(() => {
    const set = new Set(rows.map((r) => r.claim_type));
    return Array.from(set).sort();
  }, [rows]);

  return (
    <Card className="shadow-card">
      <CardContent className="flex flex-wrap items-end gap-3 p-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">From</label>
          <Input
            type="date"
            value={filters.dateFrom ?? ""}
            onChange={(e) => setFilters({ dateFrom: e.target.value || null })}
            className="h-9 w-[150px]"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">To</label>
          <Input
            type="date"
            value={filters.dateTo ?? ""}
            onChange={(e) => setFilters({ dateTo: e.target.value || null })}
            className="h-9 w-[150px]"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Claim type</label>
          <select
            value={filters.claimType ?? ""}
            onChange={(e) => setFilters({ claimType: e.target.value || null })}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="">All types</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="flex min-w-[200px] flex-1 flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">
            Min risk score: {filters.minRisk}
          </label>
          <Slider
            value={[filters.minRisk]}
            min={0}
            max={100}
            step={5}
            onValueChange={(v) => setFilters({ minRisk: v[0] })}
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            setFilters({ dateFrom: null, dateTo: null, claimType: null, minRisk: 0 })
          }
        >
          Reset
        </Button>
      </CardContent>
    </Card>
  );
}
