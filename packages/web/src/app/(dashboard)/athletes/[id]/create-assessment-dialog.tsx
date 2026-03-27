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
import { cn } from "@/lib/utils";

const COMMON_PROTOCOLS = [
  "Teste de Velocidade",
  "Teste de Resistencia",
  "Teste de Forca",
  "Teste de Flexibilidade",
  "Teste de Agilidade",
  "Avaliacao Fisica Geral",
  "Teste Tecnico Especifico",
];

const metricSchema = z.object({
  name: z.string().min(1, "Nome e obrigatorio"),
  value: z.preprocess(
    (v) => (typeof v === "string" ? parseFloat(v as string) : v),
    z.number().finite()
  ),
  unit: z.string().optional(),
});

const assessmentSchema = z.object({
  assessment_date: z.string().min(1, "Data e obrigatoria"),
  protocol: z.string().min(1, "Protocolo e obrigatorio"),
  metrics: z.array(metricSchema).min(1, "Adicione pelo menos uma metrica"),
  functional_class: z.string().optional(),
  adaptations: z.string().optional(),
});

type AssessmentFormData = {
  assessment_date: string;
  protocol: string;
  metrics: { name: string; value: number; unit?: string }[];
  functional_class?: string;
  adaptations?: string;
};

interface CreateAssessmentDialogProps {
  athleteId: string;
  modalityCode: string;
  isParalympic: boolean;
}

export function CreateAssessmentDialog({
  athleteId,
  modalityCode,
  isParalympic,
}: CreateAssessmentDialogProps) {
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
      metrics: [
        { name: "Velocidade", value: 0, unit: "m/s" },
        { name: "Resistencia", value: 0, unit: "min" },
        { name: "Forca", value: 0, unit: "kg" },
        { name: "Flexibilidade", value: 0, unit: "cm" },
        { name: "Agilidade", value: 0, unit: "s" },
      ],
      functional_class: "",
      adaptations: "",
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "metrics" });

  const onSubmit = async (data: AssessmentFormData) => {
    setIsLoading(true);
    try {
      const supabase = createClient();

      // Convert metrics array to jsonb object
      const metricsJsonb = data.metrics.reduce<Record<string, { value: number; unit: string }>>(
        (acc, m) => {
          acc[m.name] = { value: m.value, unit: m.unit ?? "" };
          return acc;
        },
        {}
      );

      const payload: Record<string, unknown> = {
        athlete_id: athleteId,
        modality_code: modalityCode,
        assessment_date: data.assessment_date,
        protocol: data.protocol,
        metrics: metricsJsonb,
        evaluator_id: null,
        entity_id: null,
      };

      // Append paralympic info into metrics if applicable
      if (isParalympic && data.functional_class) {
        metricsJsonb["_functional_class"] = {
          value: 0,
          unit: data.functional_class,
        };
      }
      if (isParalympic && data.adaptations) {
        metricsJsonb["_adaptations"] = {
          value: 0,
          unit: data.adaptations,
        };
      }

      const { error } = await supabase.from("assessments").insert(payload);

      if (error) throw error;

      toast.success("Avaliacao registrada com sucesso!");
      reset();
      setOpen(false);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao registrar avaliacao";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <PlusIcon />
            Nova Avaliacao
          </Button>
        }
      />

      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Avaliacao Fisica</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Date */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="assessment_date">Data da Avaliacao</Label>
            <Input
              id="assessment_date"
              type="date"
              className="h-11 rounded-xl border-[#0a1628]/[0.08] bg-white text-sm"
              {...register("assessment_date")}
              aria-invalid={!!errors.assessment_date}
            />
            {errors.assessment_date && (
              <p className="text-xs text-destructive">{errors.assessment_date.message}</p>
            )}
          </div>

          {/* Modality (read-only) */}
          <div className="flex flex-col gap-1.5">
            <Label>Modalidade</Label>
            <Input
              value={modalityCode}
              disabled
              className="h-11 rounded-xl border-[#0a1628]/[0.08] bg-[#0a1628]/[0.03] text-sm font-mono text-[#0a1628]/60"
            />
          </div>

          {/* Protocol */}
          <div className="flex flex-col gap-1.5">
            <Label>Protocolo</Label>
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
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <Select
                onValueChange={(v: string | null) => {
                  if (!v) return;
                  if (v === "__custom__") {
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
                  {COMMON_PROTOCOLS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                  <SelectItem value="__custom__">Outro (personalizado)...</SelectItem>
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
              <Label>Metricas</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => append({ name: "", value: 0, unit: "" })}
              >
                <PlusIcon className="size-3.5" />
                Adicionar
              </Button>
            </div>

            <div className="flex flex-col gap-2 rounded-xl border border-[#0a1628]/[0.08] bg-[#0a1628]/[0.02] p-3">
              {/* Headers */}
              <div className="grid grid-cols-[1fr_80px_60px_28px] gap-2 px-1">
                <span className="text-xs font-medium text-[#0a1628]/50">Metrica</span>
                <span className="text-xs font-medium text-[#0a1628]/50">Valor</span>
                <span className="text-xs font-medium text-[#0a1628]/50">Unidade</span>
                <span />
              </div>

              {fields.map((field, idx) => (
                <div
                  key={field.id}
                  className="grid grid-cols-[1fr_80px_60px_28px] items-center gap-2"
                >
                  <Input
                    placeholder="Ex: Velocidade"
                    className="h-8 rounded-lg border-[#0a1628]/[0.08] bg-white text-xs"
                    {...register(`metrics.${idx}.name`)}
                    aria-invalid={!!errors.metrics?.[idx]?.name}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    className="h-8 rounded-lg border-[#0a1628]/[0.08] bg-white text-xs font-mono"
                    {...register(`metrics.${idx}.value`)}
                    aria-invalid={!!errors.metrics?.[idx]?.value}
                  />
                  <Input
                    placeholder="m/s"
                    className="h-8 rounded-lg border-[#0a1628]/[0.08] bg-white text-xs"
                    {...register(`metrics.${idx}.unit`)}
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

              {errors.metrics?.root?.message && (
                <p className="text-xs text-destructive">{errors.metrics.root.message}</p>
              )}
            </div>
          </div>

          {/* Paralympic fields */}
          {isParalympic && (
            <div
              className={cn(
                "flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3"
              )}
            >
              <p className="text-xs font-medium text-primary">
                Informacoes Paralimpicas (opcional)
              </p>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="functional_class">Classe Funcional</Label>
                <Input
                  id="functional_class"
                  placeholder="Ex: T11, F46, S3..."
                  className="h-11 rounded-xl border-[#0a1628]/[0.08] bg-white text-sm"
                  {...register("functional_class")}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="adaptations">Adaptacoes Necessarias</Label>
                <Input
                  id="adaptations"
                  placeholder="Ex: Rampa de partida, guia visual..."
                  className="h-11 rounded-xl border-[#0a1628]/[0.08] bg-white text-sm"
                  {...register("adaptations")}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Registrar Avaliacao"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
