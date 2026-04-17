import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  RadialBarChart,
  RadialBar,
} from "recharts";

const COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

const tooltipStyle = {
  backgroundColor: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--color-popover-foreground)",
};

export function FraudByTypeChart({ data }: { data: { type: string; total: number; fraud: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis dataKey="type" tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
        <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--color-accent)", opacity: 0.3 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="total" name="Total" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="fraud" name="Fraud" fill="var(--color-chart-5)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RiskPieChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function TrendLineChart({ data }: { data: { month: string; total: number; fraud: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis dataKey="month" tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} />
        <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="total" stroke="var(--color-chart-1)" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="fraud" stroke="var(--color-chart-5)" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function AmountVsRiskScatter({
  data,
}: {
  data: { claim_amount: number; risk_score: number; fraud: number }[];
}) {
  const fraud = data.filter((d) => d.fraud === 1);
  const ok = data.filter((d) => d.fraud === 0);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis
          type="number"
          dataKey="claim_amount"
          name="Amount"
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
        />
        <YAxis
          type="number"
          dataKey="risk_score"
          name="Risk"
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
          domain={[0, 100]}
        />
        <Tooltip contentStyle={tooltipStyle} cursor={{ strokeDasharray: "3 3" }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Scatter name="Predicted OK" data={ok} fill="var(--color-chart-2)" fillOpacity={0.5} />
        <Scatter name="Predicted Fraud" data={fraud} fill="var(--color-chart-5)" fillOpacity={0.8} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

export function RiskGauge({ value }: { value: number }) {
  const data = [{ name: "risk", value, fill: value >= 75 ? "var(--color-destructive)" : value >= 50 ? "var(--color-warning)" : "var(--color-success)" }];
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadialBarChart innerRadius="70%" outerRadius="100%" data={data} startAngle={180} endAngle={0}>
        <RadialBar background dataKey="value" cornerRadius={10} />
        <text
          x="50%"
          y="65%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-foreground"
          style={{ fontSize: 32, fontWeight: 700 }}
        >
          {Math.round(value)}
        </text>
        <text
          x="50%"
          y="80%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-muted-foreground"
          style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}
        >
          avg risk score
        </text>
      </RadialBarChart>
    </ResponsiveContainer>
  );
}
