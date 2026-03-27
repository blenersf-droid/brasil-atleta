import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight, Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/roles";
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
import { EntityFilters } from "./entity-filters";
import { CreateEntityDialog } from "./create-entity-dialog";
import type { Entity, EntityType } from "@/types/database";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  school: "Escola",
  club: "Clube",
  training_center: "Centro de Treinamento",
  federation: "Federacao",
  confederation: "Confederacao",
  committee: "Comite",
};

const ENTITY_TYPE_COLORS: Record<EntityType, string> = {
  club: "bg-[#009739]/10 text-[#009739] border-[#009739]/20",
  federation: "bg-blue-50 text-blue-700 border-blue-200",
  confederation: "bg-purple-50 text-purple-700 border-purple-200",
  school: "bg-yellow-50 text-yellow-700 border-yellow-200",
  training_center: "bg-orange-50 text-orange-700 border-orange-200",
  committee: "bg-red-50 text-red-700 border-red-200",
};

interface SearchParams {
  search?: string;
  type?: string;
  state?: string;
  page?: string;
}

export default async function EntitiesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const search = params.search ?? "";
  const typeFilter = params.type ?? "";
  const stateFilter = params.state ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  const supabase = await createClient();

  let query = supabase
    .from("entities")
    .select("*", { count: "exact" })
    .order("name", { ascending: true })
    .range(offset, offset + PAGE_SIZE - 1);

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }
  if (typeFilter && typeFilter !== "all") {
    query = query.eq("type", typeFilter);
  }
  if (stateFilter && stateFilter !== "all") {
    query = query.eq("state", stateFilter);
  }

  const { data: entities, count, error } = await query;

  const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 1;
  const entityList = (entities ?? []) as Entity[];

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#009739]/10">
            <Building2 className="size-5 text-[#009739]" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-[#0a1628]">
              Entidades Esportivas
            </h1>
            <p className="text-xs text-[#0a1628]/40">
              {count ?? 0} entidade{(count ?? 0) !== 1 ? "s" : ""} encontrada
              {(count ?? 0) !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <CreateEntityDialog />
      </div>

      {/* Filters */}
      <EntityFilters />

      {/* Table */}
      <div className="rounded-2xl border border-[#0a1628]/[0.06] bg-white shadow-sm overflow-hidden">
        {error ? (
          <div className="flex items-center justify-center py-16 text-sm text-[#0a1628]/40">
            Erro ao carregar entidades. Tente novamente.
          </div>
        ) : entityList.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <Building2 className="size-10 text-[#0a1628]/15" />
            <p className="text-sm font-medium text-[#0a1628]/40">
              Nenhuma entidade encontrada
            </p>
            {(search || typeFilter || stateFilter) && (
              <p className="text-xs text-[#0a1628]/30">
                Tente ajustar os filtros de busca
              </p>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-b border-[#0a1628]/[0.06] hover:bg-transparent">
                <TableHead className="pl-4 text-xs font-semibold uppercase tracking-wider text-[#0a1628]/40">
                  Nome
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#0a1628]/40">
                  Tipo
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#0a1628]/40">
                  Estado
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#0a1628]/40">
                  Cidade
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#0a1628]/40">
                  Modalidades
                </TableHead>
                <TableHead className="pr-4 text-right text-xs font-semibold uppercase tracking-wider text-[#0a1628]/40">
                  Acoes
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entityList.map((entity) => (
                <TableRow
                  key={entity.id}
                  className="border-b border-[#0a1628]/[0.04] transition-colors hover:bg-[#0a1628]/[0.02]"
                >
                  <TableCell className="pl-4">
                    <Link
                      href={`/entities/${entity.id}`}
                      className="font-semibold text-[#0a1628] transition-colors hover:text-[#009739]"
                    >
                      {entity.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex h-5 items-center rounded-full border px-2 text-xs font-medium",
                        ENTITY_TYPE_COLORS[entity.type]
                      )}
                    >
                      {ENTITY_TYPE_LABELS[entity.type]}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm text-[#0a1628]/70">
                      {entity.state}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-[#0a1628]/60">
                    {entity.city}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {entity.modalities.slice(0, 3).map((mod) => (
                        <Badge
                          key={mod}
                          variant="outline"
                          className="h-4 px-1.5 font-mono text-[10px] text-[#0a1628]/50"
                        >
                          {mod}
                        </Badge>
                      ))}
                      {entity.modalities.length > 3 && (
                        <Badge
                          variant="outline"
                          className="h-4 px-1.5 text-[10px] text-[#0a1628]/40"
                        >
                          +{entity.modalities.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <Button
                      render={<Link href={`/entities/${entity.id}`} />}
                      variant="ghost"
                      size="xs"
                      className="text-xs text-[#009739] hover:bg-[#009739]/10 hover:text-[#009739]"
                    >
                      Ver detalhes
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-[#0a1628]/40">
            Pagina {page} de {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              render={
                page > 1
                  ? <Link
                      href={`/entities?${new URLSearchParams({
                        ...(search ? { search } : {}),
                        ...(typeFilter ? { type: typeFilter } : {}),
                        ...(stateFilter ? { state: stateFilter } : {}),
                        page: String(page - 1),
                      }).toString()}`}
                    />
                  : undefined
              }
              variant="outline"
              size="sm"
              disabled={page <= 1}
              className="h-8 rounded-xl border-[#0a1628]/[0.08] gap-1"
            >
              <ChevronLeft className="size-3.5" />
              Anterior
            </Button>
            <Button
              render={
                page < totalPages
                  ? <Link
                      href={`/entities?${new URLSearchParams({
                        ...(search ? { search } : {}),
                        ...(typeFilter ? { type: typeFilter } : {}),
                        ...(stateFilter ? { state: stateFilter } : {}),
                        page: String(page + 1),
                      }).toString()}`}
                    />
                  : undefined
              }
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              className="h-8 rounded-xl border-[#0a1628]/[0.08] gap-1"
            >
              Proxima
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
