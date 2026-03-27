"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClipboardList } from "lucide-react";
import { CreateAssessmentDialog } from "./create-assessment-dialog";
import { AssessmentCharts } from "./assessment-charts";

interface Metric {
  name: string;
  value: number;
  unit: string;
}

interface Assessment {
  id: string;
  athlete_id: string;
  assessment_date: string;
  modality_code: string;
  protocol: string;
  metrics: Record<string, unknown>;
  evaluator_id: string | null;
  entity_id: string | null;
  created_at: string;
}

interface AssessmentsTabProps {
  athleteId: string;
  modalityCode: string;
  isParalympic: boolean;
  assessments: Assessment[];
}

function formatAssessmentDate(dateStr: string): string {
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

function parseMetrics(metrics: Record<string, unknown>): Metric[] {
  if (!metrics || typeof metrics !== "object") return [];
  return Object.entries(metrics)
    .filter(([, v]) => v !== null && v !== undefined && (v as { value?: unknown }).value !== undefined)
    .map(([name, v]) => {
      const entry = v as { value: number; unit: string };
      return { name, value: entry.value, unit: entry.unit ?? "" };
    })
    .filter((m) => m.value !== null && m.value !== undefined);
}

export function AssessmentsTab({
  athleteId,
  modalityCode,
  isParalympic,
  assessments,
}: AssessmentsTabProps) {
  const [filterProtocol, setFilterProtocol] = useState<string>("all");

  // Build unique protocol list for filter
  const protocols = Array.from(new Set(assessments.map((a) => a.protocol).filter(Boolean)));

  const filtered =
    filterProtocol === "all"
      ? assessments
      : assessments.filter((a) => a.protocol === filterProtocol);

  return (
    <div className="flex flex-col gap-6">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="size-4 text-[#009739]" />
          <span className="text-sm font-semibold text-[#0a1628]">
            {assessments.length} avaliacao{assessments.length !== 1 ? "s" : ""} registrada
            {assessments.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Protocol filter */}
          {protocols.length > 1 && (
            <Select
              value={filterProtocol}
              onValueChange={(v) => setFilterProtocol(v ?? "all")}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por protocolo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os protocolos</SelectItem>
                {protocols.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <CreateAssessmentDialog
            athleteId={athleteId}
            modalityCode={modalityCode}
            isParalympic={isParalympic}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#0a1628]/[0.06] bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-[#0a1628]/[0.06] bg-[#0a1628]/[0.02] hover:bg-transparent">
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#0a1628]/40 pl-5">
                Data
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#0a1628]/40">
                Protocolo
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#0a1628]/40">
                Metricas
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#0a1628]/40 pr-5">
                Avaliador
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-[#0a1628]/40">
                  {assessments.length === 0
                    ? "Nenhuma avaliacao registrada ainda."
                    : "Nenhuma avaliacao para este protocolo."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((assessment) => {
                const metrics = parseMetrics(assessment.metrics);
                const previewMetrics = metrics.slice(0, 3);

                return (
                  <TableRow
                    key={assessment.id}
                    className="border-b border-[#0a1628]/[0.04] hover:bg-[#0a1628]/[0.02]"
                  >
                    <TableCell className="pl-5 font-mono text-sm text-[#0a1628]/70">
                      {formatAssessmentDate(assessment.assessment_date)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="text-xs font-medium border-[#009739]/30 bg-[#009739]/5 text-[#009739]"
                      >
                        {assessment.protocol}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {previewMetrics.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {previewMetrics.map((m) => (
                            <span
                              key={m.name}
                              className="inline-flex items-center gap-1 rounded-md border border-[#0a1628]/[0.08] bg-[#0a1628]/[0.02] px-2 py-0.5 text-xs"
                            >
                              <span className="text-[#0a1628]/50">{m.name}:</span>
                              <span className="font-mono font-medium text-[#0a1628]">
                                {m.value}
                                {m.unit && (
                                  <span className="ml-0.5 text-[#0a1628]/40">{m.unit}</span>
                                )}
                              </span>
                            </span>
                          ))}
                          {metrics.length > 3 && (
                            <span className="text-xs text-[#0a1628]/40">
                              +{metrics.length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[#0a1628]/30">—</span>
                      )}
                    </TableCell>
                    <TableCell className="pr-5 text-sm text-[#0a1628]/50">
                      {assessment.evaluator_id ?? "—"}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Charts */}
      {assessments.length >= 2 && (
        <AssessmentCharts assessments={assessments} />
      )}
    </div>
  );
}
