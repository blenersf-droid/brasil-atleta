import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Activity,
  Calendar,
  MapPin,
  Medal,
  Trophy,
  TrendingUp,
  User,
} from "lucide-react";
import { MODALITIES } from "@/lib/constants/modalities";

const levelLabels: Record<string, string> = {
  school: "Base Escolar",
  state: "Estadual",
  national: "Nacional",
  elite: "Alto Rendimento",
};

const levelColors: Record<string, string> = {
  school: "bg-gray-100 text-gray-700",
  state: "bg-blue-100 text-blue-700",
  national: "bg-green-100 text-green-700",
  elite: "bg-amber-100 text-amber-800",
};

const statusLabels: Record<string, string> = {
  active: "Ativo",
  inactive: "Inativo",
  retired: "Aposentado",
};

export default async function MeuPerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Find athlete record linked to this user
  const { data: athlete } = await supabase
    .from("athletes")
    .select("*, current_entity_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!athlete) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <User className="size-12 text-[#0a1628]/20" />
        <h1 className="text-xl font-bold text-[#0a1628]">
          Perfil nao encontrado
        </h1>
        <p className="text-sm text-[#0a1628]/50 max-w-md text-center">
          Seu perfil de atleta ainda nao foi criado. Complete o onboarding ou
          solicite ao seu tecnico/clube que cadastre seu perfil na plataforma.
        </p>
      </div>
    );
  }

  // Fetch entity name
  let entityName = "—";
  if (athlete.current_entity_id) {
    const { data: entity } = await supabase
      .from("entities")
      .select("name")
      .eq("id", athlete.current_entity_id)
      .maybeSingle();
    if (entity) entityName = entity.name;
  }

  // Fetch results with competitions
  const { data: results } = await supabase
    .from("results")
    .select("*, competitions(*)")
    .eq("athlete_id", athlete.id)
    .order("created_at", { ascending: false })
    .limit(20);

  // Fetch assessments
  const { data: assessments } = await supabase
    .from("assessments")
    .select("*")
    .eq("athlete_id", athlete.id)
    .order("assessment_date", { ascending: false })
    .limit(10);

  const modalityName =
    MODALITIES.find((m) => m.code === athlete.primary_modality)?.name ||
    athlete.primary_modality ||
    "—";

  const age = athlete.birth_date
    ? Math.floor(
        (Date.now() - new Date(athlete.birth_date).getTime()) /
          (365.25 * 24 * 60 * 60 * 1000)
      )
    : null;

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Profile Header */}
      <div className="flex items-start gap-6">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-[#009739]/10 text-3xl font-bold text-[#009739]">
          {athlete.full_name?.charAt(0) || "A"}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold tracking-tight text-[#0a1628]">
            {athlete.full_name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge className="bg-[#009739]/10 text-[#009739] border-none">
              {modalityName}
            </Badge>
            {athlete.competitive_level && (
              <Badge
                className={`border-none ${levelColors[athlete.competitive_level] || ""}`}
              >
                {levelLabels[athlete.competitive_level] || athlete.competitive_level}
              </Badge>
            )}
            <Badge
              className={`border-none ${athlete.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
            >
              {statusLabels[athlete.status] || athlete.status}
            </Badge>
            {athlete.is_paralympic && (
              <Badge className="bg-purple-100 text-purple-700 border-none">
                Paralimpico
              </Badge>
            )}
          </div>
          <p className="mt-2 text-sm text-[#0a1628]/40">
            {age !== null && `${age} anos · `}
            {athlete.city && `${athlete.city}, `}
            {athlete.state || ""} · {entityName}
          </p>
        </div>
      </div>

      <Separator />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Trophy className="size-8 text-[#009739]/60" />
            <div>
              <div className="font-mono text-2xl font-bold text-[#0a1628]">
                {results?.length || 0}
              </div>
              <div className="text-xs text-[#0a1628]/40">Resultados</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Medal className="size-8 text-amber-500/60" />
            <div>
              <div className="font-mono text-2xl font-bold text-[#0a1628]">
                {results?.filter((r) => r.position && r.position <= 3).length || 0}
              </div>
              <div className="text-xs text-[#0a1628]/40">Podios</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Activity className="size-8 text-blue-500/60" />
            <div>
              <div className="font-mono text-2xl font-bold text-[#0a1628]">
                {assessments?.length || 0}
              </div>
              <div className="text-xs text-[#0a1628]/40">Avaliacoes</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <TrendingUp className="size-8 text-[#009739]/60" />
            <div>
              <div className="font-mono text-2xl font-bold text-[#0a1628]">
                {athlete.competitive_level
                  ? levelLabels[athlete.competitive_level]?.split(" ")[0] || "—"
                  : "—"}
              </div>
              <div className="text-xs text-[#0a1628]/40">Nivel</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="resultados">
        <TabsList>
          <TabsTrigger value="resultados">Meus Resultados</TabsTrigger>
          <TabsTrigger value="avaliacoes">Avaliacoes</TabsTrigger>
          <TabsTrigger value="dados">Dados Pessoais</TabsTrigger>
        </TabsList>

        {/* Results Tab */}
        <TabsContent value="resultados" className="mt-4">
          {results && results.length > 0 ? (
            <div className="space-y-3">
              {results.map((result: Record<string, unknown>) => {
                const comp = result.competitions as Record<string, unknown> | null;
                return (
                  <Card key={result.id as string}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0a1628]/[0.04]">
                          {result.position && (result.position as number) <= 3 ? (
                            <Medal
                              className={`size-5 ${
                                result.position === 1
                                  ? "text-amber-500"
                                  : result.position === 2
                                    ? "text-gray-400"
                                    : "text-orange-500"
                              }`}
                            />
                          ) : (
                            <Trophy className="size-5 text-[#0a1628]/30" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-[#0a1628] text-sm">
                            {(comp?.name as string) || "Competicao"}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-[#0a1628]/40">
                              <Calendar className="inline size-3 mr-1" />
                              {(comp?.date_start as string) || "—"}
                            </span>
                            <span className="text-xs text-[#0a1628]/40">
                              <MapPin className="inline size-3 mr-1" />
                              {(comp?.location_state as string) || ""}
                            </span>
                            {comp?.grade ? (
                              <Badge
                                className={`text-[10px] border-none ${levelColors[String(comp.grade)] || ""}`}
                              >
                                {levelLabels[String(comp.grade)] || String(comp.grade)}
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {result.position ? (
                          <div className="font-mono text-lg font-bold text-[#0a1628]">
                            #{String(result.position)}
                          </div>
                        ) : null}
                        {result.mark ? (
                          <div className="text-xs text-[#0a1628]/50">
                            {String(result.mark)}
                            {result.mark_unit ? ` ${String(result.mark_unit)}` : ""}
                          </div>
                        ) : null}
                        {result.category ? (
                          <div className="text-[10px] text-[#0a1628]/30">
                            {String(result.category)}
                          </div>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Trophy className="size-10 text-[#0a1628]/15 mb-3" />
              <p className="text-sm text-[#0a1628]/40">
                Nenhum resultado registrado ainda.
              </p>
              <p className="text-xs text-[#0a1628]/25 mt-1">
                Seus resultados serao adicionados pelo seu tecnico ou gestor.
              </p>
            </div>
          )}
        </TabsContent>

        {/* Assessments Tab */}
        <TabsContent value="avaliacoes" className="mt-4">
          {assessments && assessments.length > 0 ? (
            <div className="space-y-3">
              {assessments.map((assessment: Record<string, unknown>) => {
                const metrics = assessment.metrics as Record<string, unknown> | null;
                return (
                  <Card key={assessment.id as string}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm text-[#0a1628]">
                          {(assessment.protocol as string) || "Avaliacao"}
                        </span>
                        <span className="text-xs text-[#0a1628]/40">
                          {assessment.assessment_date as string}
                        </span>
                      </div>
                      {metrics && (
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(metrics).map(([key, val]) => (
                            <Badge
                              key={key}
                              className="bg-[#0a1628]/[0.04] text-[#0a1628]/60 border-none text-xs"
                            >
                              {key}: {val !== null && val !== undefined ? String(val) : "—"}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Activity className="size-10 text-[#0a1628]/15 mb-3" />
              <p className="text-sm text-[#0a1628]/40">
                Nenhuma avaliacao registrada ainda.
              </p>
            </div>
          )}
        </TabsContent>

        {/* Personal Data Tab */}
        <TabsContent value="dados" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dados Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="text-xs text-[#0a1628]/40 uppercase tracking-wider mb-1">
                  Nome Completo
                </div>
                <div className="text-sm font-medium">{athlete.full_name}</div>
              </div>
              <div>
                <div className="text-xs text-[#0a1628]/40 uppercase tracking-wider mb-1">
                  Data de Nascimento
                </div>
                <div className="text-sm font-medium">
                  {athlete.birth_date || "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#0a1628]/40 uppercase tracking-wider mb-1">
                  Genero
                </div>
                <div className="text-sm font-medium">
                  {athlete.gender === "M"
                    ? "Masculino"
                    : athlete.gender === "F"
                      ? "Feminino"
                      : athlete.gender === "NB"
                        ? "Nao-binario"
                        : "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#0a1628]/40 uppercase tracking-wider mb-1">
                  Localidade
                </div>
                <div className="text-sm font-medium">
                  {athlete.city ? `${athlete.city}, ` : ""}
                  {athlete.state || "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#0a1628]/40 uppercase tracking-wider mb-1">
                  Modalidade Principal
                </div>
                <div className="text-sm font-medium">{modalityName}</div>
              </div>
              <div>
                <div className="text-xs text-[#0a1628]/40 uppercase tracking-wider mb-1">
                  Entidade Atual
                </div>
                <div className="text-sm font-medium">{entityName}</div>
              </div>
              {athlete.is_paralympic && athlete.paralympic_classification && (
                <>
                  <div>
                    <div className="text-xs text-[#0a1628]/40 uppercase tracking-wider mb-1">
                      Classe Funcional
                    </div>
                    <div className="text-sm font-medium">
                      {(athlete.paralympic_classification as Record<string, string>)
                        .functional_class || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#0a1628]/40 uppercase tracking-wider mb-1">
                      Tipo de Deficiencia
                    </div>
                    <div className="text-sm font-medium">
                      {(athlete.paralympic_classification as Record<string, string>)
                        .disability_type || "—"}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
