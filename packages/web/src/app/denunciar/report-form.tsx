"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";

// FR-0.9/D6: abuse/report channel. Works for anonymous visitors — the
// abuse_reports RLS policy ("anyone_insert_abuse_reports",
// 00007_lgpd_minors.sql) grants INSERT to both anon and authenticated, with
// no SELECT back for the reporter (only admin can read reports), so this
// form never tries to read back what it just inserted.
const reportSchema = z.object({
  category: z.enum(
    ["abordagem_inadequada", "perfil_falso", "conteudo_inadequado", "outro"],
    { message: "Selecione uma categoria" }
  ),
  description: z
    .string()
    .min(10, "Descreva com um pouco mais de detalhe (minimo 10 caracteres)"),
  reporter_email: z
    .union([z.literal(""), z.string().email("Informe um e-mail valido")])
    .optional(),
});

type ReportFormData = z.infer<typeof reportSchema>;

const categoryLabels: Record<ReportFormData["category"], string> = {
  abordagem_inadequada: "Abordagem inadequada",
  perfil_falso: "Perfil falso",
  conteudo_inadequado: "Conteudo inadequado",
  outro: "Outro",
};

interface ReportFormProps {
  initialSlug?: string;
}

export function ReportForm({ initialSlug }: ReportFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ReportFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(reportSchema) as any,
  });

  const onSubmit = async (data: ReportFormData) => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("abuse_reports").insert({
        reported_athlete_slug: initialSlug || null,
        reporter_email: data.reporter_email || null,
        category: data.category,
        description: data.description,
      });

      if (error) throw error;

      setSubmitted(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao enviar denuncia";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-[#009739]/10">
          <CheckCircle2 className="size-7 text-[#009739]" />
        </div>
        <h2 className="text-lg font-bold text-[#0a1628]">Denuncia enviada</h2>
        <p className="max-w-sm text-sm text-[#0a1628]/50">
          Obrigado por ajudar a manter a plataforma segura. Nossa equipe vai
          analisar as informacoes enviadas.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {initialSlug && (
        <div className="rounded-xl bg-[#0a1628]/[0.03] px-3 py-2 text-xs text-[#0a1628]/50">
          Perfil relacionado: <span className="font-mono">{initialSlug}</span>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-semibold text-[#0a1628]/60 uppercase tracking-wider">
          Categoria
        </Label>
        <Controller
          control={control}
          name="category"
          render={({ field }) => (
            <Select value={field.value ?? ""} onValueChange={field.onChange}>
              <SelectTrigger
                className="h-11 w-full rounded-xl border-[#0a1628]/[0.08] bg-white text-sm"
                aria-invalid={!!errors.category}
              >
                <SelectValue placeholder="Selecione o motivo da denuncia" />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.keys(categoryLabels) as ReportFormData["category"][]
                ).map((c) => (
                  <SelectItem key={c} value={c}>
                    {categoryLabels[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.category && (
          <p className="text-xs text-destructive">{errors.category.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor="report-description"
          className="text-xs font-semibold text-[#0a1628]/60 uppercase tracking-wider"
        >
          Descricao
        </Label>
        <Textarea
          id="report-description"
          placeholder="Descreva o que aconteceu..."
          className="min-h-[110px] rounded-xl border-[#0a1628]/[0.08] bg-white text-sm"
          {...register("description")}
          aria-invalid={!!errors.description}
        />
        {errors.description && (
          <p className="text-xs text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor="reporter-email"
          className="text-xs font-semibold text-[#0a1628]/60 uppercase tracking-wider"
        >
          Seu e-mail{" "}
          <span className="font-normal normal-case text-[#0a1628]/30">
            (opcional)
          </span>
        </Label>
        <Input
          id="reporter-email"
          type="email"
          placeholder="seu@email.com"
          className="h-11 rounded-xl border-[#0a1628]/[0.08] bg-white text-sm"
          {...register("reporter_email")}
          aria-invalid={!!errors.reporter_email}
        />
        {errors.reporter_email && (
          <p className="text-xs text-destructive">
            {errors.reporter_email.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="mt-2 h-11 rounded-xl bg-[#009739] text-sm font-bold text-white hover:bg-[#00b846] border-none"
      >
        {isLoading ? "Enviando..." : "Enviar denuncia"}
      </Button>
    </form>
  );
}
