"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PlusIcon, Trash2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";

const ASSESSMENT_PROTOCOLS = [
  "Teste de Velocidade",
  "Teste de Resistencia",
  "Teste de Forca",
  "Teste de Agilidade",
  "Teste de Flexibilidade",
  "Outro",
];

const metricSchema = z.object({
  name: z.string().min(1, "Nome e obrigatorio"),
  value: z.string().min(1, "Valor e obrigatorio"),
});

const assessmentSchema = z.object({
  assessment_date: z.string().min(1, "Data e obrigatoria"),
  protocol: z.string().min(1, "Protocolo e obrigatorio"),
  metrics: z.array(metricSchema).min(1, "Adicione pelo menos uma metrica"),
});

type AssessmentFormData = z.infer<typeof assessmentSchema>;

interface AddAssessmentDialogProps {
  athleteId: string;
  athleteModality?: string;
}

export function AddAssessmentDialog({
  athleteId,
  athleteModality,
}: AddAssessmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [customProtocol, setCustomProtocol] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AssessmentFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(assessmentSchema) as any,
    defaultValues: {
      assessment_date: new Date().toISOString().split("T")[0],
      protocol: "",
      metrics: [{ name: "", value: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "metrics",
  });

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) {
      reset({
        assessment_date: new Date().toISOString().split("T")[0],
        protocol: "",
        metrics: [{ name: "", value: "" }],
      });
      setCustomProtocol(false);
    }
  };

  const onSubmit = async (data: AssessmentFormData) => {
    setIsLoading(true);
    try {
      const supabase = createClient();

      // Convert metrics array to jsonb object
      const metricsJsonb = data.metrics.reduce<Record<string, string>>(
        (acc, m) => {
          acc[m.name] = m.value;
          return acc;
        },
        {}
      );

      const { error } = await supabase.from("assessments").insert({
        athlete_id: athleteId,
        modality_code: athleteModality || null,
        assessment_date: data.assessment_date,
        protocol: data.protocol,
        metrics: metricsJsonb,
        evaluator_id: null,
        entity_id: null,
      });

      if (error) throw error;

      toast.success("Avaliacao registrada! Cada dado conta na sua evolucao.");
      handleOpenChange(false);
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao registrar avaliacao";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button className="h-9 rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 border-none gap-1.5">
            <PlusIcon className="size-4" />
            Adicionar Avaliacao
          </Button>
        }
      />

      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Avaliacao Fisica</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Date */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="assessment-date" className="text-xs font-semibold text-[#0a1628]/60 uppercase tracking-wider">
              Data da Avaliacao
            </Label>
            <Input
              id="assessment-date"
              type="date"
              className="h-11 rounded-xl border-[#0a1628]/[0.08] bg-white text-sm"
              {...register("assessment_date")}
              aria-invalid={!!errors.assessment_date}
            />
            {errors.assessment_date && (
              <p className="text-xs text-destructive">{errors.assessment_date.message}</p>
            )}
          </div>

          {/* Protocol */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-[#0a1628]/60 uppercase tracking-wider">
              Protocolo
            </Label>
            {customProtocol ? (
              <div className="flex gap-2">
                <Input
                  placeholder="Nome do protocolo"
                  className="h-11 rounded-xl border-[#0a1628]/[0.08] bg-white text-sm flex-1"
                  {...register("protocol")}
                  aria-invalid={!!errors.protocol}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCustomProtocol(false);
                    setValue("protocol", "");
                  }}
                  className="rounded-xl"
                >
                  Voltar
                </Button>
              </div>
            ) : (
              <Select
                onValueChange={(v: string | null) => {
                  if (!v) return;
                  if (v === "Outro") {
                    setCustomProtocol(true);
                    setValue("protocol", "");
                  } else {
                    setValue("protocol", v);
                  }
                }}
              >
                <SelectTrigger
                  className="h-11 w-full rounded-xl border-[#0a1628]/[0.08]"
                  aria-invalid={!!errors.protocol}
                >
                  <SelectValue placeholder="Selecionar protocolo" />
                </SelectTrigger>
                <SelectContent>
                  {ASSESSMENT_PROTOCOLS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.protocol && (
              <p className="text-xs text-destructive">{errors.protocol.message}</p>
            )}
          </div>

          {/* Metrics */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-[#0a1628]/60 uppercase tracking-wider">
                Metricas
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => append({ name: "", value: "" })}
                className="text-xs"
              >
                <PlusIcon className="size-3.5" />
                Adicionar metrica
              </Button>
            </div>

            <div className="flex flex-col gap-2 rounded-xl border border-[#0a1628]/[0.08] bg-[#0a1628]/[0.02] p-3">
              <div className="grid grid-cols-[1fr_1fr_28px] gap-2 px-1">
                <span className="text-xs font-medium text-[#0a1628]/50">Metrica</span>
                <span className="text-xs font-medium text-[#0a1628]/50">Valor</span>
                <span />
              </div>

              {fields.map((field, idx) => (
                <div
                  key={field.id}
                  className="grid grid-cols-[1fr_1fr_28px] items-center gap-2"
                >
                  <Input
                    placeholder="Ex: Velocidade"
                    className="h-8 rounded-lg border-[#0a1628]/[0.08] bg-white text-xs"
                    {...register(`metrics.${idx}.name`)}
                    aria-invalid={!!errors.metrics?.[idx]?.name}
                  />
                  <Input
                    placeholder="Ex: 9.8 m/s"
                    className="h-8 rounded-lg border-[#0a1628]/[0.08] bg-white text-xs font-mono"
                    {...register(`metrics.${idx}.value`)}
                    aria-invalid={!!errors.metrics?.[idx]?.value}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => remove(idx)}
                    disabled={fields.length <= 1}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}

              {typeof errors.metrics?.message === "string" && (
                <p className="text-xs text-destructive">{errors.metrics.message}</p>
              )}
            </div>
          </div>

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
              {isLoading ? "Salvando..." : "Registrar Avaliacao"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
