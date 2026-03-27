import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Medal, MapPin, Calendar, Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/roles";
import { MODALITIES } from "@/lib/constants/modalities";
import { BRAZILIAN_STATES } from "@/lib/constants/states";
import type { Competition, CompetitiveLevel, Athlete } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddResultDialog } from "./add-result-dialog";
import { cn } from "@/lib/utils";

const GRADE_BADGE: Record<CompetitiveLevel, { label: string; className: string }> = {
  school: { label: "Base Escolar", className: "bg-muted text-muted-foreground border-border" },
  state: { label: "Estadual", className: "bg-blue-100 text-blue-700 border-blue-200" },
  national: { label: "Nacional", className: "bg-green-100 text-green-700 border-green-200" },
  elite: { label: "Elite", className: "bg-amber-100 text-amber-700 border-amber-200" },
};

function getModalityName(code: string): string {
  return MODALITIES.find((m) => m.code === code)?.name ?? code;
}

function getStateName(uf: string): string {
  return BRAZILIAN_STATES.find((s) => s.uf === uf)?.name ?? uf;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
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

interface CompetitionDetailPageProps {
  params: Promise<{ id: string }>;
}

interface ResultWithAthlete {
  id: string;
  athlete_id: string;
  competition_id: string;
  position: number | null;
  mark: string | null;
  mark_numeric: number | null;
  mark_unit: string | null;
  category: string | null;
  notes: string | null;
  created_at: string;
  athletes: Pick<Athlete, "id" | "full_name" | "primary_modality"> | null;
}

export default async function CompetitionDetailPage({ params }: CompetitionDetailPageProps) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const supabase = await createClient();

  const { data: competition, error } = await supabase
    .from("competitions")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !competition) {
    notFound();
  }

  const comp = competition as Competition;

  // Fetch organizer name
  let organizerName: string | null = null;
  if (comp.organizing_entity_id) {
    const { data: entity } = await supabase
      .from("entities")
      .select("name")
      .eq("id", comp.organizing_entity_id)
      .single();
    organizerName = entity?.name ?? null;
  }

  // Fetch results with athlete info
  const { data: results } = await supabase
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
      notes,
      created_at,
      athletes (
        id,
        full_name,
        primary_modality
      )
    `)
    .eq("competition_id", id)
    .order("position", { ascending: true });

  const resultList: ResultWithAthlete[] = (results ?? []) as unknown as ResultWithAthlete[];
  const gradeBadge = comp.grade ? GRADE_BADGE[comp.grade as CompetitiveLevel] : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Back Navigation */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          render={<Link href="/competitions" />}
          className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2"
        >
          <ArrowLeft className="size-3.5" />
          Voltar para Competicoes
        </Button>
      </div>

      {/* Competition Header Card */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

        <div className="relative flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:gap-6">
          {/* Icon */}
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Medal className="size-7 text-primary" />
          </div>

          {/* Info */}
          <div className="flex flex-1 flex-col gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {comp.name}
            </h1>

            <div className="flex flex-wrap items-center gap-2">
              {gradeBadge && (
                <Badge
                  variant="outline"
                  className={cn("text-xs font-medium border", gradeBadge.className)}
                >
                  {gradeBadge.label}
                </Badge>
              )}
              {comp.modality_code && (
                <Badge variant="outline" className="text-xs font-medium font-mono">
                  {comp.modality_code} · {getModalityName(comp.modality_code)}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {comp.date_start && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="size-3.5" />
                  {formatDate(comp.date_start)}
                  {comp.date_end && comp.date_end !== comp.date_start && (
                    <> — {formatDate(comp.date_end)}</>
                  )}
                </span>
              )}
              {comp.location_state && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3.5" />
                  {comp.location_city ? `${comp.location_city}, ` : ""}
                  {getStateName(comp.location_state)}
                </span>
              )}
              {organizerName && (
                <span className="flex items-center gap-1.5">
                  <Building2 className="size-3.5" />
                  {organizerName}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-base font-semibold text-foreground">
              Resultados
            </h2>
            <p className="text-sm text-muted-foreground">
              {resultList.length === 0
                ? "Nenhum resultado registrado"
                : `${resultList.length} resultado${resultList.length !== 1 ? "s" : ""} registrado${resultList.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <AddResultDialog competitionId={id} />
        </div>

        {/* Results Table */}
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border bg-muted/30">
                <TableHead className="w-16">Posicao</TableHead>
                <TableHead>Atleta</TableHead>
                <TableHead>Modalidade</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Categoria</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resultList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    Nenhum resultado registrado ainda. Clique em &quot;Adicionar Resultado&quot; para comecar.
                  </TableCell>
                </TableRow>
              ) : (
                resultList.map((result) => (
                  <TableRow key={result.id} className="group">
                    {/* Position */}
                    <TableCell>
                      {result.position != null ? (
                        <span
                          className={cn(
                            "inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                            result.position === 1
                              ? "bg-amber-100 text-amber-700"
                              : result.position === 2
                              ? "bg-slate-100 text-slate-600"
                              : result.position === 3
                              ? "bg-orange-100 text-orange-700"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {result.position}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Athlete */}
                    <TableCell>
                      {result.athletes ? (
                        <Link
                          href={`/athletes/${result.athletes.id}`}
                          className="font-medium text-foreground hover:text-primary transition-colors hover:underline underline-offset-4"
                        >
                          {result.athletes.full_name}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Modality */}
                    <TableCell className="text-muted-foreground text-sm">
                      {result.athletes?.primary_modality
                        ? getModalityName(result.athletes.primary_modality)
                        : "—"}
                    </TableCell>

                    {/* Mark */}
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

                    {/* Category */}
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
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
