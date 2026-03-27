import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MODALITIES } from "@/lib/constants/modalities";
import { BRAZILIAN_STATES } from "@/lib/constants/states";
import type { CompetitiveLevel } from "@/types/database";
import { ShareButton } from "./share-button";
import {
  AchievementBadge,
  type AchievementType,
} from "@/components/athletes/achievement-badge";
import {
  Trophy,
  MapPin,
  Calendar,
  Star,
  Medal,
  Activity,
  BarChart3,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getModalityName(code: string): string {
  return MODALITIES.find((m) => m.code === code)?.name ?? code;
}

function getStateName(uf: string): string {
  const found = BRAZILIAN_STATES.find((s) => s.uf === uf);
  return found ? found.name : uf;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
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

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-[#009739]",
  "bg-purple-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-indigo-500",
  "bg-[#002776]",
];

function getAvatarColor(name: string): string {
  const index =
    name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

const LEVEL_BADGE: Record<
  CompetitiveLevel,
  { label: string; className: string }
> = {
  school: {
    label: "Base Escolar",
    className: "bg-gray-100 text-gray-600 border-gray-200",
  },
  state: {
    label: "Estadual",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  national: {
    label: "Nacional",
    className: "bg-green-50 text-[#009739] border-green-200",
  },
  elite: {
    label: "Alto Rendimento",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
};

const GRADE_LABEL: Record<CompetitiveLevel, string> = {
  school: "Escolar",
  state: "Estadual",
  national: "Nacional",
  elite: "Elite",
};

// ─── Types ─────────────────────────────────────────────────────────────────────

interface AthleteRow {
  id: string;
  full_name: string;
  birth_date: string;
  state: string;
  city: string | null;
  primary_modality: string;
  competitive_level: string;
  is_paralympic: boolean | null;
  photo_url: string | null;
  slug: string | null;
  bio: string | null;
}

interface ResultRow {
  id: string;
  position: number | null;
  mark: string | null;
  mark_unit: string | null;
  competitions: {
    id: string;
    name: string;
    date_start: string | null;
    grade: string | null;
  } | null;
}

interface AchievementRow {
  id: string;
  title: string;
  description: string | null;
  date: string | null;
  type: AchievementType;
  competition_name: string | null;
}

interface AssessmentRow {
  id: string;
  assessment_date: string;
  modality_code: string;
  protocol: string;
  metrics: Record<string, unknown>;
}

// ─── generateMetadata ──────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: athlete } = await supabase
    .from("athletes")
    .select("full_name, primary_modality, competitive_level, state, bio")
    .eq("slug", slug)
    .single();

  if (!athlete) {
    return {
      title: "Perfil nao encontrado — Brasil Atleta",
    };
  }

  const modalityName = getModalityName(athlete.primary_modality);
  const stateName = getStateName(athlete.state);
  const levelLabel =
    LEVEL_BADGE[athlete.competitive_level as CompetitiveLevel]?.label ??
    athlete.competitive_level;

  const title = `${athlete.full_name} — ${modalityName} | Brasil Atleta`;
  const description =
    athlete.bio ??
    `Portfolio esportivo de ${athlete.full_name}. ${modalityName} · ${levelLabel} · ${stateName}. Acompanhe resultados, conquistas e avaliacoes no Brasil Atleta.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      locale: "pt_BR",
      siteName: "Brasil Atleta",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

// ─── Page ──────────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function AtletaPublicPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch athlete by slug — anon read policy covers this
  const { data: athleteRaw, error } = await supabase
    .from("athletes")
    .select(
      "id, full_name, birth_date, state, city, primary_modality, competitive_level, is_paralympic, photo_url, slug, bio"
    )
    .eq("slug", slug)
    .single();

  if (error || !athleteRaw) {
    notFound();
  }

  const athlete = athleteRaw as unknown as AthleteRow;

  // Fetch last 10 results with competition info
  const { data: resultsRaw } = await supabase
    .from("results")
    .select(
      `id, position, mark, mark_unit,
       competitions ( id, name, date_start, grade )`
    )
    .eq("athlete_id", athlete.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const results: ResultRow[] = (resultsRaw ?? []) as unknown as ResultRow[];

  // Fetch achievements
  const { data: achievementsRaw } = await supabase
    .from("achievements")
    .select("id, title, description, date, type, competition_name")
    .eq("athlete_id", athlete.id)
    .order("date", { ascending: false });

  const achievements: AchievementRow[] =
    (achievementsRaw ?? []) as unknown as AchievementRow[];

  // Fetch latest assessments (max 3)
  const { data: assessmentsRaw } = await supabase
    .from("assessments")
    .select("id, assessment_date, modality_code, protocol, metrics")
    .eq("athlete_id", athlete.id)
    .order("assessment_date", { ascending: false })
    .limit(3);

  const assessments: AssessmentRow[] =
    (assessmentsRaw ?? []) as unknown as AssessmentRow[];

  // Derived stats
  const totalCompetitions = results.length;
  const podiums = results.filter(
    (r) => r.position !== null && r.position <= 3
  ).length;
  const totalAchievements = achievements.length;

  const age = calculateAge(athlete.birth_date);
  const initials = getInitials(athlete.full_name);
  const avatarColor = getAvatarColor(athlete.full_name);
  const levelBadge =
    LEVEL_BADGE[athlete.competitive_level as CompetitiveLevel] ??
    LEVEL_BADGE.state;
  const modalityName = getModalityName(athlete.primary_modality);
  const stateName = getStateName(athlete.state);

  return (
    <div className="flex flex-col">
      {/* ─── HERO HEADER ─── */}
      <div className="relative bg-gradient-to-br from-[#0a1628] via-[#0d1f38] to-[#0a1628] pb-8 pt-8 sm:pb-10 sm:pt-10 overflow-hidden">
        {/* Subtle grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
        {/* Green glow */}
        <div className="pointer-events-none absolute -top-20 -right-20 h-[350px] w-[350px] rounded-full bg-[#009739]/10 blur-[100px]" />

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6">
          {/* Share button — top right */}
          <div className="flex justify-end mb-4">
            <ShareButton
              url={`https://brasilatleta.com.br/atleta/${slug}`}
              athleteName={athlete.full_name}
            />
          </div>

          {/* Avatar + Name + Badges */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div
                className={`size-24 sm:size-28 rounded-full flex items-center justify-center ring-4 ring-white/10 shadow-2xl ${avatarColor}`}
              >
                <span className="text-3xl sm:text-4xl font-bold text-white">
                  {initials}
                </span>
              </div>
              {athlete.is_paralympic && (
                <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#009739] text-[11px] font-bold text-white shadow ring-2 ring-[#0a1628]">
                  P
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-col items-center sm:items-start gap-2 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                {athlete.full_name}
              </h1>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#009739]/20 px-3 py-1 text-[12px] font-semibold text-[#4ade80] border border-[#009739]/30">
                  <Activity className="size-3" />
                  {modalityName}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold border ${levelBadge.className}`}
                >
                  {levelBadge.label}
                </span>
                {athlete.is_paralympic && (
                  <span className="inline-flex items-center rounded-full bg-purple-500/20 px-3 py-1 text-[12px] font-semibold text-purple-300 border border-purple-500/30">
                    Paralimpico
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-sm text-white/50">
                <span className="flex items-center gap-1">
                  <Calendar className="size-3.5" />
                  {age} anos
                </span>
                <span className="text-white/20">·</span>
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5" />
                  {stateName}
                  {athlete.city ? `, ${athlete.city}` : ""}
                </span>
              </div>
            </div>
          </div>

          {/* ─── STATS ROW ─── */}
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              { icon: Trophy, value: totalCompetitions, label: "Competicoes" },
              { icon: Medal, value: podiums, label: "Podios" },
              { icon: Star, value: totalAchievements, label: "Conquistas" },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="flex flex-col items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 text-center backdrop-blur-sm"
                >
                  <Icon className="size-4 text-[#009739]" />
                  <span className="font-mono text-2xl font-bold text-white">
                    {stat.value}
                  </span>
                  <span className="text-[11px] font-medium text-white/40 uppercase tracking-wide">
                    {stat.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── CONTENT AREA ─── */}
      <div className="mx-auto w-full max-w-4xl flex flex-col gap-8 px-4 sm:px-6 py-8">
        {/* Bio */}
        {athlete.bio && (
          <section>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.15em] text-[#009739]">
              Sobre
            </h2>
            <p className="text-base leading-relaxed text-gray-600">
              {athlete.bio}
            </p>
          </section>
        )}

        {/* ─── Resultados Recentes ─── */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-[#009739]">
              Resultados Recentes
            </h2>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {results.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center border border-dashed border-gray-200 rounded-xl">
              Nenhum resultado registrado ainda.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {results.map((result) => {
                const gradeLabel =
                  result.competitions?.grade
                    ? (GRADE_LABEL[
                        result.competitions.grade as CompetitiveLevel
                      ] ?? result.competitions.grade)
                    : null;

                const isPodium =
                  result.position !== null && result.position <= 3;

                return (
                  <div
                    key={result.id}
                    className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Position indicator */}
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-mono text-sm font-bold ${
                        result.position === 1
                          ? "bg-amber-50 text-amber-600 border border-amber-200"
                          : result.position === 2
                          ? "bg-gray-50 text-gray-500 border border-gray-200"
                          : result.position === 3
                          ? "bg-orange-50 text-orange-600 border border-orange-200"
                          : "bg-gray-50 text-gray-400 border border-gray-100"
                      }`}
                    >
                      {result.position != null ? `${result.position}` : "—"}
                    </div>

                    {/* Competition info */}
                    <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                      <span className="truncate text-sm font-semibold text-gray-800">
                        {result.competitions?.name ?? "Competicao"}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatShortDate(
                          result.competitions?.date_start ?? null
                        )}
                      </span>
                    </div>

                    {/* Mark + grade */}
                    <div className="flex items-center gap-2 shrink-0">
                      {result.mark && (
                        <span className="font-mono text-sm font-semibold text-gray-700">
                          {result.mark}
                          {result.mark_unit && (
                            <span className="ml-0.5 text-xs text-gray-400">
                              {result.mark_unit}
                            </span>
                          )}
                        </span>
                      )}
                      {gradeLabel && (
                        <span className="hidden sm:inline-flex text-[11px] font-medium rounded-full px-2 py-0.5 bg-gray-50 text-gray-500 border border-gray-100">
                          {gradeLabel}
                        </span>
                      )}
                      {isPodium && (
                        <Trophy className="size-3.5 text-amber-500" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ─── Conquistas ─── */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-[#009739]">
              Conquistas
            </h2>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {achievements.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center border border-dashed border-gray-200 rounded-xl">
              Nenhuma conquista registrada ainda.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {achievements.map((achievement) => (
                <AchievementBadge
                  key={achievement.id}
                  title={achievement.title}
                  description={achievement.description}
                  date={achievement.date}
                  type={achievement.type}
                  competition_name={achievement.competition_name}
                />
              ))}
            </div>
          )}
        </section>

        {/* ─── Avaliacoes ─── */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-[#009739]">
              Avaliacoes
            </h2>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {assessments.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center border border-dashed border-gray-200 rounded-xl">
              Nenhuma avaliacao registrada ainda.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {assessments.map((assessment) => {
                const metricKeys = Object.keys(assessment.metrics).slice(0, 4);

                return (
                  <div
                    key={assessment.id}
                    className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="size-4 text-[#009739]" />
                        <span className="text-sm font-semibold text-gray-800">
                          {assessment.protocol}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {formatShortDate(assessment.assessment_date)}
                      </span>
                    </div>

                    {metricKeys.length > 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        {metricKeys.map((key) => (
                          <div
                            key={key}
                            className="flex flex-col gap-0.5 rounded-lg bg-gray-50 px-3 py-2"
                          >
                            <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                              {key}
                            </span>
                            <span className="font-mono text-sm font-bold text-gray-700">
                              {String(assessment.metrics[key])}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ─── CTA Footer Banner ─── */}
        <section className="rounded-2xl bg-gradient-to-br from-[#0a1628] to-[#0d1f38] p-6 sm:p-8 text-center overflow-hidden relative">
          <div className="pointer-events-none absolute top-0 right-0 h-48 w-48 rounded-full bg-[#009739]/10 blur-[60px]" />
          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#009739] mb-2">
              Brasil Atleta
            </p>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white mb-2 tracking-tight">
              Crie seu portfolio esportivo gratis
            </h3>
            <p className="text-sm text-white/50 mb-5 max-w-sm mx-auto">
              Registre suas conquistas, resultados e seja visto por scouts e
              clubes de todo o Brasil.
            </p>
            <Link
              href="/criar-conta"
              className="inline-flex items-center gap-2 rounded-xl bg-[#009739] px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(0,151,57,0.3)] transition-all hover:bg-[#00b846] hover:shadow-[0_0_30px_rgba(0,151,57,0.4)]"
            >
              Criar perfil gratis
              <ChevronRight className="size-4" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
