import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Body {
  mode: "summary" | "explain" | "qa";
  question?: string;
  stats: {
    total: number;
    fraudCount: number;
    fraudPct: number;
    highRisk: number;
    totalAmount: number;
    fraudAmount: number;
    avgRisk: number;
  };
  byType: { type: string; total: number; fraud: number }[];
  topRisky: Array<{
    claim_id: string;
    claim_type: string;
    claim_amount: number;
    incident_severity: number;
    prior_claims: number;
    policy_tenure: number;
    risk_score: number;
  }>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body: Body = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const dataContext = `Dataset summary:
- Total claims: ${body.stats.total}
- Predicted fraud: ${body.stats.fraudCount} (${body.stats.fraudPct.toFixed(1)}%)
- Critical-risk (>=75): ${body.stats.highRisk}
- Total claim amount: $${body.stats.totalAmount.toLocaleString()}
- Fraud claim amount: $${body.stats.fraudAmount.toLocaleString()}
- Average risk score: ${body.stats.avgRisk.toFixed(1)}

By claim type: ${body.byType
      .map((t) => `${t.type}=${t.total} (${t.fraud} fraud)`)
      .join(", ")}

Top 5 risky transactions:
${body.topRisky
  .slice(0, 5)
  .map(
    (r) =>
      `- ${r.claim_id} ${r.claim_type} $${r.claim_amount} sev=${r.incident_severity} prior=${r.prior_claims} tenure=${r.policy_tenure}y risk=${r.risk_score}`,
  )
  .join("\n")}`;

    let userPrompt = "";
    if (body.mode === "summary") {
      userPrompt = `Write a concise 4-6 sentence executive summary of this insurance claims dataset. Highlight fraud rate, total exposure, and the most concerning patterns. No markdown headers.\n\n${dataContext}`;
    } else if (body.mode === "explain") {
      userPrompt = `Explain in 4-6 bullet points why the high-risk claims listed below were flagged. Reference specific factors (claim amount, severity, prior claims, low policy tenure, claim type concentrations). Be specific and actionable for a claims investigator.\n\n${dataContext}`;
    } else {
      userPrompt = `Answer the user's question about this insurance dataset clearly and concisely (3-5 sentences). If the data does not support an answer, say so.\n\nUser question: ${body.question}\n\n${dataContext}`;
    }

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You are an expert insurance fraud analyst. Be precise, data-driven, and actionable. Never invent numbers — only use what is in the provided context.",
          },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (resp.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Add credits in Settings → Workspace → Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await resp.text();
      console.error("AI gateway error:", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = await resp.json();
    const text = json.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("insights error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
