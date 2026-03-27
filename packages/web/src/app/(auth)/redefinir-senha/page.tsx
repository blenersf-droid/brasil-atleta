"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import {
  resetPasswordSchema,
  ResetPasswordFormData,
} from "@/lib/validations/auth";

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  async function onSubmit(data: ResetPasswordFormData) {
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Senha redefinida com sucesso!");
        router.push("/login");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-[#fafaf8] px-5">
      <div className="w-full max-w-[380px]">
        {/* Card */}
        <div className="rounded-2xl border border-[#0a1628]/[0.06] bg-white p-8 shadow-sm">
          {/* Header */}
          <div className="mb-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#0a1628]/[0.06] bg-[#fafaf8] mb-5 shadow-sm">
              <KeyRound className="size-5 text-[#0a1628]/40" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#0a1628]">
              Redefinir senha
            </h1>
            <p className="mt-1.5 text-sm text-[#0a1628]/40">
              Crie uma nova senha para sua conta
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* New password */}
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-xs font-semibold text-[#0a1628]/60 uppercase tracking-wider"
              >
                Nova Senha
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                className="h-11 rounded-xl border-[#0a1628]/[0.08] bg-white text-sm placeholder:text-[#0a1628]/25 focus:border-[#009739] focus:ring-[#009739]/20"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm password */}
            <div className="space-y-2">
              <Label
                htmlFor="confirm_password"
                className="text-xs font-semibold text-[#0a1628]/60 uppercase tracking-wider"
              >
                Confirmar Nova Senha
              </Label>
              <Input
                id="confirm_password"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                className="h-11 rounded-xl border-[#0a1628]/[0.08] bg-white text-sm placeholder:text-[#0a1628]/25 focus:border-[#009739] focus:ring-[#009739]/20"
                {...register("confirm_password")}
              />
              {errors.confirm_password && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.confirm_password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-11 w-full rounded-xl bg-[#009739] text-sm font-bold text-white hover:bg-[#00b846] border-none transition-all shadow-sm hover:shadow-md disabled:opacity-60"
            >
              {isSubmitting ? "Redefinindo..." : "Redefinir senha"}
            </Button>
          </form>
        </div>

        {/* Branding footer */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#009739]">
            <span className="text-[10px] font-black text-white">BA</span>
          </div>
          <span className="text-xs font-bold text-[#0a1628]/40 tracking-tight">
            Brasil <span className="text-[#FEDD00]">Atleta</span>
          </span>
        </div>
      </div>
    </div>
  );
}
