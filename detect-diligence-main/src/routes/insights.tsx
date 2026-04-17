import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Brain, Sparkles, MessageSquare, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore, applyFilters } from "@/lib/store";
import { computeStats, groupByType, topRisky } from "@/lib/stats";
import { EmptyState } from "@/components/info";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "AI Insights — FraudIQ" },
      { name: "description", content: "Get AI-powered explanations and answers about your claims data." },
    ],
  }),
  component: InsightsPage,
});

function InsightsPage() {
  const rows = useAppStore((s) => s.rows);
  const filters = useAppStore((s) => s.filters);
  const filtered = useMemo(() => applyFilters(rows, filters), [rows, filters]);
  const stats = useMemo(() => computeStats(filtered), [filtered]);
  const byType = useMemo(() => groupByType(filtered), [filtered]);
  const top = useMemo(() => topRisky(filtered, 5), [filtered]);

  const [summary, setSummary] = useState("");
  const [explanation, setExplanation] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState<"summary" | "explain" | "qa" | null>(null);

  async function call(mode: "summary" | "explain" | "qa") {
    if (!filtered.length) {
      toast.error("Upload a dataset first");
      return;
    }
    if (mode === "qa" && !question.trim()) {
      toast.error("Type a question first");
      return;
    }
    setLoading(mode);
    try {
      const { data, error } = await supabase.functions.invoke("insights", {
        body: {
          mode,
          question: mode === "qa" ? question : undefined,
          stats: {
            total: stats.total,
            fraudCount: stats.fraudCount,
            fraudPct: stats.fraudPct,
            highRisk: stats.highRisk,
            totalAmount: stats.totalAmount,
            fraudAmount: stats.fraudAmount,
            avgRisk: stats.avgRisk,
          },
          byType,
          topRisky: top.map((r) => ({
            claim_id: r.claim_id,
            claim_type: r.claim_type,
            claim_amount: r.claim_amount,
            incident_severity: r.incident_severity,
            prior_claims: r.prior_claims,
            policy_tenure: r.policy_tenure,
            risk_score: r.risk_score ?? 0,
          })),
        },
      });
      if (error) throw error;
      const text = (data as any)?.text ?? "";
      if (!text) throw new Error("Empty response");
      if (mode === "summary") setSummary(text);
      else if (mode === "explain") setExplanation(text);
      else setAnswer(text);
    } catch (e: any) {
      const msg = e?.context?.error || e?.message || "AI request failed";
      toast.error(msg);
    } finally {
      setLoading(null);
    }
  }

  if (!rows.length) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">AI Insights</h1>
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Brain className="h-6 w-6 text-primary" /> AI Insights
        </h1>
        <p className="text-sm text-muted-foreground">
          Powered by Lovable AI · Gemini · grounded in your filtered dataset
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <InsightCard
          icon={<FileText className="h-4 w-4" />}
          title="Executive summary"
          content={summary}
          loading={loading === "summary"}
          onRun={() => call("summary")}
          cta="Generate summary"
        />
        <InsightCard
          icon={<Sparkles className="h-4 w-4" />}
          title="Explain top fraud risks"
          content={explanation}
          loading={loading === "explain"}
          onRun={() => call("explain")}
          cta="Explain risks"
        />
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <MessageSquare className="h-4 w-4" /> Ask a question
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="e.g. Which claim type has the worst fraud rate, and why might that be?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="min-h-[80px]"
          />
          <Button onClick={() => call("qa")} disabled={loading === "qa"}>
            {loading === "qa" ? "Thinking…" : "Ask AI"}
          </Button>
          {answer && (
            <div className="rounded-md border border-border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
              {answer}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InsightCard({
  icon,
  title,
  content,
  loading,
  onRun,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  content: string;
  loading: boolean;
  onRun: () => void;
  cta: string;
}) {
  return (
    <Card className="shadow-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          {icon} {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button onClick={onRun} disabled={loading} variant="outline" size="sm">
          {loading ? "Generating…" : cta}
        </Button>
        {content ? (
          <div className="rounded-md border border-border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
            {content}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Click the button to generate.</p>
        )}
      </CardContent>
    </Card>
  );
}
