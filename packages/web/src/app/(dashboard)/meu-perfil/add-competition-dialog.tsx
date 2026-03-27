"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PlusIcon } from "lucide-react";
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
import { MODALITIES } from "@/lib/constants/modalities";
import { BRAZILIAN_STATES } from "@/lib/constants/states";

const competitionSchema = z.object({
  name: z.string().min(1, "Nome da competicao e obrigatorio"),
  date_start: z.string().min(1, "Data e obrigatoria"),
  location_state: z.string().min(1, "Estado e obrigatorio"),
  grade: z.enum(["school", "state", "national", "elite"], {
    message: "Selecione o grau da competicao",
  }),
  modality_code: z.string().min(1, "Modalidade e obrigatoria"),
});

type CompetitionFormData = z.infer<typeof competitionSchema>;

interface AddCompetitionDialogProps {
  athleteId: string;
  athleteModality: string;
}

export function AddCompetitionDialog({
  athleteId,
  athleteModality,
}: AddCompetitionDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CompetitionFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(competitionSchema) as any,
    defaultValues: {
      modality_code: athleteModality || "",
      date_start: new Date().toISOString().split("T")[0],
    },
  });

  const onSubmit = async (data: CompetitionFormData) => {
    setIsLoading(true);
    try {
      const supabase = createClient();

      const { error } = await supabase.from("competitions").insert({
        name: data.name,
        date_start: data.date_start,
        location_state: data.location_state,
        grade: data.grade,
        modality_code: data.modality_code,
        created_by_athlete_id: athleteId,
        status: "completed",
      });

      if (error) throw error;

      toast.success("Competicao adicionada! Seu portfolio ficou mais completo.");
      reset({
        modality_code: athleteModality || "",
        date_start: new Date().toISOString().split("T")[0],
      });
      setOpen(false);
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao adicionar competicao";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="h-9 rounded-xl bg-[#009739] text-sm font-semibold text-white hover:bg-[#00b846] border-none gap-1.5">
            <PlusIcon className="size-4" />
            Adicionar Competicao
          </Button>
        }
      />

      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Competicao</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="comp-name" className="text-xs font-semibold text-[#0a1628]/60 uppercase tracking-wider">
              Nome da Competicao
            </Label>
            <Input
              id="comp-name"
              placeholder="Ex: Campeonato Paulista de Atletismo"
              className="h-11 rounded-xl border-[#0a1628]/[0.08] bg-white text-sm"
              {...register("name")}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Date + State */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="comp-date" className="text-xs font-semibold text-[#0a1628]/60 uppercase tracking-wider">
                Data
              </Label>
              <Input
                id="comp-date"
                type="date"
                className="h-11 rounded-xl border-[#0a1628]/[0.08] bg-white text-sm"
                {...register("date_start")}
                aria-invalid={!!errors.date_start}
              />
              {errors.date_start && (
                <p className="text-xs text-destructive">{errors.date_start.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-[#0a1628]/60 uppercase tracking-wider">
                Estado
              </Label>
              <Controller
                control={control}
                name="location_state"
                render={({ field }) => (
                  <Select value={field.value ?? ""} onValueChange={field.onChange}>
                    <SelectTrigger className="h-11 w-full rounded-xl border-[#0a1628]/[0.08] bg-white text-sm" aria-invalid={!!errors.location_state}>
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent>
                      {BRAZILIAN_STATES.map((s) => (
                        <SelectItem key={s.uf} value={s.uf}>
                          {s.uf} — {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.location_state && (
                <p className="text-xs text-destructive">{errors.location_state.message}</p>
              )}
            </div>
          </div>

          {/* Grade */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-[#0a1628]/60 uppercase tracking-wider">
              Nivel da Competicao
            </Label>
            <Controller
              control={control}
              name="grade"
              render={({ field }) => (
                <Select value={field.value ?? ""} onValueChange={(v) => { if (v) setValue("grade", v as CompetitionFormData["grade"]); }}>
                  <SelectTrigger className="h-11 w-full rounded-xl border-[#0a1628]/[0.08] bg-white text-sm" aria-invalid={!!errors.grade}>
                    <SelectValue placeholder="Selecionar nivel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="school">Base Escolar</SelectItem>
                    <SelectItem value="state">Estadual</SelectItem>
                    <SelectItem value="national">Nacional</SelectItem>
                    <SelectItem value="elite">Alto Rendimento / Elite</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.grade && (
              <p className="text-xs text-destructive">{errors.grade.message}</p>
            )}
          </div>

          {/* Modality */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-[#0a1628]/60 uppercase tracking-wider">
              Modalidade
            </Label>
            <Controller
              control={control}
              name="modality_code"
              render={({ field }) => (
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                  <SelectTrigger className="h-11 w-full rounded-xl border-[#0a1628]/[0.08] bg-white text-sm" aria-invalid={!!errors.modality_code}>
                    <SelectValue placeholder="Selecionar modalidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {MODALITIES.map((m) => (
                      <SelectItem key={m.code} value={m.code}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.modality_code && (
              <p className="text-xs text-destructive">{errors.modality_code.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
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
              {isLoading ? "Salvando..." : "Adicionar Competicao"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
