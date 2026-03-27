"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PlusIcon, Search } from "lucide-react";
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

const resultSchema = z.object({
  competition_id: z.string().min(1, "Selecione uma competicao"),
  position: z
    .coerce
    .number()
    .int()
    .positive("Posicao deve ser um numero positivo")
    .optional()
    .or(z.literal("")),
  mark: z.string().optional(),
  mark_numeric: z.coerce.number().optional().or(z.literal("")),
  mark_unit: z.enum(["s", "m", "kg", "pts"]).optional(),
  category: z.string().optional(),
});

type ResultFormData = z.infer<typeof resultSchema>;

interface Competition {
  id: string;
  name: string;
  date_start?: string | null;
  location_state?: string | null;
}

interface AddResultDialogProps {
  athleteId: string;
}

export function AddResultDialog({ athleteId }: AddResultDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [competitionSearch, setCompetitionSearch] = useState("");
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

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

  const searchCompetitions = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setCompetitions([]);
      return;
    }
    setIsSearching(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("competitions")
        .select("id, name, date_start, location_state")
        .ilike("name", `%${query}%`)
        .limit(10);
      if (data) setCompetitions(data as Competition[]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => searchCompetitions(competitionSearch), 300);
    return () => clearTimeout(timeout);
  }, [competitionSearch, searchCompetitions]);

  const handleSelectCompetition = (comp: Competition) => {
    setSelectedCompetition(comp);
    setValue("competition_id", comp.id);
    setCompetitions([]);
    setCompetitionSearch(comp.name);
  };

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) {
      reset();
      setSelectedCompetition(null);
      setCompetitionSearch("");
      setCompetitions([]);
    }
  };

  const onSubmit = async (data: ResultFormData) => {
    setIsLoading(true);
    try {
      const supabase = createClient();

      const { error } = await supabase.from("results").insert({
        athlete_id: athleteId,
        competition_id: data.competition_id,
        position: data.position !== "" ? Number(data.position) : null,
        mark: data.mark || null,
        mark_numeric: data.mark_numeric !== "" ? Number(data.mark_numeric) : null,
        mark_unit: data.mark_unit || null,
        category: data.category || null,
        notes: null,
      });

      if (error) throw error;

      toast.success("Resultado adicionado! Seu perfil ficou mais completo.");
      handleOpenChange(false);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao registrar resultado";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button className="h-9 rounded-xl bg-[#0a1628] text-sm font-semibold text-white hover:bg-[#0a1628]/80 border-none gap-1.5">
            <PlusIcon className="size-4" />
            Adicionar Resultado
          </Button>
        }
      />

      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Resultado</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Competition Search */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-[#0a1628]/60 uppercase tracking-wider">
              Competicao
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Buscar competicao por nome..."
                value={competitionSearch}
                onChange={(e) => {
                  setCompetitionSearch(e.target.value);
                  if (
                    selectedCompetition &&
                    e.target.value !== selectedCompetition.name
                  ) {
                    setSelectedCompetition(null);
                    setValue("competition_id", "");
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

            {competitions.length > 0 && !selectedCompetition && (
              <div className="rounded-xl border border-[#0a1628]/[0.08] bg-white shadow-sm overflow-hidden">
                {competitions.map((comp) => (
                  <button
                    key={comp.id}
                    type="button"
                    onClick={() => handleSelectCompetition(comp)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left hover:bg-[#0a1628]/[0.04] transition-colors border-b border-[#0a1628]/[0.04] last:border-0"
                  >
                    <div>
                      <p className="font-medium text-foreground">{comp.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {comp.date_start ?? ""}
                        {comp.location_state ? ` · ${comp.location_state}` : ""}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <input type="hidden" {...register("competition_id")} />
            {errors.competition_id && (
              <p className="text-xs text-red-500">{errors.competition_id.message}</p>
            )}
          </div>

          {/* Position + Category */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="result-position" className="text-xs font-semibold text-[#0a1628]/60 uppercase tracking-wider">
                Posicao
              </Label>
              <Input
                id="result-position"
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

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-[#0a1628]/60 uppercase tracking-wider">
                Categoria
              </Label>
              <Input
                placeholder="Ex: Sub-17, Adulto"
                className="h-11 rounded-xl border-[#0a1628]/[0.08] bg-white text-sm"
                {...register("category")}
              />
            </div>
          </div>

          {/* Mark */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="result-mark" className="text-xs font-semibold text-[#0a1628]/60 uppercase tracking-wider">
              Marca
            </Label>
            <Input
              id="result-mark"
              placeholder="Ex: 9.58, 2:09:40, 8.95m"
              className="h-11 rounded-xl border-[#0a1628]/[0.08] bg-white text-sm"
              {...register("mark")}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="result-mark-numeric" className="text-xs font-semibold text-[#0a1628]/60 uppercase tracking-wider">
                Valor Numerico
              </Label>
              <Input
                id="result-mark-numeric"
                type="number"
                step="any"
                placeholder="Ex: 9.58"
                className="h-11 rounded-xl border-[#0a1628]/[0.08] bg-white text-sm"
                {...register("mark_numeric")}
              />
            </div>

            <div className="flex flex-col gap-1.5">
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
              {isLoading ? "Salvando..." : "Registrar Resultado"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
