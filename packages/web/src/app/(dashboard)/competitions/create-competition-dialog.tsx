"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
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
import type { Entity } from "@/types/database";

const competitionSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  date_start: z.string().min(1, "Data de inicio e obrigatoria"),
  date_end: z.string().optional(),
  location_state: z.string().min(1, "Estado e obrigatorio"),
  location_city: z.string().min(1, "Cidade e obrigatoria"),
  grade: z.enum(["school", "state", "national", "elite"], {
    message: "Selecione o grau",
  }),
  modality_code: z.string().min(1, "Modalidade e obrigatoria"),
  organizing_entity_id: z.string().nullable().optional(),
});

type CompetitionFormData = z.infer<typeof competitionSchema>;

export function CreateCompetitionDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [entities, setEntities] = useState<Entity[]>([]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CompetitionFormData>({
    resolver: zodResolver(competitionSchema),
    defaultValues: {
      organizing_entity_id: null,
    },
  });

  useEffect(() => {
    if (!open) return;
    const supabase = createClient();
    supabase
      .from("entities")
      .select("id, name, type")
      .order("name")
      .then(({ data }) => {
        if (data) setEntities(data as Entity[]);
      });
  }, [open]);

  const onSubmit = async (data: CompetitionFormData) => {
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("competitions").insert({
        name: data.name,
        date_start: data.date_start,
        date_end: data.date_end ?? null,
        location_state: data.location_state,
        location_city: data.location_city,
        grade: data.grade,
        modality_code: data.modality_code,
        organizing_entity_id: data.organizing_entity_id ?? null,
      });

      if (error) {
        toast.error("Erro ao criar competicao: " + error.message);
        return;
      }

      toast.success("Competicao criada com sucesso!");
      reset();
      setOpen(false);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="h-9 rounded-xl bg-[#009739] text-sm font-semibold text-white hover:bg-[#00b846] border-none gap-1.5">
            <Plus className="size-4" />
            Nova Competicao
          </Button>
        }
      />

      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Competicao</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label
              htmlFor="name"
              className="text-xs font-semibold text-[#0a1628]/60 uppercase tracking-wider"
            >
              Nome
            </Label>
            <Input
              id="name"
              placeholder="Nome da competicao"
              className="h-11 rounded-xl border-[#0a1628]/[0.08] bg-white text-sm"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Date Start + Date End */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="date_start"
                className="text-xs font-semibold text-[#0a1628]/60 uppercase tracking-wider"
              >
                Data de Inicio
              </Label>
              <Input
                id="date_start"
                type="date"
                className="h-11 rounded-xl border-[#0a1628]/[0.08] bg-white text-sm"
                {...register("date_start")}
              />
              {errors.date_start && (
                <p className="text-xs text-red-500">{errors.date_start.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="date_end"
                className="text-xs font-semibold text-[#0a1628]/60 uppercase tracking-wider"
              >
                Data de Fim (opcional)
              </Label>
              <Input
                id="date_end"
                type="date"
                className="h-11 rounded-xl border-[#0a1628]/[0.08] bg-white text-sm"
                {...register("date_end")}
              />
            </div>
          </div>

          {/* State + City */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#0a1628]/60 uppercase tracking-wider">
                Estado
              </Label>
              <Controller
                control={control}
                name="location_state"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-11 w-full rounded-xl border-[#0a1628]/[0.08] bg-white text-sm">
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent>
                      {BRAZILIAN_STATES.map((s) => (
                        <SelectItem key={s.uf} value={s.uf}>
                          {s.uf}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.location_state && (
                <p className="text-xs text-red-500">{errors.location_state.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="location_city"
                className="text-xs font-semibold text-[#0a1628]/60 uppercase tracking-wider"
              >
                Cidade
              </Label>
              <Input
                id="location_city"
                placeholder="Cidade"
                className="h-11 rounded-xl border-[#0a1628]/[0.08] bg-white text-sm"
                {...register("location_city")}
              />
              {errors.location_city && (
                <p className="text-xs text-red-500">{errors.location_city.message}</p>
              )}
            </div>
          </div>

          {/* Grade */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#0a1628]/60 uppercase tracking-wider">
              Grau
            </Label>
            <Controller
              control={control}
              name="grade"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-11 w-full rounded-xl border-[#0a1628]/[0.08] bg-white text-sm">
                    <SelectValue placeholder="Selecione o grau" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="school">Base Escolar</SelectItem>
                    <SelectItem value="state">Estadual</SelectItem>
                    <SelectItem value="national">Nacional</SelectItem>
                    <SelectItem value="elite">Elite</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.grade && (
              <p className="text-xs text-red-500">{errors.grade.message}</p>
            )}
          </div>

          {/* Modality */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#0a1628]/60 uppercase tracking-wider">
              Modalidade
            </Label>
            <Controller
              control={control}
              name="modality_code"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-11 w-full rounded-xl border-[#0a1628]/[0.08] bg-white text-sm">
                    <SelectValue placeholder="Selecione a modalidade" />
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
              <p className="text-xs text-red-500">{errors.modality_code.message}</p>
            )}
          </div>

          {/* Organizing Entity */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#0a1628]/60 uppercase tracking-wider">
              Entidade Organizadora (opcional)
            </Label>
            <Controller
              control={control}
              name="organizing_entity_id"
              render={({ field }) => (
                <Select
                  value={field.value ?? "none"}
                  onValueChange={(val) =>
                    field.onChange(val === "none" ? null : val)
                  }
                >
                  <SelectTrigger className="h-11 w-full rounded-xl border-[#0a1628]/[0.08] bg-white text-sm">
                    <SelectValue placeholder="Nenhuma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {entities.map((entity) => (
                      <SelectItem key={entity.id} value={entity.id}>
                        {entity.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-[#009739] text-white hover:bg-[#00b846] border-none"
            >
              {isSubmitting ? "Salvando..." : "Criar Competicao"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
