"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

// ── Profile Form ──────────────────────────────────────────────────────────────

const profileSchema = z.object({
  full_name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
});

type ProfileValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  initialName: string;
  email: string;
}

export function ProfileForm({ initialName, email }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: initialName },
  });

  async function onSubmit(values: ProfileValues) {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        data: { full_name: values.full_name },
      });
      if (error) throw error;
      toast.success("Nome atualizado com sucesso!");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao salvar";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="full_name">Nome completo</Label>
        <Input
          id="full_name"
          className="h-11 rounded-xl border-[#0a1628]/[0.08] bg-white text-sm"
          {...register("full_name")}
          aria-invalid={!!errors.full_name}
        />
        {errors.full_name && (
          <p className="text-xs text-destructive">{errors.full_name.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          readOnly
          disabled
          className="h-11 rounded-xl border-[#0a1628]/[0.08] bg-white text-sm opacity-60"
        />
        <p className="text-xs text-muted-foreground">
          O email nao pode ser alterado.
        </p>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="size-4 animate-spin" />}
          Salvar alteracoes
        </Button>
      </div>
    </form>
  );
}

// ── Password Form ─────────────────────────────────────────────────────────────

const passwordSchema = z
  .object({
    new_password: z
      .string()
      .min(8, "A senha deve ter ao menos 8 caracteres"),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "As senhas nao conferem",
    path: ["confirm_password"],
  });

type PasswordValues = z.infer<typeof passwordSchema>;

export function PasswordForm() {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      new_password: "",
      confirm_password: "",
    },
  });

  async function onSubmit(values: PasswordValues) {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: values.new_password,
      });
      if (error) throw error;
      toast.success("Senha atualizada com sucesso!");
      reset();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao atualizar senha";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new_password">Nova senha</Label>
        <Input
          id="new_password"
          type="password"
          placeholder="Minimo 8 caracteres"
          className="h-11 rounded-xl border-[#0a1628]/[0.08] bg-white text-sm"
          {...register("new_password")}
          aria-invalid={!!errors.new_password}
        />
        {errors.new_password && (
          <p className="text-xs text-destructive">{errors.new_password.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirm_password">Confirmar nova senha</Label>
        <Input
          id="confirm_password"
          type="password"
          placeholder="Repita a nova senha"
          className="h-11 rounded-xl border-[#0a1628]/[0.08] bg-white text-sm"
          {...register("confirm_password")}
          aria-invalid={!!errors.confirm_password}
        />
        {errors.confirm_password && (
          <p className="text-xs text-destructive">
            {errors.confirm_password.message}
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="size-4 animate-spin" />}
          Alterar senha
        </Button>
      </div>
    </form>
  );
}
