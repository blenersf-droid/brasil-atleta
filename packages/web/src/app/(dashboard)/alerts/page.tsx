import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, TrendingUp, Star, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/roles";
import { Badge } from "@/components/ui/badge";
import { AlertFilters } from "./alert-filters";
import { GenerateAlertsAction } from "./generate-alerts-action";
import { MarkReadButton } from "./mark-read-button";
import type { AlertType, AlertSeverity } from "@/types/database";

// ── Type helpers ───────────────────────────────────────────────────────────────

const ALERT_TYPE_CONFIG: Record<
  AlertType,
  { label: string; icon: React.ElementType; iconClass: string; badgeClass: string }
> = {
  progression_spike: {
    label: "Progressão",
    icon: TrendingUp,
    iconClass: "text-green-600",
    badgeClass: "bg-green-50 text-green-700 border-green-200",
  },
  talent_detected: {
    label: "Talento",
    icon: Star,
    iconClass: "text-blue-600",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  dropout_risk: {
    label: "Risco de Evasão",
    icon: AlertTriangle,
    iconClass: "text-red-600",
    badgeClass: "bg-red-50 text-red-700 border-red-200",
  },
};

const SEVERITY_CONFIG: Record<
  AlertSeverity,
  { label: string; badgeClass: string }
> = {
  low: { label: "Baixa", badgeClass: "bg-slate-100 text-slate-600 border-slate-200" },
  medium: { label: "Média", badgeClass: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  high: { label: "Alta", badgeClass: "bg-red-50 text-red-700 border-red-200" },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ── Page ──────────────────────────────────────────────────────────────────────

interface AlertsPageProps {
  searchParams: Promise<{
    type?: string;
    severity?: string;
  }>;
}

interface AlertRow {
  id: string;
  athlete_id: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  description: string | null;
  is_read: boolean;
  created_at: string;
  athletes: {
    id: string;
    full_name: string;
  } | null;
}

export default async function AlertsPage({ searchParams }: AlertsPageProps) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const typeFilter = params.type as AlertType | undefined;
  const severityFilter = params.severity as AlertSeverity | undefined;

  const supabase = await createClient();

  // ── Query alerts with athlete join ───────────────────────────────────────────
  let query = supabase
    .from("scouting_alerts")
    .select(
      `
      id,
      athlete_id,
      alert_type,
      severity,
      description,
      is_read,
      created_at,
      athletes (
        id,
        full_name
      )
    `
    )
    .order("created_at", { ascending: false });

  if (typeFilter) {
    query = query.eq("alert_type", typeFilter);
  }
  if (severityFilter) {
    query = query.eq("severity", severityFilter);
  }

  const { data: alerts, error } = await query;

  if (error) {
    console.error("Error fetching scouting alerts:", error);
  }

  const rows = (alerts ?? []) as unknown as AlertRow[];
  const unreadCount = rows.filter((a) => !a.is_read).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#009739]/10">
            <Bell className="size-5 text-[#009739]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-[#0a1628]">
                Alertas de Scouting
              </h1>
              {unreadCount > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </div>
            <p className="text-xs text-[#0a1628]/40">
              {unreadCount} não lido{unreadCount !== 1 ? "s" : ""} · {rows.length} total
            </p>
          </div>
        </div>
        <GenerateAlertsAction />
      </div>

      {/* Filters */}
      <AlertFilters currentType={typeFilter} currentSeverity={severityFilter} />

      {/* Alert list */}
      <div className="rounded-2xl border border-[#0a1628]/[0.06] bg-white shadow-sm overflow-hidden">
        <div className="border-b border-[#0a1628]/[0.06] px-5 py-3">
          <p className="text-sm font-semibold text-[#0a1628]">
            {rows.length} alerta{rows.length !== 1 ? "s" : ""} encontrado{rows.length !== 1 ? "s" : ""}
          </p>
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <Bell className="size-10 text-[#0a1628]/15" />
            <p className="text-sm font-medium text-[#0a1628]/40">
              Nenhum alerta encontrado
            </p>
            <p className="text-xs text-[#0a1628]/30">
              Ajuste os filtros ou gere novos alertas.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[#0a1628]/[0.04]">
            {rows.map((alert) => {
              const typeConfig = ALERT_TYPE_CONFIG[alert.alert_type];
              const severityConfig = SEVERITY_CONFIG[alert.severity];
              const Icon = typeConfig.icon;
              const athleteName = alert.athletes?.full_name ?? "Atleta desconhecido";
              const athleteId = alert.athlete_id;

              return (
                <li
                  key={alert.id}
                  className={`flex items-start gap-4 px-5 py-4 transition-colors ${
                    alert.is_read
                      ? "bg-white"
                      : "bg-[#009739]/[0.02] border-l-2 border-l-[#009739]"
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      alert.alert_type === "progression_spike"
                        ? "bg-green-50"
                        : alert.alert_type === "talent_detected"
                        ? "bg-blue-50"
                        : "bg-red-50"
                    }`}
                  >
                    <Icon className={`size-4 ${typeConfig.iconClass}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Badge
                        variant="outline"
                        className={`text-xs font-medium border ${typeConfig.badgeClass}`}
                      >
                        {typeConfig.label}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-xs font-medium border ${severityConfig.badgeClass}`}
                      >
                        {severityConfig.label}
                      </Badge>
                      {!alert.is_read && (
                        <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[#009739]" />
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 mb-1">
                      <Link
                        href={`/athletes/${athleteId}`}
                        className="text-sm font-semibold text-[#0a1628] transition-colors hover:text-[#009739] hover:underline underline-offset-4"
                      >
                        {athleteName}
                      </Link>
                    </div>

                    {alert.description && (
                      <p className="text-xs text-[#0a1628]/60 line-clamp-2">
                        {alert.description}
                      </p>
                    )}

                    <p className="mt-1 text-[10px] text-[#0a1628]/30">
                      {formatDate(alert.created_at)}
                    </p>
                  </div>

                  {/* Action */}
                  {!alert.is_read && (
                    <div className="shrink-0">
                      <MarkReadButton alertId={alert.id} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
