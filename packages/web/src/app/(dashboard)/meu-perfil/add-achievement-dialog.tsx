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
import { AchievementBadge, type AchievementType } from "@/components/athletes/achievement-badge";

const achievementSchema = z.object({
  title: z.string().min(1, "Titulo e obrigatorio"),
  competition_name: z.string().optional(),
  date: z.string().min(1, "Data e obrigatoria"),
  type: z.enum(["gold", "silver", "bronze", "participation", "record"], {
    message: "Selecione o tipo de conquista",
  }),
  description: z.string().optional(),
});

type AchievementFormData = z.infer<typeof achievementSchema>;

interface AddAchievementDialogProps {
  athleteId: string;
  triggerLabel?: string;
}

const typeLabels: Record<AchievementType, string> = {
  gold: "Ouro",
  silver: "Prata",
  bronze: "Bronze",
  participation: "Participacao",
  record: "Recorde",
};

export function AddAchievementDialog({
  athleteId,
  triggerLabel = "Adicionar Conquista",
}: AddAchievementDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previewType, setPreviewType] = useState<AchievementType | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<AchievementFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(achievementSchema) as any,
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
    },
  });

  const watchedTitle = watch("title");
  const watchedCompetition = watch("competition_name");

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) {
      reset({ date: new Date().toISOString().split("T")[0] });
      setPreviewType(null);
    }
  };

  const onSubmit = async (data: AchievementFormData) => {
    setIsLoading(true);
    try {
      const supabase = createClient();

      const { error } = await supabase.from("achievements").insert({
        athlete_id: athleteId,
        title: data.title,
        competition_name: data.competition_name || null,
        date: data.date,
        type: data.type,
        description: data.description || null,
        photo_url: null,
      });

      if (error) throw error;

      toast.success("Conquista registrada! Seu portfolio esta crescendo.");
      handleOpenChange(false);
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao registrar conquista";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button className="h-9 rounded-xl bg-amber-500 text-sm font-semibold text-white hover:bg-amber-600 border-none gap-1.5">
            <PlusIcon className="size-4" />
            {triggerLabel}
          </Button>
        }
      />

      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Conquista</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Preview Badge */}
          {previewType && watchedTitle && (
            <div className="rounded-xl bg-[#0a1628]/[0.02] p-3 border border-[#0a1628]/[0.06]">
              <p className="text-[10px] font-semibold text-[#0a1628]/40 uppercase tracking-wider mb-2">
                Previa do Badge
              </p>
              <AchievementBadge
                type={previewType}
                title={watchedTitle || "Titulo da conquista"}
                competition_name={watchedCompetition}
              />
            </div>
          )}

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="achievement-title" className="text-xs font-semibold text-[#0a1628]/60 uppercase tracking-wider">
              Titulo
            </Label>
            <Input
              id="achievement-title"
              placeholder="Ex: Campeon Estadual 100m"
              className="h-11 rounded-xl border-[#0a1628]/[0.08] bg-white text-sm"
              {...register("title")}
              aria-invalid={!!errors.title}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Competition Name + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="achievement-competition" className="text-xs font-semibold text-[#0a1628]/60 uppercase tracking-wider">
                Competicao
              </Label>
              <Input
                id="achievement-competition"
                placeholder="Nome da competicao"
                className="h-11 rounded-xl border-[#0a1628]/[0.08] bg-white text-sm"
                {...register("competition_name")}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="achievement-date" className="text-xs font-semibold text-[#0a1628]/60 uppercase tracking-wider">
                Data
              </Label>
              <Input
                id="achievement-date"
                type="date"
                className="h-11 rounded-xl border-[#0a1628]/[0.08] bg-white text-sm"
                {...register("date")}
                aria-invalid={!!errors.date}
              />
              {errors.date && (
                <p className="text-xs text-destructive">{errors.date.message}</p>
              )}
            </div>
          </div>

          {/* Type */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-[#0a1628]/60 uppercase tracking-wider">
              Tipo de Conquista
            </Label>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Select
                  value={field.value ?? ""}
                  onValueChange={(v) => {
                    if (v) {
                      field.onChange(v);
                      setPreviewType(v as AchievementType);
                    }
                  }}
                >
                  <SelectTrigger className="h-11 w-full rounded-xl border-[#0a1628]/[0.08] bg-white text-sm" aria-invalid={!!errors.type}>
                    <SelectValue placeholder="Selecionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(typeLabels) as AchievementType[]).map((t) => (
                      <SelectItem key={t} value={t}>
                        {typeLabels[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.type && (
              <p className="text-xs text-destructive">{errors.type.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="achievement-desc" className="text-xs font-semibold text-[#0a1628]/60 uppercase tracking-wider">
              Descricao <span className="font-normal text-[#0a1628]/30">(opcional)</span>
            </Label>
            <Input
              id="achievement-desc"
              placeholder="Conte um pouco sobre essa conquista..."
              className="h-11 rounded-xl border-[#0a1628]/[0.08] bg-white text-sm"
              {...register("description")}
            />
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
              className="rounded-xl bg-amber-500 text-white hover:bg-amber-600 border-none"
            >
              {isLoading ? "Salvando..." : "Registrar Conquista"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
