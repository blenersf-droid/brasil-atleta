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
import type { Entity, EntityType } from "@/types/database";

const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  school: "Escola",
  club: "Clube",
  training_center: "Centro de Treinamento",
  federation: "Federacao",
  confederation: "Confederacao",
  committee: "Comite",
};

const createEntitySchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  type: z.enum([
    "school",
    "club",
    "training_center",
    "federation",
    "confederation",
    "committee",
  ]),
  state: z.string().min(2, "Estado e obrigatorio"),
  city: z.string().min(2, "Cidade e obrigatoria"),
  modalities: z.array(z.string()).min(1, "Selecione ao menos uma modalidade"),
  parent_entity_id: z.string().nullable().optional(),
});

type CreateEntityFormData = z.infer<typeof createEntitySchema>;

export function CreateEntityDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parentEntities, setParentEntities] = useState<Entity[]>([]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateEntityFormData>({
    resolver: zodResolver(createEntitySchema),
    defaultValues: {
      modalities: [],
      parent_entity_id: null,
    },
  });

  const selectedModalities = watch("modalities") ?? [];

  useEffect(() => {
    if (!open) return;
    const supabase = createClient();
    supabase
      .from("entities")
      .select("id, name, type")
      .order("name")
      .then(({ data }) => {
        if (data) setParentEntities(data as Entity[]);
      });
  }, [open]);

  const toggleModality = (code: string) => {
    const current = selectedModalities;
    if (current.includes(code)) {
      setValue(
        "modalities",
        current.filter((m) => m !== code),
        { shouldValidate: true }
      );
    } else {
      setValue("modalities", [...current, code], { shouldValidate: true });
    }
  };

  const onSubmit = async (data: CreateEntityFormData) => {
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("entities").insert({
        name: data.name,
        type: data.type,
        state: data.state,
        city: data.city,
        modalities: data.modalities,
        parent_entity_id: data.parent_entity_id ?? null,
        level: "municipal",
      });

      if (error) {
        toast.error("Erro ao criar entidade: " + error.message);
        return;
      }

      toast.success("Entidade criada com sucesso!");
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
            Nova Entidade
          </Button>
        }
      />

      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Entidade Esportiva</DialogTitle>
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
              placeholder="Nome da entidade"
              className="h-11 rounded-xl border-[#0a1628]/[0.08] bg-white text-sm"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#0a1628]/60 uppercase tracking-wider">
              Tipo
            </Label>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="h-11 w-full rounded-xl border-[#0a1628]/[0.08] bg-white text-sm">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ENTITY_TYPE_LABELS) as EntityType[]).map(
                      (type) => (
                        <SelectItem key={type} value={type}>
                          {ENTITY_TYPE_LABELS[type]}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.type && (
              <p className="text-xs text-red-500">{errors.type.message}</p>
            )}
          </div>

          {/* State + City */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#0a1628]/60 uppercase tracking-wider">
                Estado
              </Label>
              <Controller
                control={control}
                name="state"
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
              {errors.state && (
                <p className="text-xs text-red-500">{errors.state.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="city"
                className="text-xs font-semibold text-[#0a1628]/60 uppercase tracking-wider"
              >
                Cidade
              </Label>
              <Input
                id="city"
                placeholder="Nome da cidade"
                className="h-11 rounded-xl border-[#0a1628]/[0.08] bg-white text-sm"
                {...register("city")}
              />
              {errors.city && (
                <p className="text-xs text-red-500">{errors.city.message}</p>
              )}
            </div>
          </div>

          {/* Modalities */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#0a1628]/60 uppercase tracking-wider">
              Modalidades
            </Label>
            <div className="max-h-40 overflow-y-auto rounded-xl border border-[#0a1628]/[0.08] bg-white p-3">
              <div className="grid grid-cols-2 gap-1.5">
                {MODALITIES.map((mod) => {
                  const checked = selectedModalities.includes(mod.code);
                  return (
                    <label
                      key={mod.code}
                      className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors hover:bg-[#0a1628]/[0.04]"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleModality(mod.code)}
                        className="size-3.5 accent-[#009739]"
                      />
                      <span className="font-mono text-[10px] text-[#0a1628]/40">
                        {mod.code}
                      </span>
                      <span className="text-[#0a1628]/70">{mod.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            {errors.modalities && (
              <p className="text-xs text-red-500">
                {errors.modalities.message}
              </p>
            )}
          </div>

          {/* Parent Entity */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#0a1628]/60 uppercase tracking-wider">
              Entidade Pai (opcional)
            </Label>
            <Controller
              control={control}
              name="parent_entity_id"
              render={({ field }) => (
                <Select
                  value={field.value ?? "none"}
                  onValueChange={(val) =>
                    field.onChange(val === "none" ? null : val)
                  }
                >
                  <SelectTrigger className="h-11 w-full rounded-xl border-[#0a1628]/[0.08] bg-white text-sm">
                    <SelectValue placeholder="Nenhuma (entidade raiz)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma (entidade raiz)</SelectItem>
                    {parentEntities.map((entity) => (
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
              {isSubmitting ? "Salvando..." : "Criar Entidade"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
