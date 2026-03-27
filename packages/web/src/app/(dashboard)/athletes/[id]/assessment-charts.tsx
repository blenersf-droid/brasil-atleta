"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendingUp } from "lucide-react";

interface Assessment {
  id: string;
  assessment_date: string;
  protocol: string;
  metrics: Record<string, unknown>;
}

interface AssessmentChartsProps {
  assessments: Assessment[];
}

interface ChartPoint {
  date: string;
  value: number;
  fullDate: string;
}

function formatShortDate(dateStr: string): string {
  try {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
  } catch {
    return dateStr;
  }
}

function parseMetricValue(
  metrics: Record<string, unknown>,
  metricName: string
): number | null {
  const entry = metrics[metricName];
  if (!entry || typeof entry !== "object") return null;
  const { value } = entry as { value?: unknown };
  if (value === undefined || value === null) return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
}

function getMetricUnit(metrics: Record<string, unknown>, metricName: string): string {
  const entry = metrics[metricName];
  if (!entry || typeof entry !== "object") return "";
  const { unit } = entry as { unit?: unknown };
  return typeof unit === "string" ? unit : "";
}

export function AssessmentCharts({ assessments }: AssessmentChartsProps) {
  // Collect all unique metric names (excluding internal ones starting with _)
  const allMetrics = useMemo(() => {
    const metricSet = new Set<string>();
    for (const assessment of assessments) {
      if (!assessment.metrics) continue;
      for (const key of Object.keys(assessment.metrics)) {
        if (!key.startsWith("_")) {
          metricSet.add(key);
        }
      }
    }
    return Array.from(metricSet).sort();
  }, [assessments]);

  const [selectedMetric, setSelectedMetric] = useState<string>(allMetrics[0] ?? "");

  // Build chart data for selected metric
  const chartData = useMemo((): ChartPoint[] => {
    if (!selectedMetric) return [];

    return assessments
      .filter((a) => parseMetricValue(a.metrics, selectedMetric) !== null)
      .sort(
        (a, b) =>
          new Date(a.assessment_date).getTime() - new Date(b.assessment_date).getTime()
      )
      .map((a) => ({
        date: formatShortDate(a.assessment_date),
        fullDate: a.assessment_date,
        value: parseMetricValue(a.metrics, selectedMetric) as number,
      }));
  }, [assessments, selectedMetric]);

  const unit = useMemo(() => {
    if (!selectedMetric) return "";
    for (const a of assessments) {
      const u = getMetricUnit(a.metrics, selectedMetric);
      if (u) return u;
    }
    return "";
  }, [assessments, selectedMetric]);

  if (allMetrics.length === 0) return null;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-[#0a1628]/[0.06] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="size-4 text-[#009739]" />
          <span className="text-sm font-semibold text-[#0a1628]">
            Evolucao por Metrica
          </span>
        </div>

        <Select
          value={selectedMetric}
          onValueChange={(v) => { if (v) setSelectedMetric(v); }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Selecionar metrica" />
          </SelectTrigger>
          <SelectContent>
            {allMetrics.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {chartData.length < 2 ? (
        <div className="flex h-48 items-center justify-center">
          <p className="text-sm text-[#0a1628]/40">
            Dados insuficientes para exibir o grafico desta metrica.
          </p>
        </div>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#0a1628"
                strokeOpacity={0.06}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#0a1628", fillOpacity: 0.4 }}
                axisLine={{ stroke: "#0a1628", strokeOpacity: 0.1 }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#0a1628", fillOpacity: 0.4 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}${unit ? ` ${unit}` : ""}`}
              />
              <Tooltip
                contentStyle={{
                  background: "#0a1628",
                  border: "none",
                  borderRadius: 8,
                  color: "#fff",
                  fontSize: 12,
                }}
                labelStyle={{ color: "#fff", opacity: 0.7, marginBottom: 4 }}
                formatter={(value) => [
                  `${value}${unit ? ` ${unit}` : ""}`,
                  selectedMetric,
                ]}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#009739"
                strokeWidth={2}
                dot={{ fill: "#009739", r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: "#009739", strokeWidth: 2, stroke: "#fff" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
