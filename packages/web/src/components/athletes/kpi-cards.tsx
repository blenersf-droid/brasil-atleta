import type { ElementType } from "react";
import { createClient } from "@/lib/supabase/server";
import { Activity, TrendingUp, Target, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardsProps {
  athleteId: string;
  modalityCode: string;
}

interface KpiData {
  label: string;
  value: string;
  description: string;
  level: "good" | "medium" | "bad";
  icon: ElementType;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

const LEVEL_COLORS: Record<"good" | "medium" | "bad", string> = {
  good: "bg-[#009739]",
  medium: "bg-amber-400",
  bad: "bg-red-500",
};

const LEVEL_TEXT: Record<"good" | "medium" | "bad", string> = {
  good: "text-[#009739]",
  medium: "text-amber-600",
  bad: "text-red-500",
};

// ── Server Component ──────────────────────────────────────────────────────────

export async function KpiCards({ athleteId, modalityCode }: KpiCardsProps) {
  const supabase = await createClient();

  const now = new Date();
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(now.getFullYear() - 1);
  const twoYearsAgo = new Date(now);
  twoYearsAgo.setFullYear(now.getFullYear() - 2);

  // ── Fetch all results for this athlete ────────────────────────────────────
  const { data: allResults } = await supabase
    .from("results")
    .select(
      `
      id,
      mark_numeric,
      mark_unit,
      competition_id,
      competitions (
        id,
        date_start,
        modality_code
      )
    `
    )
    .eq("athlete_id", athleteId)
    .not("mark_numeric", "is", null);

  type ResultRow = {
    id: string;
    mark_numeric: number;
    mark_unit: string | null;
    competition_id: string;
    competitions: { id: string; date_start: string | null; modality_code: string | null } | null;
  };

  const results: ResultRow[] = (allResults ?? []) as unknown as ResultRow[];

  // ── KPI 1: Frequencia Competitiva ────────────────────────────────────────
  const resultsLastYear = results.filter((r) => {
    const d = r.competitions?.date_start;
    return d && new Date(d) >= oneYearAgo;
  });
  const uniqueCompetitionsLastYear = new Set(
    resultsLastYear.map((r) => r.competition_id)
  ).size;

  let freqLevel: "good" | "medium" | "bad" = "bad";
  if (uniqueCompetitionsLastYear >= 6) freqLevel = "good";
  else if (uniqueCompetitionsLastYear >= 3) freqLevel = "medium";

  const kpi1: KpiData = {
    label: "Frequencia Competitiva",
    value: `${uniqueCompetitionsLastYear}`,
    description: "competicoes no ultimo ano",
    level: freqLevel,
    icon: Activity,
  };

  // ── KPI 2: Progressao de Resultados ─────────────────────────────────────
  // Best mark this year vs best mark previous year
  const sameModalityResults = results.filter(
    (r) => r.competitions?.modality_code === modalityCode && r.mark_numeric != null
  );

  const thisYearResults = sameModalityResults.filter((r) => {
    const d = r.competitions?.date_start;
    return d && new Date(d) >= oneYearAgo;
  });

  const prevYearResults = sameModalityResults.filter((r) => {
    const d = r.competitions?.date_start;
    return d && new Date(d) >= twoYearsAgo && new Date(d) < oneYearAgo;
  });

  const bestThisYear =
    thisYearResults.length > 0
      ? Math.max(...thisYearResults.map((r) => r.mark_numeric))
      : null;
  const bestPrevYear =
    prevYearResults.length > 0
      ? Math.max(...prevYearResults.map((r) => r.mark_numeric))
      : null;

  let progressaoValue = 0;
  let progLevel: "good" | "medium" | "bad" = "medium";

  if (bestThisYear !== null && bestPrevYear !== null && bestPrevYear !== 0) {
    progressaoValue = ((bestThisYear - bestPrevYear) / bestPrevYear) * 100;
    if (progressaoValue > 10) progLevel = "good";
    else if (progressaoValue >= 0) progLevel = "medium";
    else progLevel = "bad";
  }

  const kpi2: KpiData = {
    label: "Progressao de Resultados",
    value:
      bestThisYear !== null && bestPrevYear !== null
        ? `${progressaoValue > 0 ? "+" : ""}${progressaoValue.toFixed(1)}%`
        : "—",
    description: "variacao vs ano anterior",
    level: progLevel,
    icon: TrendingUp,
  };

  // ── KPI 3: Estabilidade de Desempenho ───────────────────────────────────
  const last5 = sameModalityResults
    .sort((a, b) => {
      const da = a.competitions?.date_start ?? "";
      const db = b.competitions?.date_start ?? "";
      return db.localeCompare(da);
    })
    .slice(0, 5)
    .map((r) => r.mark_numeric);

  const last5Mean = mean(last5);
  const last5Std = stddev(last5);
  const stabilityPct = last5Mean > 0 ? (last5Std / last5Mean) * 100 : 0;

  let stabLevel: "good" | "medium" | "bad" = "good";
  if (stabilityPct > 15) stabLevel = "bad";
  else if (stabilityPct > 5) stabLevel = "medium";

  const kpi3: KpiData = {
    label: "Estabilidade de Desempenho",
    value: last5.length >= 2 ? `${stabilityPct.toFixed(1)}%` : "—",
    description: "desvio padrao dos ultimos 5 resultados",
    level: stabLevel,
    icon: Target,
  };

  // ── KPI 4: Evolucao Relativa ─────────────────────────────────────────────
  // Athlete best mark vs avg of same modality across all athletes
  const { data: modalityResults } = await supabase
    .from("results")
    .select("mark_numeric, competitions(modality_code)")
    .not("mark_numeric", "is", null);

  type ModalityResult = {
    mark_numeric: number;
    competitions: { modality_code: string | null } | null;
  };

  const modalityAll = ((modalityResults ?? []) as unknown as ModalityResult[])
    .filter((r) => r.competitions?.modality_code === modalityCode)
    .map((r) => r.mark_numeric);

  const athleteBest =
    sameModalityResults.length > 0
      ? Math.max(...sameModalityResults.map((r) => r.mark_numeric))
      : null;

  const modalityAvg = mean(modalityAll);
  const relativeEvoPct =
    athleteBest !== null && modalityAvg > 0
      ? (athleteBest / modalityAvg) * 100
      : null;

  let evoLevel: "good" | "medium" | "bad" = "medium";
  if (relativeEvoPct !== null) {
    if (relativeEvoPct > 120) evoLevel = "good";
    else if (relativeEvoPct >= 80) evoLevel = "medium";
    else evoLevel = "bad";
  }

  const kpi4: KpiData = {
    label: "Evolucao Relativa",
    value: relativeEvoPct !== null ? `${relativeEvoPct.toFixed(0)}%` : "—",
    description: "em relacao a media da modalidade",
    level: evoLevel,
    icon: BarChart3,
  };

  const kpis = [kpi1, kpi2, kpi3, kpi4];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.label} {...kpi} />
      ))}
    </div>
  );
}

function KpiCard({ label, value, description, level, icon: Icon }: KpiData) {
  return (
    <div className="relative flex flex-col gap-3 overflow-hidden rounded-xl border border-[#0a1628]/[0.06] bg-white p-4 shadow-sm">
      {/* Color bar */}
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-[3px] rounded-t-xl",
          LEVEL_COLORS[level]
        )}
      />

      {/* Icon + value row */}
      <div className="flex items-start justify-between pt-1">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            level === "good" && "bg-[#009739]/10",
            level === "medium" && "bg-amber-400/10",
            level === "bad" && "bg-red-500/10"
          )}
        >
          <Icon
            className={cn("size-4", LEVEL_TEXT[level])}
          />
        </div>
        <span
          className={cn(
            "font-mono text-xl font-extrabold tracking-tight",
            LEVEL_TEXT[level]
          )}
        >
          {value}
        </span>
      </div>

      {/* Labels */}
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-semibold text-[#0a1628]">{label}</span>
        <span className="text-[10px] text-[#0a1628]/40">{description}</span>
      </div>
    </div>
  );
}
