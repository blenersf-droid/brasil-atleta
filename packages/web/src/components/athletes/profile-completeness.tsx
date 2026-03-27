"use client";

import { CheckCircle2, Circle, ChevronRight } from "lucide-react";

interface ProfileCompletenessProps {
  hasPhoto: boolean;
  hasBio: boolean;
  hasModality: boolean;
  hasCompetition: boolean;
  hasResult: boolean;
  hasAssessment: boolean;
  hasAchievement: boolean;
}

interface CompletenessItem {
  key: keyof ProfileCompletenessProps;
  label: string;
  weight: number;
  tip: string;
  action: string;
}

const ITEMS: CompletenessItem[] = [
  {
    key: "hasPhoto",
    label: "Foto de perfil",
    weight: 15,
    tip: "Perfis com foto recebem 3x mais visualizacoes de scouts",
    action: "Adicionar foto nas configuracoes",
  },
  {
    key: "hasBio",
    label: "Bio / apresentacao",
    weight: 10,
    tip: "Conte sua historia — scouts querem conhecer o atleta por tras dos numeros",
    action: "Adicionar bio nas configuracoes",
  },
  {
    key: "hasModality",
    label: "Modalidade definida",
    weight: 10,
    tip: "Scouts filtram por modalidade — seja encontrado pelos certos",
    action: "Verificar dados pessoais",
  },
  {
    key: "hasCompetition",
    label: "Ao menos 1 competicao",
    weight: 20,
    tip: "Historico competitivo e o principal criterio de busca de scouts",
    action: "Adicionar competicao na aba Resultados",
  },
  {
    key: "hasResult",
    label: "Ao menos 1 resultado",
    weight: 20,
    tip: "Resultados concretos aumentam em 5x suas chances de ser contactado",
    action: "Adicionar resultado na aba Resultados",
  },
  {
    key: "hasAssessment",
    label: "Ao menos 1 avaliacao fisica",
    weight: 15,
    tip: "Dados fisicos provam sua preparacao — diferencial para clubes profissionais",
    action: "Adicionar avaliacao na aba Avaliacoes",
  },
  {
    key: "hasAchievement",
    label: "Ao menos 1 conquista",
    weight: 10,
    tip: "Titulos e medalhas destacam seu perfil na busca de talentos",
    action: "Registrar conquista na secao Conquistas",
  },
];

function getGradientColor(percent: number): string {
  if (percent < 30) return "#ef4444";
  if (percent < 50) return "#f97316";
  if (percent < 70) return "#eab308";
  if (percent < 90) return "#84cc16";
  return "#22c55e";
}

function getProgressLabel(percent: number): string {
  if (percent < 30) return "Iniciando sua jornada";
  if (percent < 50) return "Perfil em construcao";
  if (percent < 70) return "Bom progresso!";
  if (percent < 90) return "Quase la!";
  return "Perfil completo!";
}

export function ProfileCompleteness({
  hasPhoto,
  hasBio,
  hasModality,
  hasCompetition,
  hasResult,
  hasAssessment,
  hasAchievement,
}: ProfileCompletenessProps) {
  const values: ProfileCompletenessProps = {
    hasPhoto,
    hasBio,
    hasModality,
    hasCompetition,
    hasResult,
    hasAssessment,
    hasAchievement,
  };

  const percent = ITEMS.reduce((acc, item) => {
    return acc + (values[item.key] ? item.weight : 0);
  }, 0);

  const missingItems = ITEMS.filter((item) => !values[item.key]);
  const completedItems = ITEMS.filter((item) => values[item.key]);
  const color = getGradientColor(percent);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#0a1628]/[0.08] bg-white p-4">
      {/* Header + Progress Bar */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-[#0a1628]">
            Completude do Perfil
          </span>
          <span
            className="text-lg font-extrabold font-mono tabular-nums"
            style={{ color }}
          >
            {percent}%
          </span>
        </div>

        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-[#0a1628]/[0.06]">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${percent}%`,
              background: `linear-gradient(90deg, #ef4444 0%, #f97316 30%, #eab308 55%, #84cc16 75%, #22c55e 100%)`,
              clipPath: `inset(0 ${100 - percent}% 0 0)`,
            }}
          />
        </div>

        <p className="text-xs text-[#0a1628]/50">{getProgressLabel(percent)}</p>
      </div>

      {/* Low completeness CTA */}
      {percent < 50 && (
        <div className="rounded-xl border border-amber-400/30 bg-amber-50 px-3 py-2.5">
          <p className="text-xs font-semibold text-amber-800">
            Complete seu perfil para ser descoberto por scouts
          </p>
          <p className="text-xs text-amber-700/80 mt-0.5">
            Perfis com mais de 50% de completude aparecem 10x mais nas buscas
          </p>
        </div>
      )}

      {/* Checklist */}
      <div className="flex flex-col gap-1">
        {/* Completed items */}
        {completedItems.map((item) => (
          <div
            key={item.key}
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5"
          >
            <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
            <span className="text-xs text-[#0a1628]/50 line-through">
              {item.label}
            </span>
          </div>
        ))}

        {/* Missing items with tips */}
        {missingItems.map((item) => (
          <div
            key={item.key}
            className="flex items-start gap-2.5 rounded-lg px-2 py-1.5 hover:bg-[#0a1628]/[0.02] transition-colors group"
          >
            <Circle className="size-4 shrink-0 text-[#0a1628]/20 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-[#0a1628]/70">
                  {item.label}
                </span>
                <span className="text-[10px] font-bold text-[#009739] bg-[#009739]/10 rounded-full px-1.5">
                  +{item.weight}%
                </span>
              </div>
              <p className="text-[11px] text-[#0a1628]/40 mt-0.5">{item.tip}</p>
              <p className="text-[10px] text-[#009739]/70 mt-0.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="size-3" />
                {item.action}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
