import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  MapPin,
  ChevronRight,
  ExternalLink,
  Pencil,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/roles";
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
import { MODALITIES } from "@/lib/constants/modalities";
import type { Entity, EntityType } from "@/types/database";
import { cn } from "@/lib/utils";

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

function getModalityName(code: string): string {
  const mod = MODALITIES.find((m) => m.code === code);
  return mod ? mod.name : code;
}

export default async function EntityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;

  const supabase = await createClient();

  // Fetch main entity
  const { data: entity, error } = await supabase
    .from("entities")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !entity) {
    notFound();
  }

  const typedEntity = entity as Entity;

  // Fetch parent entity (if any)
  let parentEntity: Entity | null = null;
  if (typedEntity.parent_entity_id) {
    const { data: parent } = await supabase
      .from("entities")
      .select("*")
      .eq("id", typedEntity.parent_entity_id)
      .single();
    if (parent) parentEntity = parent as Entity;
  }

  // Fetch child entities
  const { data: children } = await supabase
    .from("entities")
    .select("*")
    .eq("parent_entity_id", id)
    .order("name", { ascending: true });

  const childEntities = (children ?? []) as Entity[];

  return (
    <div className="flex flex-col gap-6">
      {/* Back navigation */}
      <div className="flex items-center gap-2">
        <Button
          render={<Link href="/entities" />}
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 rounded-xl text-xs text-[#0a1628]/50 hover:text-[#0a1628]"
        >
          <ArrowLeft className="size-3.5" />
          Entidades
        </Button>
        <ChevronRight className="size-3 text-[#0a1628]/20" />
        <span className="text-xs text-[#0a1628]/40 truncate max-w-[200px]">
          {typedEntity.name}
        </span>
      </div>

      {/* Entity header card */}
      <div className="rounded-2xl border border-[#0a1628]/[0.06] bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#009739]/10">
              <Building2 className="size-7 text-[#009739]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-extrabold tracking-tight text-[#0a1628]">
                  {typedEntity.name}
                </h1>
                <span
                  className={cn(
                    "inline-flex h-5 items-center rounded-full border px-2 text-xs font-medium",
                    ENTITY_TYPE_COLORS[typedEntity.type]
                  )}
                >
                  {ENTITY_TYPE_LABELS[typedEntity.type]}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 text-sm text-[#0a1628]/50">
                <MapPin className="size-3.5" />
                <span>
                  {typedEntity.city}, {typedEntity.state}
                </span>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 shrink-0 rounded-xl border-[#0a1628]/[0.08] gap-1.5 text-xs"
          >
            <Pencil className="size-3.5" />
            Editar
          </Button>
        </div>

        {/* Modalities */}
        {typedEntity.modalities.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#0a1628]/40">
              Modalidades
            </p>
            <div className="flex flex-wrap gap-1.5">
              {typedEntity.modalities.map((code) => (
                <Badge
                  key={code}
                  variant="outline"
                  className="h-6 gap-1.5 rounded-full px-2.5 text-xs font-medium text-[#0a1628]/60"
                >
                  <span className="font-mono text-[10px] text-[#0a1628]/40">
                    {code}
                  </span>
                  {getModalityName(code)}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Hierarchy section */}
      <div className="rounded-2xl border border-[#0a1628]/[0.06] bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-bold text-[#0a1628]">
          Hierarquia Institucional
        </h2>

        <div className="flex flex-col gap-2">
          {/* Parent entity */}
          {parentEntity ? (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0a1628]/[0.04]">
                <Building2 className="size-4 text-[#0a1628]/30" />
              </div>
              <div className="flex flex-1 items-center justify-between rounded-lg border border-[#0a1628]/[0.06] bg-[#0a1628]/[0.02] px-3 py-2">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-[#0a1628]/30">
                    Entidade Pai
                  </p>
                  <Link
                    href={`/entities/${parentEntity.id}`}
                    className="text-sm font-semibold text-[#0a1628] transition-colors hover:text-[#009739]"
                  >
                    {parentEntity.name}
                  </Link>
                </div>
                <span
                  className={cn(
                    "inline-flex h-5 items-center rounded-full border px-2 text-xs font-medium",
                    ENTITY_TYPE_COLORS[parentEntity.type]
                  )}
                >
                  {ENTITY_TYPE_LABELS[parentEntity.type]}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-[#0a1628]/[0.08] px-3 py-2 text-xs text-[#0a1628]/30">
              <Building2 className="size-3.5" />
              Entidade raiz (sem entidade pai)
            </div>
          )}

          {/* Arrow separator */}
          <div className="ml-4 h-4 w-px bg-[#0a1628]/[0.08]" />

          {/* Current entity */}
          <div className="flex items-center gap-2 rounded-xl border-2 border-[#009739]/20 bg-[#009739]/[0.03] px-3 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#009739]/10">
              <Building2 className="size-4 text-[#009739]" />
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-medium uppercase tracking-wider text-[#009739]/60">
                Entidade atual
              </p>
              <p className="text-sm font-bold text-[#0a1628]">
                {typedEntity.name}
              </p>
            </div>
            <span
              className={cn(
                "inline-flex h-5 items-center rounded-full border px-2 text-xs font-medium",
                ENTITY_TYPE_COLORS[typedEntity.type]
              )}
            >
              {ENTITY_TYPE_LABELS[typedEntity.type]}
            </span>
          </div>

          {/* Arrow separator (only if children exist) */}
          {childEntities.length > 0 && (
            <div className="ml-4 h-4 w-px bg-[#0a1628]/[0.08]" />
          )}
        </div>
      </div>

      {/* Child entities */}
      {childEntities.length > 0 && (
        <div className="rounded-2xl border border-[#0a1628]/[0.06] bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#0a1628]/[0.04]">
            <h2 className="text-sm font-bold text-[#0a1628]">
              Entidades Filhas
            </h2>
            <span className="text-xs font-medium text-[#0a1628]/40">
              {childEntities.length} entidade
              {childEntities.length !== 1 ? "s" : ""}
            </span>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="border-b border-[#0a1628]/[0.04] hover:bg-transparent">
                <TableHead className="pl-5 text-xs font-semibold uppercase tracking-wider text-[#0a1628]/40">
                  Nome
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#0a1628]/40">
                  Tipo
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#0a1628]/40">
                  Cidade
                </TableHead>
                <TableHead className="pr-5 text-right text-xs font-semibold uppercase tracking-wider text-[#0a1628]/40">
                  Acoes
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {childEntities.map((child) => (
                <TableRow
                  key={child.id}
                  className="border-b border-[#0a1628]/[0.04] hover:bg-[#0a1628]/[0.02]"
                >
                  <TableCell className="pl-5">
                    <Link
                      href={`/entities/${child.id}`}
                      className="font-semibold text-[#0a1628] transition-colors hover:text-[#009739]"
                    >
                      {child.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex h-5 items-center rounded-full border px-2 text-xs font-medium",
                        ENTITY_TYPE_COLORS[child.type]
                      )}
                    >
                      {ENTITY_TYPE_LABELS[child.type]}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-[#0a1628]/60">
                    {child.city}, {child.state}
                  </TableCell>
                  <TableCell className="pr-5 text-right">
                    <Button
                      render={<Link href={`/entities/${child.id}`} />}
                      variant="ghost"
                      size="xs"
                      className="gap-1 text-xs text-[#009739] hover:bg-[#009739]/10 hover:text-[#009739]"
                    >
                      Ver
                      <ExternalLink className="size-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* No children state */}
      {childEntities.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#0a1628]/[0.08] bg-white/50 p-6 text-center">
          <Building2 className="mx-auto size-8 text-[#0a1628]/15" />
          <p className="mt-2 text-sm font-medium text-[#0a1628]/30">
            Nenhuma entidade filha vinculada
          </p>
        </div>
      )}
    </div>
  );
}
