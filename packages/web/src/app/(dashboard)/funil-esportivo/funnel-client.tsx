"use client";

import { useCallback, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { TrendingUp, Users, TrendingDown, AlertCircle } from "lucide-react";
import { FunnelChart } from "@/components/charts/funnel-chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MODALITIES } from "@/lib/constants/modalities";
import { BRAZILIAN_STATES } from "@/lib/constants/states";

const FUNNEL_COLORS = {
  school: "#94a3b8",
  state: "#3b82f6",
  national: "#009739",
  elite: "#eab308",
};

const LEVEL_LABELS: Record<string, string> = {
  school: "Base Escolar",
  state: "Estadual",
  national: "Nacional",
  elite: "Alto Rendimento",
};

const LEVEL_ORDER = ["school", "state", "national", "elite"] as const;

interface FunnelData {
  level: string;
  count: number;
}

interface FunnelClientProps {
  funnelData: FunnelData[];
  totalAthletes: number;
}

export function FunnelClient({ funnelData, totalAthletes }: FunnelClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams]
  );

  const handleFilterChange = useCallback(
    (name: string, value: string) => {
      startTransition(() => {
        router.replace(`${pathname}?${createQueryString(name, value)}`);
      });
    },
    [pathname, router, createQueryString]
  );

  // Build ordered funnel levels
  const dataMap = Object.fromEntries(funnelData.map((d) => [d.level, d.count]));
  const levels = LEVEL_ORDER.map((key) => ({
    label: LEVEL_LABELS[key],
    count: dataMap[key] ?? 0,
    color: FUNNEL_COLORS[key],
  }));

  const baseCount = levels[0]?.count ?? 0;
  const eliteCount = levels[levels.length - 1]?.count ?? 0;
  const overallConversionRate =
    baseCount > 0 ? ((eliteCount / baseCount) * 100).toFixed(1) : "0.0";

  // Level with highest dropout (lowest conversion rate to next level)
  let highestDropoutLevel = "-";
  let lowestConversionRate = Infinity;
  for (let i = 0; i < levels.length - 1; i++) {
    const curr = levels[i].count;
    const next = levels[i + 1].count;
    if (curr > 0) {
      const rate = (next / curr) * 100;
      if (rate < lowestConversionRate) {
        lowestConversionRate = rate;
        highestDropoutLevel = levels[i].label;
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <TrendingUp className="size-4 text-primary" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Funil Esportivo Nacional
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Distribuição de {totalAthletes.toLocaleString("pt-BR")} atletas por nível competitivo
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <Select
            defaultValue={searchParams.get("modality") ?? "all"}
            onValueChange={(value) => handleFilterChange("modality", value ?? "all")}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Modalidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas modalidades</SelectItem>
              {MODALITIES.map((m) => (
                <SelectItem key={m.code} value={m.code}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            defaultValue={searchParams.get("state") ?? "all"}
            onValueChange={(value) => handleFilterChange("state", value ?? "all")}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os estados</SelectItem>
              {BRAZILIAN_STATES.map((s) => (
                <SelectItem key={s.uf} value={s.uf}>
                  {s.uf} — {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main layout: funnel + metrics */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        {/* Funnel */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-xs flex flex-col items-center">
          <FunnelChart
            levels={levels}
            className="max-w-2xl w-full"
          />
        </div>

        {/* Metrics sidebar */}
        <div className="flex flex-col gap-4">
          {/* Total na base */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                <Users className="size-4" />
                Total na base
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black text-foreground tabular-nums">
                {baseCount.toLocaleString("pt-BR")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">atletas em nível escolar</p>
            </CardContent>
          </Card>

          {/* Taxa geral de conversão */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                <TrendingUp className="size-4" />
                Taxa base → elite
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black text-primary tabular-nums">
                {overallConversionRate}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {eliteCount.toLocaleString("pt-BR")} de{" "}
                {baseCount.toLocaleString("pt-BR")} chegam ao topo
              </p>
            </CardContent>
          </Card>

          {/* Maior evasão */}
          <Card className="border-amber-200">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                <TrendingDown className="size-4 text-amber-500" />
                Maior evasão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold text-amber-600">{highestDropoutLevel}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {lowestConversionRate !== Infinity
                  ? `${lowestConversionRate.toFixed(0)}% avançam neste nível`
                  : "Dados insuficientes"}
              </p>
            </CardContent>
          </Card>

          {/* Info */}
          <Card className="bg-muted/40">
            <CardContent className="pt-4">
              <div className="flex gap-2 text-xs text-muted-foreground">
                <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
                <p>
                  As taxas de conversão mostram a proporção de atletas que avançam de um nível para
                  o próximo. Use os filtros para comparar por modalidade ou região.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Per-level breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">
                Detalhamento por nível
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {levels.map((level) => {
                const pct =
                  baseCount > 0 ? Math.round((level.count / baseCount) * 100) : 0;
                return (
                  <div key={level.label} className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-sm shrink-0"
                      style={{ backgroundColor: level.color }}
                    />
                    <span className="flex-1 text-xs text-muted-foreground truncate">
                      {level.label}
                    </span>
                    <span className="text-xs font-semibold text-foreground tabular-nums">
                      {level.count.toLocaleString("pt-BR")}
                    </span>
                    <span className="text-xs text-muted-foreground w-8 text-right">
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
