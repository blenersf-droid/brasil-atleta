import Link from "next/link";
import { redirect } from "next/navigation";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/roles";
import { MODALITIES } from "@/lib/constants/modalities";
import { BRAZILIAN_STATES } from "@/lib/constants/states";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ExportButton } from "@/components/export/export-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ScoutingFilters } from "./scouting-filters";
import type { Athlete, Competition, CompetitiveLevel, Result } from "@/types/database";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getModalityName(code: string): string {
  return MODALITIES.find((m) => m.code === code)?.name ?? code;
}

function getStateName(uf: string): string {
  return BRAZILIAN_STATES.find((s) => s.uf === uf)?.name ?? uf;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-indigo-500",
  "bg-red-500",
];

function getAvatarColor(name: string): string {
  const index =
    name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

const LEVEL_BADGE: Record<CompetitiveLevel, { label: string; className: string }> = {
  school: { label: "Base", className: "bg-slate-100 text-slate-600 border-slate-200" },
  state: { label: "Estadual", className: "bg-blue-50 text-blue-700 border-blue-200" },
  national: { label: "Nacional", className: "bg-green-50 text-green-700 border-green-200" },
  elite: { label: "Elite", className: "bg-amber-50 text-amber-700 border-amber-200" },
};

// ── Medal styling for top 3 ───────────────────────────────────────────────────

const PODIUM_ROW: Record<number, string> = {
  1: "bg-amber-50/60 border-amber-200/40",
  2: "bg-slate-50/60 border-slate-200/40",
  3: "bg-orange-50/60 border-orange-200/40",
};

const PODIUM_RANK: Record<number, string> = {
  1: "font-mono font-extrabold text-amber-500",
  2: "font-mono font-extrabold text-slate-500",
  3: "font-mono font-extrabold text-orange-500",
};

// ── Ranking row type ──────────────────────────────────────────────────────────

interface RankingRow {
  athleteId: string;
  fullName: string;
  state: string;
  competitiveLevel: CompetitiveLevel;
  bestMark: number;
  markUnit: string | null;
  competitionCount: number;
  isParalympic: boolean;
  functionalClass: string | null;
}

// ── Period filter helper ──────────────────────────────────────────────────────

function periodToDate(period: string): string | null {
  const now = new Date();
  if (period === "1y") {
    now.setFullYear(now.getFullYear() - 1);
    return now.toISOString().split("T")[0];
  }
  if (period === "2y") {
    now.setFullYear(now.getFullYear() - 2);
    return now.toISOString().split("T")[0];
  }
  return null;
}

// ── Page ──────────────────────────────────────────────────────────────────────

interface ScoutingPageProps {
  searchParams: Promise<{
    modality?: string;
    category?: string;
    period?: string;
    functional_class?: string;
  }>;
}

export default async function ScoutingPage({ searchParams }: ScoutingPageProps) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const modality = params.modality ?? MODALITIES[0].code;
  const category = params.category ?? "";
  const period = params.period ?? "all";
  const functionalClass = params.functional_class ?? "";

  const supabase = await createClient();

  // ── Step 1: Get competitions for the selected modality ──────────────────────
  let compQuery = supabase
    .from("competitions")
    .select("id, date_start")
    .eq("modality_code", modality);

  const cutoffDate = periodToDate(period);
  if (cutoffDate) {
    compQuery = compQuery.gte("date_start", cutoffDate);
  }

  const { data: competitions } = await compQuery;
  const competitionIds = (competitions ?? []).map((c: Pick<Competition, "id">) => c.id);

  // ── Step 2: Get results for those competitions ──────────────────────────────
  let ranking: RankingRow[] = [];

  if (competitionIds.length > 0) {
    let resultsQuery = supabase
      .from("results")
      .select(
        `
        athlete_id,
        competition_id,
        mark_numeric,
        mark_unit,
        category,
        athletes (
          id,
          full_name,
          state,
          competitive_level,
          is_paralympic,
          paralympic_classification
        )
      `
      )
      .in("competition_id", competitionIds)
      .not("mark_numeric", "is", null);

    if (category) {
      resultsQuery = resultsQuery.eq("category", category);
    }

    const { data: rawResults, error } = await resultsQuery;

    if (error) {
      console.error("Error fetching scouting results:", error);
    }

    // ── Group by athlete: best mark_numeric + competition count ───────────────
    const athleteMap = new Map<
      string,
      {
        athleteId: string;
        fullName: string;
        state: string;
        competitiveLevel: CompetitiveLevel;
        bestMark: number;
        markUnit: string | null;
        competitionIds: Set<string>;
        isParalympic: boolean;
        functionalClass: string | null;
      }
    >();

    for (const row of rawResults ?? []) {
      const athlete = row.athletes as unknown as Pick<
        Athlete,
        "id" | "full_name" | "state" | "competitive_level"
      > & { is_paralympic: boolean; paralympic_classification: Record<string, string> | null } | null;
      const markNumeric = row.mark_numeric as number | null;

      if (!athlete || markNumeric === null) continue;

      // Filter by functional class if provided
      const athFunctionalClass =
        (athlete.paralympic_classification?.functional_class as string | undefined) ?? null;
      if (
        functionalClass &&
        athFunctionalClass?.toLowerCase() !== functionalClass.toLowerCase()
      ) {
        continue;
      }

      const existing = athleteMap.get(athlete.id);
      if (!existing) {
        athleteMap.set(athlete.id, {
          athleteId: athlete.id,
          fullName: athlete.full_name,
          state: athlete.state,
          competitiveLevel: athlete.competitive_level,
          bestMark: markNumeric,
          markUnit: row.mark_unit ?? null,
          competitionIds: new Set([row.competition_id as string]),
          isParalympic: athlete.is_paralympic ?? false,
          functionalClass: athFunctionalClass,
        });
      } else {
        if (markNumeric > existing.bestMark) {
          existing.bestMark = markNumeric;
          existing.markUnit = row.mark_unit ?? existing.markUnit;
        }
        existing.competitionIds.add(row.competition_id as string);
      }
    }

    // Sort by best mark descending
    ranking = Array.from(athleteMap.values())
      .sort((a, b) => b.bestMark - a.bestMark)
      .map((entry) => ({
        athleteId: entry.athleteId,
        fullName: entry.fullName,
        state: entry.state,
        competitiveLevel: entry.competitiveLevel,
        bestMark: entry.bestMark,
        markUnit: entry.markUnit,
        competitionCount: entry.competitionIds.size,
        isParalympic: entry.isParalympic,
        functionalClass: entry.functionalClass,
      }));
  }

  const modalityName = getModalityName(modality);

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#009739]/10">
          <Search className="size-5 text-[#009739]" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-[#0a1628]">
            Scouting — Rankings
          </h1>
          <p className="text-xs text-[#0a1628]/40">
            Ranking de desempenho por modalidade e categoria
          </p>
        </div>
      </div>

      {/* Filters + Export */}
      <div className="flex items-start justify-between gap-3">
        <ScoutingFilters
          currentModality={modality}
          currentCategory={category}
          currentPeriod={period}
          currentFunctionalClass={functionalClass}
        />
        <ExportButton
          data={ranking.map((row, idx) => ({
            posicao: idx + 1,
            atleta: row.fullName,
            melhor_resultado: row.bestMark,
            unidade: row.markUnit ?? "",
            competicoes: row.competitionCount,
            nivel: LEVEL_BADGE[row.competitiveLevel]?.label ?? row.competitiveLevel,
            estado: getStateName(row.state),
          }))}
          filename="scouting_ranking"
        />
      </div>

      {/* Ranking table */}
      <div className="rounded-2xl border border-[#0a1628]/[0.06] bg-white shadow-sm overflow-hidden">
        <div className="border-b border-[#0a1628]/[0.06] px-5 py-3">
          <p className="text-sm font-semibold text-[#0a1628]">
            {modalityName}
            {category && (
              <span className="ml-2 text-xs font-normal text-[#0a1628]/40">
                — {category}
              </span>
            )}
          </p>
          <p className="text-xs text-[#0a1628]/40">
            {ranking.length} atleta{ranking.length !== 1 ? "s" : ""} encontrado
            {ranking.length !== 1 ? "s" : ""}
          </p>
        </div>

        {ranking.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <Search className="size-10 text-[#0a1628]/15" />
            <p className="text-sm font-medium text-[#0a1628]/40">
              Nenhum resultado encontrado
            </p>
            <p className="text-xs text-[#0a1628]/30">
              Tente outra modalidade, categoria ou periodo.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-b border-[#0a1628]/[0.05] hover:bg-transparent">
                <TableHead className="w-14 pl-5 text-xs font-semibold uppercase tracking-wider text-[#0a1628]/40">
                  #
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#0a1628]/40">
                  Atleta
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#0a1628]/40">
                  Melhor Resultado
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#0a1628]/40">
                  Competicoes
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#0a1628]/40">
                  Nivel
                </TableHead>
                <TableHead className="pr-5 text-xs font-semibold uppercase tracking-wider text-[#0a1628]/40">
                  Estado
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranking.map((row, idx) => {
                const position = idx + 1;
                const levelBadge =
                  LEVEL_BADGE[row.competitiveLevel] ?? LEVEL_BADGE.school;
                const initials = getInitials(row.fullName);
                const avatarColor = getAvatarColor(row.fullName);
                const podiumRow = PODIUM_ROW[position] ?? "";
                const podiumRank = PODIUM_RANK[position];

                return (
                  <TableRow
                    key={row.athleteId}
                    className={cn(
                      "border-b border-[#0a1628]/[0.04] transition-colors",
                      podiumRow || "hover:bg-[#0a1628]/[0.02]"
                    )}
                  >
                    {/* Position */}
                    <TableCell className="pl-5">
                      <span
                        className={cn(
                          "font-mono text-sm",
                          podiumRank ?? "text-[#0a1628]/40"
                        )}
                      >
                        {position}
                      </span>
                    </TableCell>

                    {/* Athlete */}
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar size="default">
                          <AvatarFallback
                            className={cn(
                              "text-xs font-semibold text-white",
                              avatarColor
                            )}
                          >
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/athletes/${row.athleteId}`}
                              className="font-medium text-[#0a1628] transition-colors hover:text-[#009739] hover:underline underline-offset-4"
                            >
                              {row.fullName}
                            </Link>
                            {row.isParalympic && (
                              <Badge
                                variant="outline"
                                className="text-[10px] font-semibold border-primary/30 bg-primary/10 text-primary px-1 py-0"
                              >
                                P
                              </Badge>
                            )}
                          </div>
                          {row.functionalClass && (
                            <span className="text-[10px] text-[#0a1628]/40 font-mono">
                              {row.functionalClass}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Best result */}
                    <TableCell>
                      <span className="font-mono text-sm font-semibold text-[#0a1628]">
                        {row.bestMark.toLocaleString("pt-BR", {
                          maximumFractionDigits: 2,
                        })}
                        {row.markUnit && (
                          <span className="ml-1 text-xs font-normal text-[#0a1628]/40">
                            {row.markUnit}
                          </span>
                        )}
                      </span>
                    </TableCell>

                    {/* Competitions count */}
                    <TableCell>
                      <span className="font-mono text-sm text-[#0a1628]/60">
                        {row.competitionCount}
                      </span>
                    </TableCell>

                    {/* Level badge */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs font-medium border",
                          levelBadge.className
                        )}
                      >
                        {levelBadge.label}
                      </Badge>
                    </TableCell>

                    {/* State */}
                    <TableCell className="pr-5 font-mono text-sm text-[#0a1628]/60">
                      {getStateName(row.state)}
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
