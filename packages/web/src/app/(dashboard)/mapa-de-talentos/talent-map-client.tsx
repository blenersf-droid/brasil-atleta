"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { MapPin, AlertTriangle } from "lucide-react";
import { BrazilMap } from "@/components/maps/brazil-map";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MODALITIES } from "@/lib/constants/modalities";
import { BRAZILIAN_STATES } from "@/lib/constants/states";
import { cn } from "@/lib/utils";

const LEVEL_OPTIONS = [
  { value: "school", label: "Base Escolar" },
  { value: "state", label: "Estadual" },
  { value: "national", label: "Nacional" },
  { value: "elite", label: "Alto Rendimento" },
];

interface StateDetail {
  uf: string;
  count: number;
  topModalities: { name: string; count: number }[];
  entityCount: number;
}

interface TalentMapClientProps {
  stateData: Record<string, number>;
  maxCount: number;
  stateDetails: Record<string, StateDetail>;
  totalAthletes: number;
}

export function TalentMapClient({
  stateData,
  maxCount,
  stateDetails,
  totalAthletes,
}: TalentMapClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [selectedState, setSelectedState] = useState<string | null>(null);

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

  const handleStateClick = (uf: string) => {
    setSelectedState((prev) => (prev === uf ? null : uf));
  };

  // Top 5 states by count
  const top5States = Object.entries(stateData)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Empty states (0 athletes)
  const emptyStates = BRAZILIAN_STATES.filter((s) => !stateData[s.uf] || stateData[s.uf] === 0);

  const selectedDetail = selectedState ? stateDetails[selectedState] : null;
  const selectedStateName = selectedState
    ? BRAZILIAN_STATES.find((s) => s.uf === selectedState)?.name ?? selectedState
    : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <MapPin className="size-4 text-primary" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Mapa Nacional de Talentos
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {totalAthletes} atleta{totalAthletes !== 1 ? "s" : ""} distribuídos pelo Brasil
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
            defaultValue={searchParams.get("level") ?? "all"}
            onValueChange={(value) => handleFilterChange("level", value ?? "all")}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Nível" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os níveis</SelectItem>
              {LEVEL_OPTIONS.map((l) => (
                <SelectItem key={l.value} value={l.value}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main content: map + sidebar */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        {/* Map section */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <BrazilMap
              data={stateData}
              onStateClick={handleStateClick}
              maxCount={maxCount}
              selectedState={selectedState}
            />
          </div>

          {/* State detail panel */}
          {selectedState && selectedDetail && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="size-4 text-primary" />
                  {selectedStateName}
                  <Badge variant="outline" className="ml-auto text-xs">
                    {selectedDetail.count} atleta{selectedDetail.count !== 1 ? "s" : ""}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {selectedDetail.topModalities.length > 0 ? (
                  <div>
                    <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Principais modalidades
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedDetail.topModalities.map((m) => (
                        <Badge
                          key={m.name}
                          variant="outline"
                          className="text-xs bg-white"
                        >
                          {m.name} ({m.count})
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma modalidade registrada neste estado.
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Entidades</span>
                    <span className="font-semibold text-foreground">{selectedDetail.entityCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {!selectedState && (
            <p className="text-center text-sm text-muted-foreground">
              Clique em um estado para ver detalhes
            </p>
          )}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          {/* Top 5 states */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">
                Top 5 estados
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {top5States.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhum dado disponível</p>
              ) : (
                top5States.map(([uf, count], i) => {
                  const stateName = BRAZILIAN_STATES.find((s) => s.uf === uf)?.name ?? uf;
                  const pct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
                  return (
                    <button
                      key={uf}
                      onClick={() => handleStateClick(uf)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted",
                        selectedState === uf && "bg-primary/10"
                      )}
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                        {i + 1}
                      </span>
                      <span className="flex-1 truncate font-medium text-foreground">
                        {stateName}
                      </span>
                      <span className="text-xs text-muted-foreground">{count}</span>
                      <span className="text-xs text-primary font-medium">{pct}%</span>
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Empty states */}
          {emptyStates.length > 0 && (
            <Card className="border-destructive/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-destructive">
                  <AlertTriangle className="size-3.5" />
                  Sem representação ({emptyStates.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {emptyStates.map((s) => (
                    <Badge
                      key={s.uf}
                      variant="outline"
                      className="text-xs text-destructive border-destructive/30 cursor-pointer hover:bg-destructive/5"
                      onClick={() => handleStateClick(s.uf)}
                    >
                      {s.uf}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Legend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Escala de cores
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1.5">
              {[
                { color: "#f0fdf4", label: "Sem atletas" },
                { color: "#bbf7d0", label: "Poucos (1–20%)" },
                { color: "#86efac", label: "Baixo (20–40%)" },
                { color: "#4ade80", label: "Médio (40–60%)" },
                { color: "#16a34a", label: "Alto (60–80%)" },
                { color: "#14532d", label: "Máximo (80–100%)" },
              ].map((item) => (
                <div key={item.color} className="flex items-center gap-2 text-xs">
                  <div
                    className="h-4 w-4 rounded border border-border"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-muted-foreground">{item.label}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
