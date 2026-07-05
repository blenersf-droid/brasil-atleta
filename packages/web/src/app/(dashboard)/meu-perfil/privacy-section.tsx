"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Globe, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/lib/supabase/client";
import { AuthorizePublicProfileDialog } from "./authorize-public-profile-dialog";
import type { Database } from "@/lib/database.types";

type ProfileVisibility = Database["public"]["Enums"]["athlete_profile_visibility"];

interface PrivacySectionProps {
  athleteId: string;
  visibility: ProfileVisibility;
  isMinorAthlete: boolean;
  hasPublicProfileConsent: boolean;
}

// D-B item 2: adults get a free public/restricted toggle. A minor without a
// guardian_consents(consent_type=public_profile) row is locked to restricted
// and only sees the opt-in dialog — once that consent exists, they behave
// like an adult here (can toggle either way afterwards; the DB trigger only
// blocks the *first* move to 'public', not subsequent ones).
export function PrivacySection({
  athleteId,
  visibility,
  isMinorAthlete,
  hasPublicProfileConsent,
}: PrivacySectionProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  const canToggleFreely = !isMinorAthlete || hasPublicProfileConsent;
  const isPublic = visibility === "public";

  async function handleToggle(nextPublic: boolean) {
    setIsUpdating(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("athletes")
        .update({ profile_visibility: nextPublic ? "public" : "restricted" })
        .eq("id", athleteId);

      if (error) throw error;

      toast.success(
        nextPublic
          ? "Perfil tornado publico."
          : "Perfil restrito — so voce pode ve-lo agora."
      );
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao atualizar privacidade";
      toast.error(message);
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Privacidade</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {canToggleFreely ? (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#0a1628]/[0.04]">
                {isPublic ? (
                  <Globe className="size-4 text-[#009739]" />
                ) : (
                  <Lock className="size-4 text-[#0a1628]/40" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0a1628]">
                  {isPublic ? "Perfil publico" : "Perfil restrito"}
                </p>
                <p className="mt-0.5 max-w-sm text-xs text-[#0a1628]/50">
                  Perfil publico significa que qualquer pessoa, mesmo sem
                  login, pode ver seus resultados, conquistas e avaliacoes na
                  sua pagina publica.
                </p>
              </div>
            </div>
            <Switch
              checked={isPublic}
              onCheckedChange={handleToggle}
              disabled={isUpdating}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3 rounded-xl border border-dashed border-[#0a1628]/[0.12] bg-[#0a1628]/[0.02] p-4">
              <Lock className="mt-0.5 size-4 shrink-0 text-[#0a1628]/40" />
              <p className="text-sm text-[#0a1628]/60">
                Perfil restrito — a publicacao depende de autorizacao do
                responsavel. Enquanto isso, so voce consegue ver seus proprios
                dados.
              </p>
            </div>
            <AuthorizePublicProfileDialog athleteId={athleteId} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
