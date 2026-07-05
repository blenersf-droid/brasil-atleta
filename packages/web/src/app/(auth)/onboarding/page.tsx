"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Activity } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { WizardSteps } from "@/components/onboarding/wizard-steps";
import { createClient } from "@/lib/supabase/client";
import { BRAZILIAN_STATES } from "@/lib/constants/states";
import { MODALITIES } from "@/lib/constants/modalities";
import { isMinor } from "@/lib/utils/age";
import type { Gender, CompetitiveLevel, EntityType } from "@/types/database";
import type { Database } from "@/lib/database.types";

type GuardianRelationship =
  Database["public"]["Enums"]["guardian_relationship_type"];

// ─── Type definitions ────────────────────────────────────────────────────────

type UserType = "clube" | "tecnico" | "atleta" | "federacao" | "confederacao";

interface FormData {
  // Clube
  entity_name?: string;
  entity_type?: string;
  // Tecnico
  specialization?: string;
  education?: string;
  linked_entity?: string;
  // Atleta
  birth_date?: string;
  gender?: string;
  competition_level?: string;
  current_entity?: string;
  // Shared
  state?: string;
  city?: string;
  modality?: string;
  modalities?: string[];
  // Confederacao contact
  contact_email?: string;
  contact_phone?: string;
  // Atleta menor de idade — consentimento do responsavel (LGPD art. 14, D6)
  guardian_full_name?: string;
  guardian_email?: string;
  guardian_relationship?: GuardianRelationship;
  guardian_consent_checked?: boolean;
}

// ─── Step configurations by user type ─────────────────────────────────────────

const STEP_LABELS: Record<UserType, string[]> = {
  clube: ["Dados da Entidade", "Modalidades", "Conclusao"],
  tecnico: ["Especializacao", "Modalidades", "Conclusao"],
  atleta: ["Dados Pessoais", "Modalidade", "Entidade Atual", "Conclusao"],
  federacao: ["Atuacao", "Conclusao"],
  confederacao: ["Informacoes", "Conclusao"],
};

// ─── Schema mapping helpers ────────────────────────────────────────────────────
// The wizard collects Portuguese-language picklist values that do not map
// 1:1 to the underlying schema enum vocabularies. These translate collected
// answers into valid column values (see supabase/migrations/00001_initial_
// schema.sql for gender_type/competitive_level, 00005_schema_reconciliation
// .sql for the athletes/entities columns used below).

const GENDER_MAP: Record<string, Gender> = {
  masculino: "M",
  feminino: "F",
  nao_binario: "NB",
};

const COMPETITION_LEVEL_MAP: Record<string, CompetitiveLevel> = {
  iniciante: "school",
  regional: "state",
  estadual: "state",
  nacional: "national",
  internacional: "elite",
  paralimpico: "elite",
};

const ENTITY_TYPE_MAP: Record<"clube" | "federacao" | "confederacao", EntityType> = {
  clube: "club",
  federacao: "federation",
  confederacao: "confederation",
};

const ENTITY_TYPE_LABEL: Record<"clube" | "federacao" | "confederacao", string> = {
  clube: "Clube",
  federacao: "Federacao",
  confederacao: "Confederacao",
};

// ─── Reusable field components ────────────────────────────────────────────────

const inputClass =
  "h-11 rounded-xl border-[#0a1628]/[0.08] bg-white text-sm placeholder:text-[#0a1628]/25 focus:border-[#009739] focus:ring-[#009739]/20";
const labelClass =
  "text-xs font-semibold text-[#0a1628]/60 uppercase tracking-wider";
const selectClass =
  "h-11 w-full rounded-xl border border-[#0a1628]/[0.08] bg-white px-3 text-sm text-[#0a1628] focus:border-[#009739] focus:outline-none focus:ring-2 focus:ring-[#009739]/20 disabled:pointer-events-none disabled:opacity-50";

// ─── Step renderers ───────────────────────────────────────────────────────────

