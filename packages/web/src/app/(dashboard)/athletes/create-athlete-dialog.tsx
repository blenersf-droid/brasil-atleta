"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
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
import { cn } from "@/lib/utils";

const athleteSchema = z.object({
  full_name: z
    .string()
    .min(1, "Nome completo e obrigatorio")
    .min(3, "Nome deve ter pelo menos 3 caracteres"),
  birth_date: z.string().min(1, "Data de nascimento e obrigatoria"),
  gender: z.enum(["M", "F", "NB"], { message: "Selecione o genero" }),
  state: z.string().min(1, "Estado e obrigatorio"),
  city: z.string().min(1, "Cidade e obrigatoria"),
  primary_modality: z.string().min(1, "Modalidade principal e obrigatoria"),
  competitive_level: z.enum(["school", "state", "national", "elite"], {
    message: "Selecione o nivel competitivo",
  }),
  is_paralympic: z.boolean(),
  paralympic_functional_class: z.string().optional(),
  paralympic_disability_type: z.string().optional(),
});

type AthleteFormData = z.infer<typeof athleteSchema>;

export function CreateAthleteDialog() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AthleteFormData>({
    resolver: zodResolver(athleteSchema),
    defaultValues: {
      is_paralympic: false,
    },
  });

  const isParalympic = watch("is_paralympic");

  const onSubmit = async (data: AthleteFormData) => {
    setIsLoading(true);
    try {
      const supabase = createClient();

      const paralympic_classification =
        data.is_paralympic &&
        (data.paralympic_functional_class || data.paralympic_disability_type)
          ? {
              functional_class: data.paralympic_functional_class ?? null,
              disability_type: data.paralympic_disability_type ?? null,
            }
          : null;

      const { error } = await supabase.from("athletes").insert({
        full_name: data.full_name,
        birth_date: data.birth_date,
        gender: data.gender,
        state: data.state,
        city: data.city,
        primary_modality: data.primary_modality,
        secondary_modalities: [],
        competitive_level: data.competitive_level,
        status: "active",
        is_paralympic: data.is_paralympic,
        paralympic_classification,
        photo_url: null,
        current_entity_id: null,
        user_id: null,
      });

      if (error) throw error;

      toast.success("Atleta cadastrado com sucesso!");
      reset();
      setOpen(false);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao cadastrar atleta";
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
            Novo Atleta
          </Button>
        }
      />

      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar Atleta</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Full Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="full_name">Nome Completo</Label>
            <Input
              id="full_name"
              placeholder="Nome completo do atleta"
              {...register("full_name")}
              aria-invalid={!!errors.full_name}
            />
            {errors.full_name && (
              <p className="text-xs text-destructive">{errors.full_name.message}</p>
            )}
          </div>

          {/* Birth Date + Gender row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="birth_date">Data de Nascimento</Label>
              <Input
                id="birth_date"
                type="date"
                {...register("birth_date")}
                aria-invalid={!!errors.birth_date}
              />
              {errors.birth_date && (
                <p className="text-xs text-destructive">{errors.birth_date.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Genero</Label>
              <Select onValueChange={(v: string | null) => { if (v) setValue("gender", v as "M" | "F" | "NB"); }}>
                <SelectTrigger aria-invalid={!!errors.gender} className="w-full">
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Masculino</SelectItem>
                  <SelectItem value="F">Feminino</SelectItem>
                  <SelectItem value="NB">Nao-binario</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && (
                <p className="text-xs text-destructive">{errors.gender.message}</p>
              )}
            </div>
          </div>

          {/* State + City row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Estado</Label>
              <Select onValueChange={(v: string | null) => { if (v) setValue("state", v); }}>
                <SelectTrigger aria-invalid={!!errors.state} className="w-full">
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
              {errors.state && (
                <p className="text-xs text-destructive">{errors.state.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                placeholder="Cidade"
                {...register("city")}
                aria-invalid={!!errors.city}
              />
              {errors.city && (
                <p className="text-xs text-destructive">{errors.city.message}</p>
              )}
            </div>
          </div>

          {/* Primary Modality */}
          <div className="flex flex-col gap-1.5">
            <Label>Modalidade Principal</Label>
            <Select onValueChange={(v: string | null) => { if (v) setValue("primary_modality", v); }}>
              <SelectTrigger aria-invalid={!!errors.primary_modality} className="w-full">
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
            {errors.primary_modality && (
              <p className="text-xs text-destructive">{errors.primary_modality.message}</p>
            )}
          </div>

          {/* Competitive Level */}
          <div className="flex flex-col gap-1.5">
            <Label>Nivel Competitivo</Label>
            <Select
              onValueChange={(v: string | null) => {
                if (v) setValue("competitive_level", v as "school" | "state" | "national" | "elite");
              }}
            >
              <SelectTrigger aria-invalid={!!errors.competitive_level} className="w-full">
                <SelectValue placeholder="Selecionar nivel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="school">Base Escolar</SelectItem>
                <SelectItem value="state">Estadual</SelectItem>
                <SelectItem value="national">Nacional</SelectItem>
                <SelectItem value="elite">Alto Rendimento</SelectItem>
              </SelectContent>
            </Select>
            {errors.competitive_level && (
              <p className="text-xs text-destructive">{errors.competitive_level.message}</p>
            )}
          </div>

          {/* Paralympic Checkbox */}
          <div className="flex items-center gap-2">
            <input
              id="is_paralympic"
              type="checkbox"
              {...register("is_paralympic")}
              className="h-4 w-4 rounded border-input accent-primary"
            />
            <Label htmlFor="is_paralympic">Atleta Paralimpico</Label>
          </div>

          {/* Paralympic Conditional Fields */}
          {isParalympic && (
            <div
              className={cn(
                "flex flex-col gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3"
              )}
            >
              <p className="text-xs font-medium text-primary">
                Informacoes Paralimpicas
              </p>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="paralympic_functional_class">
                  Classificacao Funcional
                </Label>
                <Input
                  id="paralympic_functional_class"
                  placeholder="Ex: T11, F46, S3..."
                  {...register("paralympic_functional_class")}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="paralympic_disability_type">
                  Tipo de Deficiencia
                </Label>
                <Input
                  id="paralympic_disability_type"
                  placeholder="Ex: Visual, Fisica, Intelectual..."
                  {...register("paralympic_disability_type")}
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
              {isLoading ? "Salvando..." : "Cadastrar Atleta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
