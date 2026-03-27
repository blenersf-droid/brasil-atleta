import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, PencilIcon, Calendar, MapPin, User, Building2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/roles";
import { MODALITIES } from "@/lib/constants/modalities";
import { BRAZILIAN_STATES } from "@/lib/constants/states";
import type { CompetitiveLevel, AthleteStatus, Gender } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Timeline, type TimelineItem } from "@/components/ui/timeline";
import { cn } from "@/lib/utils";
import { KpiCards } from "@/components/athletes/kpi-cards";
import { AssessmentsTab } from "./assessments-tab";

const LEVEL_BADGE: Record<CompetitiveLevel, { label: string; className: string }> = {
  school: { label: "Base Escolar", className: "bg-muted text-muted-foreground border-border" },
  state: { label: "Estadual", className: "bg-blue-100 text-blue-700 border-blue-200" },
  national: { label: "Nacional", className: "bg-green-100 text-green-700 border-green-200" },
  elite: { label: "Alto Rendimento", className: "bg-amber-100 text-amber-700 border-amber-200" },
};

const GRADE_BADGE: Record<CompetitiveLevel, { label: string; className: string }> = {
  school: { label: "Base Escolar", className: "bg-muted text-muted-foreground border-border" },
  state: { label: "Estadual", className: "bg-blue-100 text-blue-700 border-blue-200" },
  national: { label: "Nacional", className: "bg-green-100 text-green-700 border-green-200" },
  elite: { label: "Elite", className: "bg-amber-100 text-amber-700 border-amber-200" },
};

const STATUS_BADGE: Record<AthleteStatus, { label: string; className: string }> = {
  active: { label: "Ativo", className: "bg-green-100 text-green-700 border-green-200" },
  inactive: { label: "Inativo", className: "bg-muted text-muted-foreground border-border" },
  retired: { label: "Aposentado", className: "bg-orange-100 text-orange-700 border-orange-200" },
};

const GENDER_LABELS: Record<Gender, string> = {
  M: "Masculino",
  F: "Feminino",
  NB: "Nao-binario",
};

function getModalityName(code: string): string {
  return MODALITIES.find((m) => m.code === code)?.name ?? code;
}

function getStateName(uf: string): string {
  const found = BRAZILIAN_STATES.find((s) => s.uf === uf);
  return found ? `${found.name} (${uf})` : uf;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatShortDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate + "T00:00:00");
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
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

interface AthleteProfilePageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ year?: string }>;
}

interface ResultWithCompetition {
  id: string;
  athlete_id: string;
  competition_id: string;
  position: number | null;
  mark: string | null;
  mark_numeric: number | null;
  mark_unit: string | null;
  category: string | null;
  created_at: string;
  competitions: {
    id: string;
    name: string;
    date_start: string | null;
    grade: string | null;
    modality_code: string | null;
  } | null;
}

