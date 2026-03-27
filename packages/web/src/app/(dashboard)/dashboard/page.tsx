import { redirect } from "next/navigation";
import { Users, Building2, Medal, Activity } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/roles";
import { BRAZILIAN_STATES } from "@/lib/constants/states";
import { MODALITIES } from "@/lib/constants/modalities";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { RegionChart, LevelChart, ModalityChart } from "./charts";
import type { CompetitiveLevel } from "@/types/database";

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ElementType;
  value: number | string;
  label: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#0a1628]/[0.07] bg-white shadow-sm">
      {/* Green accent line at top */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-[#009739]" />
      <div className="flex items-start gap-4 p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#009739]/10">
          <Icon className="size-5 text-[#009739]" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-3xl font-extrabold leading-none tracking-tight text-[#0a1628]">
            {typeof value === "number" ? value.toLocaleString("pt-BR") : value}
          </span>
          <span className="text-xs font-medium text-[#0a1628]/50">{label}</span>
        </div>
      </div>
    </div>
  );
}

// ── Grade Badge ───────────────────────────────────────────────────────────────

const GRADE_BADGE: Record<CompetitiveLevel, { label: string; className: string }> = {
  school: { label: "Base", className: "bg-slate-100 text-slate-600 border-slate-200" },
  state: { label: "Estadual", className: "bg-blue-50 text-blue-700 border-blue-200" },
  national: { label: "Nacional", className: "bg-green-50 text-green-700 border-green-200" },
  elite: { label: "Elite", className: "bg-amber-50 text-amber-700 border-amber-200" },
};

function getModalityName(code: string): string {
  return MODALITIES.find((m) => m.code === code)?.name ?? code;
}

function getStateName(uf: string): string {
  return BRAZILIAN_STATES.find((s) => s.uf === uf)?.name ?? uf;
}

// ── Level label mapping ───────────────────────────────────────────────────────

const LEVEL_LABELS: Record<string, string> = {
  school: "Base Escolar",
  state: "Estadual",
  national: "Nacional",
  elite: "Alto Rendimento",
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const supabase = await createClient();
  const isAdmin =
    session.role === "admin_nacional" ||
    session.role === "confederacao" ||
    session.role === "federacao";

  // ── Base athlete query scope ────────────────────────────────────────────────
  // Clubs and técnicos only see their own entity; higher roles see all.
  const buildAthleteQuery = () => {
    const q = supabase.from("athletes").select("*", { count: "exact", head: true });
    if (!isAdmin && session.entityId) {
      return q.eq("current_entity_id", session.entityId);
    }
    return q;
  };

  // ── Parallel queries ────────────────────────────────────────────────────────
  const [
    { count: totalAthletes },
    { count: activeAthletes },
    { count: totalEntities },
    { count: totalCompetitions },
    { data: athletesByState },
    { data: athletesByLevel },
    { data: athletesByModality },
    { data: recentCompetitions },
  ] = await Promise.all([
    // Total athletes
    buildAthleteQuery(),
    // Active athletes
    (() => {
      const q = supabase.from("athletes").select("*", { count: "exact", head: true }).eq("status", "active");
      if (!isAdmin && session.entityId) return q.eq("current_entity_id", session.entityId);
      return q;
    })(),
    // Total entities
    supabase.from("entities").select("*", { count: "exact", head: true }),
    // Total competitions
    supabase.from("competitions").select("*", { count: "exact", head: true }),
    // Athletes by state (for region grouping)
    (() => {
      const q = supabase.from("athletes").select("state");
      if (!isAdmin && session.entityId) return q.eq("current_entity_id", session.entityId);
      return q;
    })(),
    // Athletes by competitive_level
    (() => {
      const q = supabase.from("athletes").select("competitive_level");
      if (!isAdmin && session.entityId) return q.eq("current_entity_id", session.entityId);
      return q;
    })(),
    // Athletes by modality (top 10)
    (() => {
      const q = supabase.from("athletes").select("primary_modality");
      if (!isAdmin && session.entityId) return q.eq("current_entity_id", session.entityId);
      return q;
    })(),
    // Recent competitions
    supabase
      .from("competitions")
      .select("id, name, date_start, grade, modality_code, location_state")
      .order("date_start", { ascending: false })
      .limit(5),
  ]);

  // ── Compute region data ─────────────────────────────────────────────────────
  const regionOrder = ["Norte", "Nordeste", "Centro-Oeste", "Sudeste", "Sul"];
  const regionMap: Record<string, number> = Object.fromEntries(
    regionOrder.map((r) => [r, 0])
  );
  for (const row of athletesByState ?? []) {
    const stateInfo = BRAZILIAN_STATES.find((s) => s.uf === row.state);
    if (stateInfo && stateInfo.region in regionMap) {
      regionMap[stateInfo.region]++;
    }
  }
  const regionData = regionOrder.map((r) => ({ region: r, count: regionMap[r] }));

  // ── Compute level data ──────────────────────────────────────────────────────
  const levelMap: Record<string, number> = {};
  for (const row of athletesByLevel ?? []) {
    const key = row.competitive_level as string;
    levelMap[key] = (levelMap[key] ?? 0) + 1;
  }
  const levelData = Object.entries(levelMap).map(([level, count]) => ({
    level: LEVEL_LABELS[level] ?? level,
    count,
  }));

  // ── Compute modality data (top 10) ──────────────────────────────────────────
  const modalityMap: Record<string, number> = {};
  for (const row of athletesByModality ?? []) {
    const key = row.primary_modality as string;
    modalityMap[key] = (modalityMap[key] ?? 0) + 1;
  }
  const modalityData = Object.entries(modalityMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([code, count]) => ({
      name: getModalityName(code),
      count,
    }));

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#009739]/10">
          <Activity className="size-5 text-[#009739]" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-[#0a1628]">
            Dashboard
          </h1>
          <p className="text-xs text-[#0a1628]/40">
            Visao geral do esporte brasileiro
          </p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard icon={Users} value={totalAthletes ?? 0} label="Total Atletas" />
        <KpiCard icon={Building2} value={totalEntities ?? 0} label="Total Entidades" />
        <KpiCard icon={Medal} value={totalCompetitions ?? 0} label="Total Competicoes" />
        <KpiCard icon={Activity} value={activeAthletes ?? 0} label="Atletas Ativos" />
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RegionChart data={regionData} />
        <LevelChart data={levelData} />
      </div>

      {/* Modality chart — full width */}
      {modalityData.length > 0 && (
        <ModalityChart data={modalityData} />
      )}

      {/* Recent competitions table */}
      <div className="rounded-2xl border border-[#0a1628]/[0.06] bg-white shadow-sm overflow-hidden">
        <div className="border-b border-[#0a1628]/[0.06] px-5 py-3">
          <p className="text-sm font-semibold text-[#0a1628]">
            Competicoes Recentes
          </p>
        </div>
        {!recentCompetitions || recentCompetitions.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-sm text-[#0a1628]/40">
            Nenhuma competicao registrada ainda.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-b border-[#0a1628]/[0.05] hover:bg-transparent">
                <TableHead className="pl-5 text-xs font-semibold uppercase tracking-wider text-[#0a1628]/40">
                  Nome
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#0a1628]/40">
                  Data
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#0a1628]/40">
                  Nivel
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#0a1628]/40">
                  Modalidade
                </TableHead>
                <TableHead className="pr-5 text-xs font-semibold uppercase tracking-wider text-[#0a1628]/40">
                  Estado
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentCompetitions.map((comp) => {
                const gradeBadge = GRADE_BADGE[comp.grade as CompetitiveLevel] ?? GRADE_BADGE.school;
                return (
                  <TableRow
                    key={comp.id}
                    className="border-b border-[#0a1628]/[0.04] transition-colors hover:bg-[#0a1628]/[0.02]"
                  >
                    <TableCell className="pl-5 font-medium text-[#0a1628]">
                      {comp.name}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-[#0a1628]/60">
                      {new Date(comp.date_start).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("text-xs font-medium border", gradeBadge.className)}
                      >
                        {gradeBadge.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-[#0a1628]/60">
                      {getModalityName(comp.modality_code)}
                    </TableCell>
                    <TableCell className="pr-5 font-mono text-sm text-[#0a1628]/60">
                      {getStateName(comp.location_state)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
