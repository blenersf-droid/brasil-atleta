"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";

// FR-1.8/D6: registers the guardian's separate "public_profile" consent
// (distinct from the "account" consent captured at onboarding — see
// src/app/(auth)/onboarding/page.tsx's GuardianConsentStep) and, once that
// succeeds, flips athletes.profile_visibility to 'public'. The DB trigger
// (enforce_athlete_profile_visibility, 00007_lgpd_minors.sql) would reject
// that UPDATE for a minor without this consent row already existing, so the
// order here (insert consent, then update visibility) matters.
const consentSchema = z.object({
  guardian_full_name: z.string().min(1, "Nome do responsavel e obrigatorio"),
  guardian_email: z.string().email("Informe um e-mail valido"),
  guardian_relationship: z.enum(["mae", "pai", "tutor", "outro"], {
    message: "Selecione a relacao com o atleta",
  }),
  consent_checked: z.boolean().refine((v) => v === true, {
    message: "Confirme a autorizacao para continuar",
  }),
});

type ConsentFormData = z.infer<typeof consentSchema>;

const relationshipLabels: Record<
  ConsentFormData["guardian_relationship"],
  string
> = {
  mae: "Mae",
  pai: "Pai",
  tutor: "Tutor(a) legal",
  outro: "Outro responsavel legal",
};

interface AuthorizePublicProfileDialogProps {
  athleteId: string;
}

export function AuthorizePublicProfileDialog({
  athleteId,
}: AuthorizePublicProfileDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ConsentFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(consentSchema) as any,
    defaultValues: { consent_checked: false },
  });

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) reset({ consent_checked: false });
  };

  const onSubmit = async (data: ConsentFormData) => {
    setIsLoading(true);
    try {
      const supabase = createClient();

      const { error: consentError } = await supabase
        .from("guardian_consents")
        .insert({
          athlete_id: athleteId,
          guardian_full_name: data.guardian_full_name,
          guardian_email: data.guardian_email,
          guardian_relationship: data.guardian_relationship,
          consent_type: "public_profile",
        });
      if (consentError) throw consentError;

      const { error: visibilityError } = await supabase
        .from("athletes")
        .update({ profile_visibility: "public" })
        .eq("id", athleteId);
      if (visibilityError) throw visibilityError;

      toast.success("Autorizacao registrada — perfil agora e publico.");
      handleOpenChange(false);
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao registrar autorizacao";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button className="h-9 w-fit rounded-xl bg-[#009739] text-sm font-semibold text-white hover:bg-[#00b846] border-none gap-1.5">
            <ShieldCheck className="size-4" />
            Autorizar publicacao do perfil
          </Button>
        }
      />

      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Autorizacao do responsavel legal</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <p className="text-xs leading-relaxed text-[#0a1628]/50">
            Tornar o perfil publico permite que qualquer pessoa, mesmo sem
            login, veja o nome, os resultados, conquistas e avaliacoes do
            atleta na pagina publica. Essa autorizacao (LGPD, art. 14) fica
            registrada e pode ser revertida a qualquer momento, restringindo o
            perfil novamente.
          </p>

          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="consent-guardian-name"
              className="text-xs font-semibold text-[#0a1628]/60 uppercase tracking-wider"
            >
              Nome completo do responsavel
            </Label>
            <Input
              id="consent-guardian-name"
              className="h-11 rounded-xl border-[#0a1628]/[0.08] bg-white text-sm"
              {...register("guardian_full_name")}
              aria-invalid={!!errors.guardian_full_name}
            />
            {errors.guardian_full_name && (
              <p className="text-xs text-destructive">
                {errors.guardian_full_name.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="consent-guardian-email"
              className="text-xs font-semibold text-[#0a1628]/60 uppercase tracking-wider"
            >
              E-mail do responsavel
            </Label>
            <Input
              id="consent-guardian-email"
              type="email"
              className="h-11 rounded-xl border-[#0a1628]/[0.08] bg-white text-sm"
              {...register("guardian_email")}
              aria-invalid={!!errors.guardian_email}
            />
            {errors.guardian_email && (
              <p className="text-xs text-destructive">
                {errors.guardian_email.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-[#0a1628]/60 uppercase tracking-wider">
              Relacao com o atleta
            </Label>
            <Controller
              control={control}
              name="guardian_relationship"
              render={({ field }) => (
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                  <SelectTrigger
                    className="h-11 w-full rounded-xl border-[#0a1628]/[0.08] bg-white text-sm"
                    aria-invalid={!!errors.guardian_relationship}
                  >
                    <SelectValue placeholder="Selecionar relacao" />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.keys(
                        relationshipLabels
                      ) as ConsentFormData["guardian_relationship"][]
                    ).map((r) => (
                      <SelectItem key={r} value={r}>
                        {relationshipLabels[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.guardian_relationship && (
              <p className="text-xs text-destructive">
                {errors.guardian_relationship.message}
              </p>
            )}
          </div>

          <Controller
            control={control}
            name="consent_checked"
            render={({ field }) => (
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-[#009739] bg-[#009739]/[0.06] p-4">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  className="mt-0.5"
                />
                <span className="text-sm font-semibold leading-relaxed text-[#0a1628]">
                  Eu, na qualidade de responsavel legal, autorizo a publicacao
                  do perfil esportivo do atleta (nome, resultados, conquistas
                  e avaliacoes) na pagina publica da Brasil Atleta, nos termos
                  da LGPD (art. 14).
                </span>
              </label>
            )}
          />
          {errors.consent_checked && (
            <p className="text-xs text-destructive">
              {errors.consent_checked.message}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="rounded-xl bg-[#009739] text-white hover:bg-[#00b846] border-none"
            >
              {isLoading ? "Salvando..." : "Autorizar e tornar publico"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
