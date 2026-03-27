import Link from "next/link";
import { redirect } from "next/navigation";
import { Users, ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/roles";
import { MODALITIES } from "@/lib/constants/modalities";
import { BRAZILIAN_STATES } from "@/lib/constants/states";
import type { Athlete, CompetitiveLevel, AthleteStatus } from "@/types/database";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AthleteFilters } from "./athlete-filters";
import { CreateAthleteDialog } from "./create-athlete-dialog";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;

const LEVEL_BADGE: Record<CompetitiveLevel, { label: string; className: string }> = {
  school: { label: "Base Escolar", className: "bg-muted text-muted-foreground border-border" },
  state: { label: "Estadual", className: "bg-blue-100 text-blue-700 border-blue-200" },
  national: { label: "Nacional", className: "bg-green-100 text-green-700 border-green-200" },
  elite: { label: "Alto Rendimento", className: "bg-amber-100 text-amber-700 border-amber-200" },
};

const STATUS_BADGE: Record<AthleteStatus, { label: string; className: string }> = {
  active: { label: "Ativo", className: "bg-green-100 text-green-700 border-green-200" },
  inactive: { label: "Inativo", className: "bg-muted text-muted-foreground border-border" },
  retired: { label: "Aposentado", className: "bg-orange-100 text-orange-700 border-orange-200" },
};

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

interface AthletesPageProps {
  searchParams: Promise<{
    search?: string;
    modality?: string;
    level?: string;
    state?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function AthletesPage({ searchParams }: AthletesPageProps) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const search = params.search ?? "";
  const modality = params.modality ?? "";
  const level = params.level ?? "";
  const state = params.state ?? "";
  const status = params.status ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  const supabase = await createClient();

  let query = supabase
    .from("athletes")
    .select("*", { count: "exact" })
    .order("full_name", { ascending: true })
    .range(offset, offset + PAGE_SIZE - 1);

  if (search) {
    query = query.ilike("full_name", `%${search}%`);
  }
  if (modality) {
    query = query.eq("primary_modality", modality);
  }
  if (level) {
    query = query.eq("competitive_level", level);
  }
  if (state) {
    query = query.eq("state", state);
  }
  if (status) {
    query = query.eq("status", status);
  }

  const { data: athletes, count, error } = await query;

  if (error) {
    console.error("Error fetching athletes:", error);
  }

  const totalCount = count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const athleteList: Athlete[] = athletes ?? [];

  const buildPageUrl = (p: number) => {
    const sp = new URLSearchParams();
    if (search) sp.set("search", search);
    if (modality) sp.set("modality", modality);
    if (level) sp.set("level", level);
    if (state) sp.set("state", state);
    if (status) sp.set("status", status);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return `/athletes${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Users className="size-4 text-primary" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Atletas
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {totalCount === 0
              ? "Nenhum atleta cadastrado"
              : `${totalCount} atleta${totalCount !== 1 ? "s" : ""} cadastrado${totalCount !== 1 ? "s" : ""}`}
          </p>
        </div>
        <CreateAthleteDialog />
      </div>

      {/* Filters + Export */}
      <div className="flex items-start justify-between gap-3">
        <AthleteFilters />
        <ExportButton
          data={athleteList.map((a) => ({
            nome: a.full_name,
            modalidade: getModalityName(a.primary_modality),
            nivel: LEVEL_BADGE[a.competitive_level]?.label ?? a.competitive_level,
            estado: getStateName(a.state),
            entidade: a.current_entity_id ?? "",
            status: STATUS_BADGE[a.status]?.label ?? a.status,
          }))}
          filename="atletas"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border bg-muted/30">
              <TableHead className="w-10 pl-4" />
              <TableHead>Nome</TableHead>
              <TableHead>Modalidade</TableHead>
              <TableHead>Nivel</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {athleteList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  {search || modality || level || state || status
                    ? "Nenhum atleta encontrado com os filtros aplicados."
                    : "Nenhum atleta cadastrado ainda. Clique em \"Novo Atleta\" para comecar."}
                </TableCell>
              </TableRow>
            ) : (
              athleteList.map((athlete) => {
                const levelBadge = LEVEL_BADGE[athlete.competitive_level];
                const statusBadge = STATUS_BADGE[athlete.status];
                const initials = getInitials(athlete.full_name);
                const avatarColor = getAvatarColor(athlete.full_name);

                return (
                  <TableRow key={athlete.id} className="group">
                    {/* Avatar */}
                    <TableCell className="pl-4">
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
                    </TableCell>

                    {/* Name (linked) */}
                    <TableCell>
                      <Link
                        href={`/athletes/${athlete.id}`}
                        className="font-medium text-foreground hover:text-primary transition-colors hover:underline underline-offset-4"
                      >
                        {athlete.full_name}
                      </Link>
                      {athlete.is_paralympic && (
                        <span className="ml-2 text-xs text-primary font-medium">
                          Para
                        </span>
                      )}
                    </TableCell>

                    {/* Modality */}
                    <TableCell className="text-muted-foreground">
                      {getModalityName(athlete.primary_modality)}
                    </TableCell>

                    {/* Level Badge */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("text-xs font-medium border", levelBadge.className)}
                      >
                        {levelBadge.label}
                      </Badge>
                    </TableCell>

                    {/* State */}
                    <TableCell className="text-muted-foreground">
                      {getStateName(athlete.state)}
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("text-xs font-medium border", statusBadge.className)}
                      >
                        {statusBadge.label}
                      </Badge>
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
