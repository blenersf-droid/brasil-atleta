"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";
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
import type { Athlete } from "@/types/database";

const resultSchema = z.object({
  athlete_id: z.string().min(1, "Atleta e obrigatorio"),
  position: z.coerce.number().int().positive("Posicao deve ser um numero positivo").optional().or(z.literal("")),
  mark: z.string().optional(),
  mark_numeric: z.coerce.number().optional().or(z.literal("")),
  mark_unit: z.enum(["s", "m", "kg", "pts"]).optional(),
  category: z.string().optional(),
});

type ResultFormData = z.infer<typeof resultSchema>;

interface AddResultDialogProps {
  competitionId: string;
}

export function AddResultDialog({ competitionId }: AddResultDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [athleteSearch, setAthleteSearch] = useState("");
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ResultFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(resultSchema) as any,
  });

  const searchAthletes = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setAthletes([]);
      return;
    }
    setIsSearching(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("athletes")
        .select("id, full_name, primary_modality, state")
        .ilike("full_name", `%${query}%`)
        .limit(10);
      if (data) setAthletes(data as Athlete[]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => searchAthletes(athleteSearch), 300);
    return () => clearTimeout(timeout);
  }, [athleteSearch, searchAthletes]);

  const handleSelectAthlete = (athlete: Athlete) => {
    setSelectedAthlete(athlete);
    setValue("athlete_id", athlete.id);
    setAthletes([]);
    setAthleteSearch(athlete.full_name);
  };

  const onSubmit = async (data: ResultFormData) => {
    setIsSubmitting(true);
    try {
      const supabase = createClient();

      // Check for duplicate result
      const { data: existing } = await supabase
        .from("results")
        .select("id")
        .eq("athlete_id", data.athlete_id)
        .eq("competition_id", competitionId)
        .maybeSingle();

      if (existing) {
        toast.error("Este atleta ja possui um resultado nesta competicao.");
        return;
      }

      const { error } = await supabase.from("results").insert({
        athlete_id: data.athlete_id,
        competition_id: competitionId,
        position: data.position !== "" ? Number(data.position) : null,
        mark: data.mark || null,
        mark_numeric: data.mark_numeric !== "" ? Number(data.mark_numeric) : null,
        mark_unit: data.mark_unit || null,
        category: data.category || null,
        notes: null,
      });

      if (error) {
        toast.error("Erro ao registrar resultado: " + error.message);
        return;
      }

      toast.success("Resultado registrado com sucesso!");
      reset();
      setSelectedAthlete(null);
      setAthleteSearch("");
      setOpen(false);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) {
      reset();
      setSelectedAthlete(null);
      setAthleteSearch("");
      setAthletes([]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button className="h-9 rounded-xl bg-[#009739] text-sm font-semibold text-white hover:bg-[#00b846] border-none gap-1.5">
            <Plus className="size-4" />
            Adicionar Resultado
          </Button>
        }
      />

      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Resultado</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Athlete Search */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#0a1628]/60 uppercase tracking-wider">
              Atleta
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Buscar atleta por nome..."
                value={athleteSearch}
                onChange={(e) => {
                  setAthleteSearch(e.target.value);
                  if (selectedAthlete && e.target.value !== selectedAthlete.full_name) {
                    setSelectedAthlete(null);
                    setValue("athlete_id", "");
                  }
                }}
                className="h-11 rounded-xl border-[#0a1628]/[0.08] bg-white text-sm pl-9"
              />
              {isSearching && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  Buscando...
                </span>
              )}
            </div>

            {/* Athlete dropdown results */}
            {athletes.length > 0 && !selectedAthlete && (
              <div className="rounded-xl border border-[#0a1628]/[0.08] bg-white shadow-sm overflow-hidden">
                {athletes.map((athlete) => (
                  <button
                    key={athlete.id}
                    type="button"
                    onClick={() => handleSelectAthlete(athlete)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left hover:bg-[#0a1628]/[0.04] transition-colors border-b border-[#0a1628]/[0.04] last:border-0"
                  >
                    <div>
                      <p className="font-medium text-foreground">{athlete.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {athlete.primary_modality} · {athlete.state}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Hidden input for validation */}
            <input type="hidden" {...register("athlete_id")} />
            {errors.athlete_id && (
              <p className="text-xs text-red-500">{errors.athlete_id.message}</p>
            )}
          </div>

          {/* Position + Category */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="position"
                className="text-xs font-semibold text-[#0a1628]/60 uppercase tracking-wider"
              >
                Posicao
              </Label>
              <Input
                id="position"
                type="number"
                min={1}
                placeholder="Ex: 1"
                className="h-11 rounded-xl border-[#0a1628]/[0.08] bg-white text-sm"
                {...register("position")}
              />
              {errors.position && (
                <p className="text-xs text-red-500">{errors.position.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#0a1628]/60 uppercase tracking-wider">
                Categoria
              </Label>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select value={field.value ?? ""} onValueChange={field.onChange}>
                    <SelectTrigger className="h-11 w-full rounded-xl border-[#0a1628]/[0.08] bg-white text-sm">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sub-15">Sub-15</SelectItem>
                      <SelectItem value="sub-17">Sub-17</SelectItem>
                      <SelectItem value="adulto">Adulto</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Mark + Mark Numeric + Mark Unit */}
          <div className="space-y-1.5">
            <Label
              htmlFor="mark"
              className="text-xs font-semibold text-[#0a1628]/60 uppercase tracking-wider"
            >
              Marca
            </Label>
            <Input
              id="mark"
              placeholder="Ex: 9.58, 2:09:40, 8.95m"
              className="h-11 rounded-xl border-[#0a1628]/[0.08] bg-white text-sm"
              {...register("mark")}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="mark_numeric"
                className="text-xs font-semibold text-[#0a1628]/60 uppercase tracking-wider"
              >
                Valor Numerico
              </Label>
              <Input
                id="mark_numeric"
                type="number"
                step="any"
                placeholder="Ex: 9.58"
                className="h-11 rounded-xl border-[#0a1628]/[0.08] bg-white text-sm"
                {...register("mark_numeric")}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#0a1628]/60 uppercase tracking-wider">
                Unidade
              </Label>
              <Controller
                control={control}
                name="mark_unit"
                render={({ field }) => (
                  <Select value={field.value ?? ""} onValueChange={field.onChange}>
                    <SelectTrigger className="h-11 w-full rounded-xl border-[#0a1628]/[0.08] bg-white text-sm">
                      <SelectValue placeholder="Unidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="s">s (segundos)</SelectItem>
                      <SelectItem value="m">m (metros)</SelectItem>
                      <SelectItem value="kg">kg (quilogramas)</SelectItem>
                      <SelectItem value="pts">pts (pontos)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-[#009739] text-white hover:bg-[#00b846] border-none"
            >
              {isSubmitting ? "Salvando..." : "Registrar Resultado"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