function ClubeStep1({
  data,
  onChange,
}: {
  data: FormData;
  onChange: (d: Partial<FormData>) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="entity_name" className={labelClass}>
          Nome da Entidade
        </Label>
        <Input
          id="entity_name"
          type="text"
          placeholder="Nome do clube, escola ou centro"
          value={data.entity_name ?? ""}
          onChange={(e) => onChange({ entity_name: e.target.value })}
          className={inputClass}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="entity_type" className={labelClass}>
          Tipo de Entidade
        </Label>
        <select
          id="entity_type"
          value={data.entity_type ?? ""}
          onChange={(e) => onChange({ entity_type: e.target.value })}
          className={selectClass}
        >
          <option value="" disabled>
            Selecione o tipo
          </option>
          <option value="clube">Clube</option>
          <option value="escola">Escola de Esportes</option>
          <option value="centro">Centro de Treinamento</option>
          <option value="associacao">Associacao</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="state" className={labelClass}>
          Estado
        </Label>
        <select
          id="state"
          value={data.state ?? ""}
          onChange={(e) => onChange({ state: e.target.value })}
          className={selectClass}
        >
          <option value="" disabled>
            Selecione o estado
          </option>
          {BRAZILIAN_STATES.map((s) => (
            <option key={s.uf} value={s.uf}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="city" className={labelClass}>
          Cidade
        </Label>
        <Input
          id="city"
          type="text"
          placeholder="Cidade"
          value={data.city ?? ""}
          onChange={(e) => onChange({ city: e.target.value })}
          className={inputClass}
        />
      </div>
    </div>
  );
}

function ModalidadesStep({
  data,
  onChange,
}: {
  data: FormData;
  onChange: (d: Partial<FormData>) => void;
}) {
  const selected = data.modalities ?? [];

  function toggle(code: string) {
    if (selected.includes(code)) {
      onChange({ modalities: selected.filter((m) => m !== code) });
    } else {
      onChange({ modalities: [...selected, code] });
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#0a1628]/50">
        Selecione as modalidades atendidas pela sua entidade.
      </p>
      <div className="grid grid-cols-2 gap-2 max-h-[320px] overflow-y-auto pr-1">
        {MODALITIES.map((m) => {
          const active = selected.includes(m.code);
          return (
            <button
              key={m.code}
              type="button"
              onClick={() => toggle(m.code)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-all ${
                active
                  ? "border-[#009739] bg-[#009739]/[0.06] text-[#009739]"
                  : "border-[#0a1628]/[0.08] bg-white text-[#0a1628]/70 hover:border-[#0a1628]/20"
              }`}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[9px] font-bold ${
                  active
                    ? "border-[#009739] bg-[#009739] text-white"
                    : "border-[#0a1628]/20"
                }`}
              >
                {active ? "✓" : ""}
              </span>
              {m.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TecnicoStep1({
  data,
  onChange,
}: {
  data: FormData;
  onChange: (d: Partial<FormData>) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="specialization" className={labelClass}>
          Especializacao
        </Label>
        <select
          id="specialization"
          value={data.specialization ?? ""}
          onChange={(e) => onChange({ specialization: e.target.value })}
          className={selectClass}
        >
          <option value="" disabled>
            Selecione a especializacao
          </option>
          <option value="preparacao_fisica">Preparacao Fisica</option>
          <option value="tecnico_tatico">Tecnico-Tatico</option>
          <option value="psicologia_esportiva">Psicologia Esportiva</option>
          <option value="nutricao_esportiva">Nutricao Esportiva</option>
          <option value="fisioterapia">Fisioterapia</option>
          <option value="coach_geral">Coach Geral</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="education" className={labelClass}>
          Formacao Academica
        </Label>
        <select
          id="education"
          value={data.education ?? ""}
          onChange={(e) => onChange({ education: e.target.value })}
          className={selectClass}
        >
          <option value="" disabled>
            Selecione a formacao
          </option>
          <option value="graduacao">Graduacao</option>
          <option value="especializacao">Especializacao / Pos-Graduacao</option>
          <option value="mestrado">Mestrado</option>
          <option value="doutorado">Doutorado</option>
          <option value="tecnico">Tecnico / Curso Tecnico</option>
        </select>
      </div>
    </div>
  );
}

function TecnicoStep2({
  data,
  onChange,
}: {
  data: FormData;
  onChange: (d: Partial<FormData>) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="modality" className={labelClass}>
          Modalidade Principal
        </Label>
        <select
          id="modality"
          value={data.modality ?? ""}
          onChange={(e) => onChange({ modality: e.target.value })}
          className={selectClass}
        >
          <option value="" disabled>
            Selecione a modalidade
          </option>
          {MODALITIES.map((m) => (
            <option key={m.code} value={m.code}>
              {m.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="linked_entity" className={labelClass}>
          Entidade Vinculada (opcional)
        </Label>
        <Input
          id="linked_entity"
          type="text"
          placeholder="Nome do clube ou federacao"
          value={data.linked_entity ?? ""}
          onChange={(e) => onChange({ linked_entity: e.target.value })}
          className={inputClass}
        />
      </div>
    </div>
  );
}

function AtletaStep1({
  data,
  onChange,
}: {
  data: FormData;
  onChange: (d: Partial<FormData>) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="birth_date" className={labelClass}>
          Data de Nascimento
        </Label>
        <Input
          id="birth_date"
          type="date"
          value={data.birth_date ?? ""}
          onChange={(e) => onChange({ birth_date: e.target.value })}
          className={inputClass}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="gender" className={labelClass}>
          Genero
        </Label>
        <select
          id="gender"
          value={data.gender ?? ""}
          onChange={(e) => onChange({ gender: e.target.value })}
          className={selectClass}
        >
          <option value="" disabled>
            Selecione o genero
          </option>
          <option value="masculino">Masculino</option>
          <option value="feminino">Feminino</option>
          <option value="nao_binario">Nao Binario</option>
          <option value="prefiro_nao_informar">Prefiro nao informar</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="state" className={labelClass}>
          Estado
        </Label>
        <select
          id="state"
          value={data.state ?? ""}
          onChange={(e) => onChange({ state: e.target.value })}
          className={selectClass}
        >
          <option value="" disabled>
            Selecione o estado
          </option>
          {BRAZILIAN_STATES.map((s) => (
            <option key={s.uf} value={s.uf}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="city" className={labelClass}>
          Cidade
        </Label>
        <Input
          id="city"
          type="text"
          placeholder="Cidade"
          value={data.city ?? ""}
          onChange={(e) => onChange({ city: e.target.value })}
          className={inputClass}
        />
      </div>
    </div>
  );
}

function AtletaStep2({
  data,
  onChange,
}: {
  data: FormData;
  onChange: (d: Partial<FormData>) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="modality" className={labelClass}>
          Modalidade Principal
        </Label>
        <select
          id="modality"
          value={data.modality ?? ""}
          onChange={(e) => onChange({ modality: e.target.value })}
          className={selectClass}
        >
          <option value="" disabled>
            Selecione a modalidade
          </option>
          {MODALITIES.map((m) => (
            <option key={m.code} value={m.code}>
              {m.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="competition_level" className={labelClass}>
          Nivel Competitivo
        </Label>
        <select
          id="competition_level"
          value={data.competition_level ?? ""}
          onChange={(e) => onChange({ competition_level: e.target.value })}
          className={selectClass}
        >
          <option value="" disabled>
            Selecione o nivel
          </option>
          <option value="iniciante">Iniciante</option>
          <option value="regional">Regional</option>
          <option value="estadual">Estadual</option>
          <option value="nacional">Nacional</option>
          <option value="internacional">Internacional / Olimpico</option>
          <option value="paralimpico">Paralimpico</option>
        </select>
      </div>
    </div>
  );
}

function AtletaStep3({
  data,
  onChange,
}: {
  data: FormData;
  onChange: (d: Partial<FormData>) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="current_entity" className={labelClass}>
          Entidade Atual (opcional)
        </Label>
        <Input
          id="current_entity"
          type="text"
          placeholder="Nome do clube, federacao ou centro de treinamento"
          value={data.current_entity ?? ""}
          onChange={(e) => onChange({ current_entity: e.target.value })}
          className={inputClass}
        />
      </div>
      <p className="text-xs text-[#0a1628]/40">
        Deixe em branco caso nao esteja vinculado a nenhuma entidade no momento.
      </p>
    </div>
  );
}

// Shown only when the birth date informed in AtletaStep1 indicates the
// athlete is under 18 (LGPD art. 14 / D6, FR-0.7). Captures a verifiable
// consent from the legal guardian before the onboarding can be concluded —
// see handleFinish, which blocks submission for minors until these fields
// (and the checkbox) are filled.
function GuardianConsentStep({
  data,
  onChange,
}: {
  data: FormData;
  onChange: (d: Partial<FormData>) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-[#009739]/20 bg-[#009739]/[0.06] p-4">
        <p className="text-sm font-bold text-[#0a1628]">
          Autorizacao do responsavel legal
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-[#0a1628]/60">
          Como o atleta e menor de 18 anos, a lei (LGPD, art. 14) exige a
          autorizacao de um dos pais ou responsavel legal para o tratamento
          dos dados dele. Vamos usar o nome, data de nascimento, modalidade e
          resultados esportivos informados nesta pagina para criar o
          portfolio do atleta. O perfil comeca privado (visibilidade
          restrita) — so um responsavel podera torna-lo publico depois, em
          &quot;Meu Perfil&quot;.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="guardian_full_name" className={labelClass}>
          Nome completo do responsavel
        </Label>
        <Input
          id="guardian_full_name"
          type="text"
          placeholder="Nome completo de um dos pais ou responsavel legal"
          value={data.guardian_full_name ?? ""}
          onChange={(e) => onChange({ guardian_full_name: e.target.value })}
          className={inputClass}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="guardian_email" className={labelClass}>
          E-mail do responsavel
        </Label>
        <Input
          id="guardian_email"
          type="email"
          placeholder="email@exemplo.com"
          value={data.guardian_email ?? ""}
          onChange={(e) => onChange({ guardian_email: e.target.value })}
          className={inputClass}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="guardian_relationship" className={labelClass}>
          Relacao com o atleta
        </Label>
        <select
          id="guardian_relationship"
          value={data.guardian_relationship ?? ""}
          onChange={(e) =>
            onChange({
              guardian_relationship: e.target.value as GuardianRelationship,
            })
          }
          className={selectClass}
        >
          <option value="" disabled>
            Selecione a relacao
          </option>
          <option value="mae">Mae</option>
          <option value="pai">Pai</option>
          <option value="tutor">Tutor(a) legal</option>
          <option value="outro">Outro responsavel legal</option>
        </select>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-[#009739] bg-[#009739]/[0.06] p-4">
        <Checkbox
          checked={!!data.guardian_consent_checked}
          onCheckedChange={(checked) =>
            onChange({ guardian_consent_checked: checked === true })
          }
          className="mt-0.5"
        />
        <span className="text-sm font-semibold leading-relaxed text-[#0a1628]">
          Eu, na qualidade de responsavel legal, autorizo o tratamento dos
          dados esportivos do atleta acima (nome, data de nascimento,
          modalidade, resultados e conquistas) pela Brasil Atleta, para a
          criacao do portfolio esportivo do atleta na plataforma, nos termos
          da LGPD (art. 14).
        </span>
      </label>
    </div>
  );
}

function FederacaoStep1({
  data,
  onChange,
}: {
  data: FormData;
  onChange: (d: Partial<FormData>) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="state" className={labelClass}>
          Estado de Atuacao
        </Label>
        <select
          id="state"
          value={data.state ?? ""}
          onChange={(e) => onChange({ state: e.target.value })}
          className={selectClass}
        >
          <option value="" disabled>
            Selecione o estado
          </option>
          {BRAZILIAN_STATES.map((s) => (
            <option key={s.uf} value={s.uf}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="modality" className={labelClass}>
          Modalidade
        </Label>
        <select
          id="modality"
          value={data.modality ?? ""}
          onChange={(e) => onChange({ modality: e.target.value })}
          className={selectClass}
        >
          <option value="" disabled>
            Selecione a modalidade
          </option>
          {MODALITIES.map((m) => (
            <option key={m.code} value={m.code}>
              {m.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function ConfederacaoStep1({
  data,
  onChange,
}: {
  data: FormData;
  onChange: (d: Partial<FormData>) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="modality" className={labelClass}>
          Modalidade
        </Label>
        <select
          id="modality"
          value={data.modality ?? ""}
          onChange={(e) => onChange({ modality: e.target.value })}
          className={selectClass}
        >
          <option value="" disabled>
            Selecione a modalidade
          </option>
          {MODALITIES.map((m) => (
            <option key={m.code} value={m.code}>
              {m.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact_email" className={labelClass}>
          E-mail de Contato Oficial
        </Label>
        <Input
          id="contact_email"
          type="email"
          placeholder="contato@confederacao.org.br"
          value={data.contact_email ?? ""}
          onChange={(e) => onChange({ contact_email: e.target.value })}
          className={inputClass}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact_phone" className={labelClass}>
          Telefone de Contato
        </Label>
        <Input
          id="contact_phone"
          type="tel"
          placeholder="(11) 91234-5678"
          value={data.contact_phone ?? ""}
          onChange={(e) => onChange({ contact_phone: e.target.value })}
          className={inputClass}
        />
      </div>
    </div>
  );
}

function ConclusaoStep({ userType }: { userType: UserType }) {
  const labels: Record<UserType, string> = {
    clube: "Clube / Entidade",
    tecnico: "Tecnico",
    atleta: "Atleta",
    federacao: "Federacao",
    confederacao: "Confederacao",
  };
  return (
    <div className="space-y-4 py-4 text-center">
      <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-[#009739]/10">
        <Activity className="size-8 text-[#009739]" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-[#0a1628]">
          Tudo pronto, {labels[userType]}!
        </h3>
        <p className="mt-1.5 text-sm text-[#0a1628]/50">
          Suas informacoes foram coletadas. Clique em{" "}
          <strong>Concluir</strong> para acessar a plataforma.
        </p>
      </div>
    </div>
  );
}

// ─── Step registry ─────────────────────────────────────────────────────────────

function getSteps(userType: UserType, data: FormData) {
  const steps: {
    label: string;
    component: (data: FormData, onChange: (d: Partial<FormData>) => void) => React.ReactNode;
  }[] = [];

  if (userType === "clube") {
    steps.push({
      label: "Dados da Entidade",
      component: (data, onChange) => <ClubeStep1 data={data} onChange={onChange} />,
    });
    steps.push({
      label: "Modalidades",
      component: (data, onChange) => <ModalidadesStep data={data} onChange={onChange} />,
    });
    steps.push({
      label: "Conclusao",
      component: () => <ConclusaoStep userType="clube" />,
    });
  } else if (userType === "tecnico") {
    steps.push({
      label: "Especializacao",
      component: (data, onChange) => <TecnicoStep1 data={data} onChange={onChange} />,
    });
    steps.push({
      label: "Modalidades",
      component: (data, onChange) => <TecnicoStep2 data={data} onChange={onChange} />,
    });
    steps.push({
      label: "Conclusao",
      component: () => <ConclusaoStep userType="tecnico" />,
    });
  } else if (userType === "atleta") {
    steps.push({
      label: "Dados Pessoais",
      component: (data, onChange) => <AtletaStep1 data={data} onChange={onChange} />,
    });
    steps.push({
      label: "Modalidade",
      component: (data, onChange) => <AtletaStep2 data={data} onChange={onChange} />,
    });
    steps.push({
      label: "Entidade Atual",
      component: (data, onChange) => <AtletaStep3 data={data} onChange={onChange} />,
    });
    // FR-0.7/D6: inserted only for a minor athlete (conservative default:
    // unknown birth_date also counts as minor — see isMinor()), before the
    // final "Conclusao" step. handleFinish blocks submission until this
    // step's fields + checkbox are filled.
    if (isMinor(data.birth_date)) {
      steps.push({
        label: "Consentimento",
        component: (data, onChange) => (
          <GuardianConsentStep data={data} onChange={onChange} />
        ),
      });
    }
    steps.push({
      label: "Conclusao",
      component: () => <ConclusaoStep userType="atleta" />,
    });
  } else if (userType === "federacao") {
    steps.push({
      label: "Atuacao",
      component: (data, onChange) => <FederacaoStep1 data={data} onChange={onChange} />,
    });
    steps.push({
      label: "Conclusao",
      component: () => <ConclusaoStep userType="federacao" />,
    });
  } else {
    // confederacao
    steps.push({
      label: "Informacoes",
      component: (data, onChange) => <ConfederacaoStep1 data={data} onChange={onChange} />,
    });
    steps.push({
      label: "Conclusao",
      component: () => <ConclusaoStep userType="confederacao" />,
    });
  }

  return steps;
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [userType, setUserType] = useState<UserType | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch user type from Supabase auth metadata on mount
  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const type = user?.user_metadata?.user_type as UserType | undefined;
      setUserType(type ?? "atleta");
    }
    loadUser();
  }, []);

  // Computed before the loading-state early return below (rules of hooks —
  // the clamp effect that depends on its length must run unconditionally).
  const steps = userType ? getSteps(userType, formData) : [];

  // FR-0.7/D6: the atleta step list gains/loses the "Consentimento" step as
  // birth_date crosses the minor/adult boundary (see getSteps). If that
  // shrinks the list while currentStep pointed past the new end (e.g. user
  // went back to step 1 and changed birth_date after having moved forward),
  // clamp so the wizard never renders past the last step.
  useEffect(() => {
    setCurrentStep((s) => Math.min(s, Math.max(0, steps.length - 1)));
  }, [steps.length]);

  function handleChange(partial: Partial<FormData>) {
    setFormData((prev) => ({ ...prev, ...partial }));
  }

  async function handleFinish() {
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Sessao expirada. Faca login novamente.");
        router.push("/login");
        return;
      }

      if (!userType) {
        // Defensive guard: the "Concluir" button is only reachable once
        // userType has loaded (see the loading-state early return below),
        // but that temporal guarantee isn't visible to the type checker here.
        toast.error("Erro ao salvar dados. Tente novamente.");
        return;
      }

      const fullName =
        (user.user_metadata?.full_name as string | undefined) || user.email || "";

      if (userType === "atleta") {
        // FR-0.7/D6: a minor athlete cannot conclude onboarding without a
        // verifiable guardian consent — block here (in addition to the
        // "Consentimento" step only being reachable/shown for minors, see
        // getSteps) so a submit triggered before the checkbox/fields are
        // filled never reaches the insert below.
        const athleteIsMinor = isMinor(formData.birth_date);
        if (athleteIsMinor) {
          const guardianEmailValid = /\S+@\S+\.\S+/.test(
            formData.guardian_email ?? ""
          );
          const consentComplete =
            !!formData.guardian_full_name?.trim() &&
            guardianEmailValid &&
            !!formData.guardian_relationship &&
            formData.guardian_consent_checked === true;

          if (!consentComplete) {
            toast.error(
              "Para concluir o cadastro de um atleta menor de idade, preencha os dados do responsavel e confirme a autorizacao."
            );
            return;
          }
        }

        // NOTE: formData.current_entity is a free-text club name typed by the
        // athlete in this step; athletes.current_entity_id is a uuid FK and
        // there is no entity search/lookup here to resolve one from the
        // other, so it is intentionally not persisted (schema-vs-code
        // decision — see orchestrator report).
        const { data: insertedAthlete, error: athleteError } = await supabase
          .from("athletes")
          .insert({
            user_id: user.id,
            full_name: fullName,
            birth_date: formData.birth_date ?? null,
            gender: formData.gender ? GENDER_MAP[formData.gender] ?? null : null,
            state: formData.state ?? null,
            city: formData.city ?? null,
            primary_modality: formData.modality ?? null,
            competitive_level: formData.competition_level
              ? COMPETITION_LEVEL_MAP[formData.competition_level] ?? null
              : null,
          })
          .select("id")
          .single();

        if (athleteError) throw athleteError;

        // The guardian consent row can only be inserted once the athlete
        // row exists (guardian_consents.athlete_id FKs to athletes.id) —
        // profile_visibility itself is already forced to 'restricted' by the
        // BEFORE INSERT DB trigger regardless of this insert succeeding.
        if (athleteIsMinor && insertedAthlete) {
          const { error: consentError } = await supabase
            .from("guardian_consents")
            .insert({
              athlete_id: insertedAthlete.id,
              guardian_full_name: formData.guardian_full_name!.trim(),
              guardian_email: formData.guardian_email!.trim(),
              guardian_relationship: formData.guardian_relationship!,
              consent_type: "account",
            });

          if (consentError) throw consentError;
        }
      } else if (userType === "tecnico") {
        // NOTE: formData.linked_entity is a free-text entity name;
        // coaches.entity_id is a uuid FK with no lookup step here, so it is
        // intentionally not persisted (same rationale as current_entity above).
        await supabase.from("coaches").insert({
          user_id: user.id,
          full_name: fullName,
          specialization: formData.specialization ?? null,
          academic_background: formData.education ?? null,
          modalities: formData.modality ? [formData.modality] : [],
        });
      } else {
        // clube, federacao, confederacao
        // NOTE: the current `entities` schema has no column linking an
        // entity to the user who registered it, and no contact_email/
        // contact_phone/subtype columns — those fields are collected by the
        // wizard but not persisted here (schema gap — see orchestrator
        // report; entity self-registration also has no RLS INSERT policy
        // today, so this insert is rejected regardless).
        await supabase.from("entities").insert({
          name: formData.entity_name || ENTITY_TYPE_LABEL[userType],
          type: ENTITY_TYPE_MAP[userType],
          state: formData.state ?? null,
          city: formData.city ?? null,
          modalities:
            formData.modalities ?? (formData.modality ? [formData.modality] : []),
        });
      }

      // Mark onboarding complete
      await supabase.auth.updateUser({
        data: { onboarding_complete: true },
      });

      toast.success("Cadastro concluido!");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Erro ao salvar dados. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Loading state while fetching user type
  if (!userType) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#fafaf8]">
        <div className="flex items-center gap-3 text-[#0a1628]/40">
          <Activity className="size-5 animate-pulse text-[#009739]" />
          <span className="text-sm">Carregando...</span>
        </div>
      </div>
    );
  }

  const stepLabels = steps.map((s) => s.label);
  const totalSteps = steps.length;
  const isLastStep = currentStep === totalSteps - 1;
  const isConclusaoStep = steps[currentStep]?.label === "Conclusao";

  return (
    <div className="flex min-h-svh flex-col bg-[#fafaf8]">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#009739]">
            <Activity className="size-[18px] text-white" />
          </div>
          <span className="text-[15px] font-bold text-[#0a1628] tracking-tight">
            Brasil <span className="text-[#009739]">Atleta</span>
          </span>
        </div>
        <span className="text-xs text-[#0a1628]/30 font-medium">
          Passo {currentStep + 1} de {totalSteps}
        </span>
      </header>

      {/* Main content */}
      <main className="flex flex-1 items-start justify-center px-5 pb-16 pt-6 sm:px-8">
        <div className="w-full max-w-2xl">
          {/* Section header */}
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold tracking-tight text-[#0a1628]">
              Configure seu perfil
            </h1>
            <p className="mt-1.5 text-sm text-[#0a1628]/40">
              Preencha as informacoes abaixo para personalizar sua experiencia na plataforma.
            </p>
          </div>

          {/* Wizard card */}
          <div className="rounded-2xl border border-[#0a1628]/[0.06] bg-white p-6 shadow-sm sm:p-8">
            {/* Step progress */}
            <WizardSteps steps={stepLabels} currentStep={currentStep} />

            {/* Step title */}
            <div className="mb-6">
              <h2 className="text-base font-bold text-[#0a1628]">
                {steps[currentStep]?.label}
              </h2>
            </div>

            {/* Step content */}
            <div className="min-h-[200px]">
              {steps[currentStep]?.component(formData, handleChange)}
            </div>

            {/* Navigation */}
            <div className="mt-8 flex items-center justify-between border-t border-[#0a1628]/[0.06] pt-6">
              <Button
                type="button"
                onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                disabled={currentStep === 0}
                className="h-10 rounded-xl border border-[#0a1628]/[0.08] bg-white px-5 text-sm font-semibold text-[#0a1628]/60 shadow-none hover:bg-[#0a1628]/[0.03] hover:text-[#0a1628] disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Anterior
              </Button>

              {isLastStep ? (
                <Button
                  type="button"
                  onClick={handleFinish}
                  disabled={isSubmitting}
                  className="h-10 rounded-xl bg-[#009739] px-6 text-sm font-bold text-white border-none hover:bg-[#00b846] shadow-sm hover:shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Salvando..." : "Concluir"}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => setCurrentStep((s) => Math.min(totalSteps - 1, s + 1))}
                  className="h-10 rounded-xl bg-[#009739] px-6 text-sm font-bold text-white border-none hover:bg-[#00b846] shadow-sm hover:shadow-md transition-all"
                >
                  {isConclusaoStep ? "Concluir" : "Proximo"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