export default async function AthleteProfilePage({ params, searchParams }: AthleteProfilePageProps) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const { year: yearFilter } = await searchParams;
  const supabase = await createClient();

  const { data: athlete, error } = await supabase
    .from("athletes")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !athlete) {
    notFound();
  }

  // Fetch linked entity name if exists
  let entityName: string | null = null;
  if (athlete.current_entity_id) {
    const { data: entity } = await supabase
      .from("entities")
      .select("name")
      .eq("id", athlete.current_entity_id)
      .single();
    entityName = entity?.name ?? null;
  }

  // Fetch assessments for this athlete
  const { data: assessmentsRaw } = await supabase
    .from("assessments")
    .select("*")
    .eq("athlete_id", id)
    .order("assessment_date", { ascending: false });

  const assessments = assessmentsRaw ?? [];

  // Fetch results with competition data
  const { data: resultsRaw } = await supabase
    .from("results")
    .select(`
      id,
      athlete_id,
      competition_id,
      position,
      mark,
      mark_numeric,
      mark_unit,
      category,
      created_at,
      competitions (
        id,
        name,
        date_start,
        grade,
        modality_code
      )
    `)
    .eq("athlete_id", id)
    .order("created_at", { ascending: false });

  const allResults: ResultWithCompetition[] = (resultsRaw ?? []) as unknown as ResultWithCompetition[];

  // Filter by year if set
  const filteredResults = yearFilter
    ? allResults.filter((r) => {
        const dateStr = r.competitions?.date_start;
        if (!dateStr) return false;
        return new Date(dateStr).getFullYear() === parseInt(yearFilter, 10);
      })
    : allResults;

  // Sort by competition date descending
  const sortedResults = [...filteredResults].sort((a, b) => {
    const dateA = a.competitions?.date_start ?? "";
    const dateB = b.competitions?.date_start ?? "";
    return dateB.localeCompare(dateA);
  });

  // Compute available years for filter
  const years = Array.from(
    new Set(
      allResults
        .map((r) => r.competitions?.date_start)
        .filter((d): d is string => !!d)
        .map((d) => new Date(d).getFullYear())
    )
  ).sort((a, b) => b - a);

  // Compute progression: for each result, compare mark_numeric with the previous result of the SAME modality
  function getTrend(result: ResultWithCompetition, allSorted: ResultWithCompetition[]): TimelineItem["trend"] {
    const modality = result.competitions?.modality_code;
    if (!modality || result.mark_numeric == null) return "neutral";

    // Find the previous result (earlier date) with same modality
    const currentDate = result.competitions?.date_start ?? "";
    const sameModality = allSorted.filter(
      (r) =>
        r.id !== result.id &&
        r.competitions?.modality_code === modality &&
        r.mark_numeric != null &&
        (r.competitions?.date_start ?? "") < currentDate
    );

    if (sameModality.length === 0) return "neutral";

    // Most recent previous
    const prev = sameModality[0];
    const prevMark = prev.mark_numeric!;
    const currMark = result.mark_numeric;

    // For time-based (s), lower is better; for m, kg, pts — higher is better
    const unit = result.mark_unit;
    const lowerIsBetter = unit === "s";

    if (lowerIsBetter) {
      return currMark < prevMark ? "improvement" : currMark > prevMark ? "decline" : "neutral";
    } else {
      return currMark > prevMark ? "improvement" : currMark < prevMark ? "decline" : "neutral";
    }
  }

  // Get delta value for tooltip text
  function getDeltaText(result: ResultWithCompetition, allSorted: ResultWithCompetition[]): string | null {
    const modality = result.competitions?.modality_code;
    if (!modality || result.mark_numeric == null) return null;

    const currentDate = result.competitions?.date_start ?? "";
    const sameModality = allSorted.filter(
      (r) =>
        r.id !== result.id &&
        r.competitions?.modality_code === modality &&
        r.mark_numeric != null &&
        (r.competitions?.date_start ?? "") < currentDate
    );

    if (sameModality.length === 0) return null;

    const prev = sameModality[0];
    const delta = result.mark_numeric - prev.mark_numeric!;
    const sign = delta > 0 ? "+" : "";
    return `${sign}${delta.toFixed(2)}${result.mark_unit ?? ""}`;
  }

  // Build timeline items
  const timelineItems: TimelineItem[] = sortedResults.map((result) => {
    const trend = getTrend(result, sortedResults);
    const delta = getDeltaText(result, sortedResults);
    const gradeBadge = result.competitions?.grade
      ? GRADE_BADGE[result.competitions.grade as CompetitiveLevel]
      : null;

    return {
      id: result.id,
      date: formatShortDate(result.competitions?.date_start ?? null),
      title: result.competitions?.name ?? "Competicao desconhecida",
      trend,
      badge: gradeBadge ? (
        <Badge
          variant="outline"
          className={cn("text-xs font-medium border", gradeBadge.className)}
        >
          {gradeBadge.label}
        </Badge>
      ) : undefined,
      content: (
        <div className="flex flex-wrap items-center gap-3">
          {/* Modality code badge */}
          {result.competitions?.modality_code && (
            <Badge variant="outline" className="text-xs font-mono">
              {result.competitions.modality_code}
            </Badge>
          )}

          {/* Position */}
          {result.position != null && (
            <span className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{result.position}º</span> lugar
            </span>
          )}

          {/* Mark */}
          {result.mark && (
            <span className="font-mono text-sm font-medium text-foreground">
              {result.mark}
              {result.mark_unit && (
                <span className="ml-0.5 text-xs text-muted-foreground">{result.mark_unit}</span>
              )}
            </span>
          )}

          {/* Category */}
          {result.category && (
            <Badge variant="outline" className="text-xs font-medium capitalize">
              {result.category}
            </Badge>
          )}

          {/* Trend indicator */}
          {trend === "improvement" && (
            <span className="flex items-center gap-0.5 text-xs font-semibold text-[#009739]">
              <TrendingUp className="size-3.5" />
              {delta}
            </span>
          )}
          {trend === "decline" && (
            <span className="flex items-center gap-0.5 text-xs font-semibold text-red-500">
              <TrendingDown className="size-3.5" />
              {delta}
            </span>
          )}
          {trend === "neutral" && result.mark_numeric != null && delta == null && (
            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
              <Minus className="size-3.5" />
              Primeiro resultado
            </span>
          )}
        </div>
      ),
    };
  });

  const levelBadge = LEVEL_BADGE[athlete.competitive_level as CompetitiveLevel];
  const statusBadge = STATUS_BADGE[athlete.status as AthleteStatus];
  const initials = getInitials(athlete.full_name);
  const avatarColor = getAvatarColor(athlete.full_name);
  const age = calculateAge(athlete.birth_date);

  const paralympicData = athlete.paralympic_classification as Record<string, string> | null;

  return (
    <div className="flex flex-col gap-6">
      {/* Back Navigation */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          render={<Link href="/athletes" />}
          className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2"
        >
          <ArrowLeft className="size-3.5" />
          Voltar para Atletas
        </Button>
      </div>

      {/* Premium Profile Header */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {/* Background gradient accent */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

        <div className="relative flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:gap-6">
          {/* Large Avatar */}
          <div className="relative shrink-0">
            <Avatar
              size="lg"
              className={cn(
                "size-20 ring-4 ring-background shadow-lg",
                "sm:size-24"
              )}
            >
              <AvatarFallback
                className={cn(
                  "text-2xl font-bold text-white sm:text-3xl",
                  avatarColor
                )}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            {athlete.is_paralympic && (
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow ring-2 ring-background">
                P
              </span>
            )}
          </div>

          {/* Name + Badges */}
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {athlete.full_name}
              </h1>
              {athlete.is_paralympic && (
                <Badge
                  variant="outline"
                  className="text-xs font-semibold border-primary/30 bg-primary/10 text-primary"
                >
                  Paralimpico
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="text-xs font-medium"
              >
                {getModalityName(athlete.primary_modality)}
              </Badge>
              <Badge
                variant="outline"
                className={cn("text-xs font-medium border", levelBadge.className)}
              >
                {levelBadge.label}
              </Badge>
              <Badge
                variant="outline"
                className={cn("text-xs font-medium border", statusBadge.className)}
              >
                {statusBadge.label}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground">
              {age} anos · {getStateName(athlete.state)}
              {athlete.city ? `, ${athlete.city}` : ""}
            </p>
          </div>

          {/* Edit Button */}
          <div className="shrink-0">
            <Button variant="outline" size="sm" className="gap-1.5">
              <PencilIcon className="size-3.5" />
              Editar
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <KpiCards athleteId={athlete.id} modalityCode={athlete.primary_modality} />

      {/* Tabs */}
      <Tabs defaultValue="personal">
        <TabsList>
          <TabsTrigger value="personal">Dados Pessoais</TabsTrigger>
          <TabsTrigger value="results">Resultados</TabsTrigger>
          <TabsTrigger value="history">Historico</TabsTrigger>
          <TabsTrigger value="assessments">Avaliacoes</TabsTrigger>
        </TabsList>

        {/* Personal Data Tab */}
        <TabsContent value="personal" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Personal Info Card */}
            <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2">
                <User className="size-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  Informacoes Pessoais
                </h3>
              </div>

              <div className="flex flex-col gap-3">
                <DataRow
                  label="Nome Completo"
                  value={athlete.full_name}
                />
                <DataRow
                  label="Data de Nascimento"
                  value={`${formatDate(athlete.birth_date)} (${age} anos)`}
                />
                <DataRow
                  label="Genero"
                  value={GENDER_LABELS[athlete.gender as Gender] ?? athlete.gender}
                />
                <DataRow
                  label="Estado"
                  value={getStateName(athlete.state)}
                />
                {athlete.city && (
                  <DataRow label="Cidade" value={athlete.city} />
                )}
              </div>
            </div>

            {/* Sports Info Card */}
            <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  Informacoes Esportivas
                </h3>
              </div>

              <div className="flex flex-col gap-3">
                <DataRow
                  label="Modalidade Principal"
                  value={getModalityName(athlete.primary_modality)}
                />
                {athlete.secondary_modalities && athlete.secondary_modalities.length > 0 && (
                  <DataRow
                    label="Modalidades Secundarias"
                    value={athlete.secondary_modalities.map(getModalityName).join(", ")}
                  />
                )}
                <DataRow
                  label="Nivel Competitivo"
                  value={levelBadge.label}
                />
                <DataRow
                  label="Status"
                  value={statusBadge.label}
                />
                <DataRow
                  label="Atleta Paralimpico"
                  value={athlete.is_paralympic ? "Sim" : "Nao"}
                />
              </div>
            </div>

            {/* Entity Card */}
            <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2">
                <Building2 className="size-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  Entidade Atual
                </h3>
              </div>

              {entityName ? (
                <div className="flex flex-col gap-3">
                  <DataRow label="Entidade" value={entityName} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Atleta nao esta vinculado a nenhuma entidade.
                </p>
              )}
            </div>

            {/* Paralympic Info Card — conditional */}
            {athlete.is_paralympic && (
              <div className="flex flex-col gap-4 rounded-xl border border-primary/20 bg-primary/5 p-5">
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-primary" />
                  <h3 className="text-sm font-semibold text-primary">
                    Informacoes Paralimpicas
                  </h3>
                </div>

                <div className="flex flex-col gap-3">
                  {paralympicData?.functional_class ? (
                    <DataRow
                      label="Classificacao Funcional"
                      value={paralympicData.functional_class}
                    />
                  ) : (
                    <DataRow
                      label="Classificacao Funcional"
                      value="Nao informado"
                    />
                  )}
                  {paralympicData?.disability_type ? (
                    <DataRow
                      label="Tipo de Deficiencia"
                      value={paralympicData.disability_type}
                    />
                  ) : (
                    <DataRow
                      label="Tipo de Deficiencia"
                      value="Nao informado"
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="mt-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {allResults.length === 0
                  ? "Nenhum resultado registrado"
                  : `${allResults.length} resultado${allResults.length !== 1 ? "s" : ""} em competicoes`}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border bg-muted/30">
                    <TableHead>Data</TableHead>
                    <TableHead>Competicao</TableHead>
                    <TableHead>Grau</TableHead>
                    <TableHead>Posicao</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead>Categoria</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedResults.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        Nenhum resultado registrado ainda.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedResults.map((result) => {
                      const gradeBadge = result.competitions?.grade
                        ? GRADE_BADGE[result.competitions.grade as CompetitiveLevel]
                        : null;

                      return (
                        <TableRow key={result.id}>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatShortDate(result.competitions?.date_start ?? null)}
                          </TableCell>
                          <TableCell>
                            {result.competitions ? (
                              <Link
                                href={`/competitions/${result.competitions.id}`}
                                className="font-medium text-foreground hover:text-primary transition-colors hover:underline underline-offset-4"
                              >
                                {result.competitions.name}
                              </Link>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {gradeBadge ? (
                              <Badge
                                variant="outline"
                                className={cn("text-xs font-medium border", gradeBadge.className)}
                              >
                                {gradeBadge.label}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {result.position != null ? `${result.position}º` : "—"}
                          </TableCell>
                          <TableCell>
                            {result.mark ? (
                              <span className="font-mono text-sm font-medium">
                                {result.mark}
                                {result.mark_unit && (
                                  <span className="ml-1 text-xs text-muted-foreground">
                                    {result.mark_unit}
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {result.category ? (
                              <Badge variant="outline" className="text-xs font-medium capitalize">
                                {result.category}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* Assessments Tab */}
        <TabsContent value="assessments" className="mt-4">
          <AssessmentsTab
            athleteId={athlete.id}
            modalityCode={athlete.primary_modality}
            isParalympic={athlete.is_paralympic ?? false}
            assessments={assessments}
          />
        </TabsContent>

        {/* History (Timeline) Tab */}
        <TabsContent value="history" className="mt-4">
          <div className="flex flex-col gap-4">
            {/* Year Filter */}
            {years.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Filtrar por ano:
                </span>
                <Link
                  href={`/athletes/${id}?#history`}
                  className={cn(
                    "rounded-lg px-3 py-1 text-xs font-medium transition-colors",
                    !yearFilter
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  Todos
                </Link>
                {years.map((y) => (
                  <Link
                    key={y}
                    href={`/athletes/${id}?year=${y}#history`}
                    className={cn(
                      "rounded-lg px-3 py-1 text-xs font-medium transition-colors",
                      yearFilter === String(y)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {y}
                  </Link>
                ))}
              </div>
            )}

            {/* Legend */}
            {allResults.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-[#009739]" />
                  Melhoria
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-red-500" />
                  Piora
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-[#0a1628]/20" />
                  Neutro / Primeiro resultado
                </span>
              </div>
            )}

            {/* Timeline */}
            <Timeline items={timelineItems} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}
