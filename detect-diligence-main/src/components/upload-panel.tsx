import { useState } from "react";
import { Upload, FileSpreadsheet, Download, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";
import { parseCsv } from "@/lib/csv";
import { scoreDataset } from "@/lib/ml";
import { generateSampleClaims, toCsv } from "@/lib/sample-data";
import { toast } from "sonner";

export function UploadPanel() {
  const setData = useAppStore((s) => s.setData);
  const reset = useAppStore((s) => s.reset);
  const fileName = useAppStore((s) => s.fileName);
  const modelSource = useAppStore((s) => s.modelSource);
  const trainedAccuracy = useAppStore((s) => s.trainedAccuracy);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    setBusy(true);
    try {
      const { rows, warnings } = await parseCsv(file);
      warnings.forEach((w) => toast.warning(w));
      const { rows: scored, modelSource, trainedAccuracy } = scoreDataset(rows);
      setData(scored, file.name, modelSource, trainedAccuracy);
      toast.success(
        `Processed ${scored.length} claims · model: ${modelSource}${trainedAccuracy ? ` · acc ${(trainedAccuracy * 100).toFixed(1)}%` : ""}`,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to process CSV");
    } finally {
      setBusy(false);
    }
  }

  function loadSample() {
    setBusy(true);
    try {
      const sample = generateSampleClaims(500) as any;
      const { rows: scored, modelSource, trainedAccuracy } = scoreDataset(sample);
      setData(scored, "sample_claims.csv", modelSource, trainedAccuracy);
      toast.success(`Loaded sample dataset (500 claims)`);
    } finally {
      setBusy(false);
    }
  }

  function downloadSample() {
    const csv = toCsv(generateSampleClaims(200));
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample_claims.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card className="shadow-card">
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">
                {fileName ? `Active dataset: ${fileName}` : "Upload an insurance claims CSV"}
              </p>
              <p className="text-xs text-muted-foreground">
                Required columns: claim_id, date, claim_type, claim_amount, customer_age,
                policy_tenure, incident_severity, prior_claims. Optional: is_fraud (0/1).
              </p>
              {modelSource && (
                <p className="mt-1 text-xs">
                  <span className="rounded-sm bg-accent px-1.5 py-0.5 font-medium">
                    {modelSource === "trained"
                      ? `Random Forest trained on your data${
                          trainedAccuracy ? ` · ${(trainedAccuracy * 100).toFixed(1)}% acc` : ""
                        }`
                      : "Random Forest pre-trained on synthetic data"}
                  </span>
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label>
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                disabled={busy}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                  e.target.value = "";
                }}
              />
              <Button asChild disabled={busy} className="cursor-pointer">
                <span>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload CSV
                </span>
              </Button>
            </label>
            <Button variant="outline" onClick={loadSample} disabled={busy}>
              Use sample
            </Button>
            <Button variant="ghost" size="icon" onClick={downloadSample} aria-label="Download sample">
              <Download className="h-4 w-4" />
            </Button>
            {fileName && (
              <Button variant="ghost" size="icon" onClick={reset} aria-label="Clear">
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
