import Link from "next/link";
import { redirect } from "next/navigation";
import { Medal, ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/roles";
import { MODALITIES } from "@/lib/constants/modalities";
import { BRAZILIAN_STATES } from "@/lib/constants/states";
import type { Competition, CompetitiveLevel, Entity } from "@/types/database";
import { ExportButton } from "@/components/export/export-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CompetitionFilters } from "./competition-filters";
import { CreateCompetitionDialog } from "./create-competition-dialog";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

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
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

interface CompetitionsPageProps {
  searchParams: Promise<{
    search?: string;
    grade?: string;
    modality?: string;
    state?: string;
    page?: string;
  }>;
}

export default async function CompetitionsPage({ searchParams }: CompetitionsPageProps) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const search = params.search ?? "";
  const grade = params.grade ?? "";
  const modality = params.modality ?? "";
  const state = params.state ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  const supabase = await createClient();

  let query = supabase
    .from("competitions")
    .select("*", { count: "exact" })
    .order("date_start", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }
  if (grade) {
    query = query.eq("grade", grade);
  }
  if (modality) {
    query = query.eq("modality_code", modality);
  }
  if (state) {
    query = query.eq("location_state", state);
  }

  const { data: competitions, count, error } = await query;

  if (error) {
    console.error("Error fetching competitions:", error);
  }

  const totalCount = count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const competitionList: Competition[] = competitions ?? [];

  // Fetch organizer names for competitions that have one
  const entityIds = competitionList
    .map((c) => c.organizing_entity_id)
    .filter((id): id is string => !!id);

  let entityMap: Record<string, string> = {};
  if (entityIds.length > 0) {
    const { data: entities } = await supabase
      .from("entities")
      .select("id, name")
      .in("id", entityIds);
    if (entities) {
      entityMap = Object.fromEntries(
        (entities as Pick<Entity, "id" | "name">[]).map((e) => [e.id, e.name])
      );
    }
  }

  const buildPageUrl = (p: number) => {
    const sp = new URLSearchParams();
    if (search) sp.set("search", search);
    if (grade) sp.set("grade", grade);
    if (modality) sp.set("modality", modality);
    if (state) sp.set("state", state);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return `/competitions${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Medal className="size-4 text-primary" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Competicoes
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {totalCount === 0
              ? "Nenhuma competicao cadastrada"
              : `${totalCount} competicao${totalCount !== 1 ? "s" : ""} cadastrada${totalCount !== 1 ? "s" : ""}`}
          </p>
        </div>
        <CreateCompetitionDialog />
      </div>

      {/* Filters + Export */}
      <div className="flex items-start justify-between gap-3">
        <CompetitionFilters />
        <ExportButton
          data={competitionList.map((c) => ({
            nome: c.name,
            data: formatDate(c.date_start),
            grau: GRADE_BADGE[c.grade as CompetitiveLevel]?.label ?? c.grade,
            modalidade: getModalityName(c.modality_code ?? ""),
            local: c.location_state
              ? `${getStateName(c.location_state)}, ${c.location_city ?? ""}`
              : "",
          }))}
          filename="competicoes"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border bg-muted/30">
              <TableHead>Nome</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Local</TableHead>
              <TableHead>Grau</TableHead>
              <TableHead>Modalidade</TableHead>
              <TableHead>Organizador</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {competitionList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  {search || grade || modality || state
                    ? "Nenhuma competicao encontrada com os filtros aplicados."
                    : "Nenhuma competicao cadastrada ainda. Clique em \"Nova Competicao\" para comecar."}
                </TableCell>
              </TableRow>
            ) : (
              competitionList.map((competition) => {
                const gradeBadge = GRADE_BADGE[competition.grade as CompetitiveLevel];
                const organizerName = competition.organizing_entity_id
                  ? entityMap[competition.organizing_entity_id] ?? "—"
                  : "—";

                return (
                  <TableRow key={competition.id} className="group">
                    {/* Name (linked) */}
                    <TableCell>
                      <Link
                        href={`/competitions/${competition.id}`}
                        className="font-medium text-foreground hover:text-primary transition-colors hover:underline underline-offset-4"
                      >
                        {competition.name}
                      </Link>
                    </TableCell>

                    {/* Date */}
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(competition.date_start)}
                      {competition.date_end && competition.date_end !== competition.date_start && (
                        <span className="text-muted-foreground/60"> — {formatDate(competition.date_end)}</span>
                      )}
                    </TableCell>

                    {/* Location */}
                    <TableCell className="text-muted-foreground text-sm">
                      {competition.location_state
                        ? `${getStateName(competition.location_state)}, ${competition.location_city ?? ""}`
                        : "—"}
                    </TableCell>

                    {/* Grade Badge */}
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

                    {/* Modality Badge */}
                    <TableCell>
                      {competition.modality_code ? (
                        <Badge variant="outline" className="text-xs font-medium font-mono">
                          {competition.modality_code}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Organizer */}
                    <TableCell className="text-muted-foreground text-sm">
                      {organizerName}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            Pagina {page} de {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              render={page > 1 ? <Link href={buildPageUrl(page - 1)} /> : undefined}
              disabled={page <= 1}
              aria-label="Pagina anterior"
            >
              <ChevronLeft className="size-4" />
            </Button>

            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = i + 1;
              return (
                <Button
                  key={p}
                  variant={p === page ? "default" : "outline"}
                  size="icon-sm"
                  render={<Link href={buildPageUrl(p)} />}
                  aria-current={p === page ? "page" : undefined}
                >
                  {p}
                </Button>
              );
            })}

            <Button
              variant="outline"
              size="icon-sm"
              render={page < totalPages ? <Link href={buildPageUrl(page + 1)} /> : undefined}
              disabled={page >= totalPages}
              aria-label="Proxima pagina"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
