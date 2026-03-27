"use client";

import { useState } from "react";
import Link from "next/link";
import { Activity, ArrowLeft, UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import {
  registerSchema,
  RegisterFormData,
  USER_TYPE_LABELS,
} from "@/lib/validations/auth";

export default function CriarContaPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterFormData) {
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
            user_type: data.user_type,
          },
        },
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Conta criada! Verifique seu e-mail para confirmar.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-svh">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[45%] relative bg-[#0a1628] overflow-hidden">
        {/* Grid pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
        {/* Radial glows */}
        <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-[#009739]/10 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-[#002776]/15 blur-[80px]" />
        <div className="pointer-events-none absolute top-0 right-0 h-[200px] w-[200px] rounded-full bg-[#FEDD00]/5 blur-[60px]" />

        {/* Pulse rings */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="h-[200px] w-[200px] rounded-full border border-[#009739]/8 animate-[ping_5s_ease-in-out_infinite]" />
        </div>

        <div className="relative flex flex-col justify-between w-full p-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#009739]">
              <Activity className="size-[18px] text-white" />
            </div>
            <span className="text-[15px] font-bold text-white tracking-tight">
              Brasil <span className="text-[#FEDD00]">Atleta</span>
            </span>
          </div>

          {/* Central content */}
          <div className="max-w-sm">
            <h2 className="text-4xl font-extrabold tracking-tighter text-white leading-[1.05]">
              Junte-se a plataforma
              <br />
              que transforma
              <br />
              <span className="text-[#009739]">o esporte brasileiro.</span>
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-white/35">
              Plataforma nacional de integração e monitoramento de atletas olímpicos e paralímpicos. Dados unificados para 27 estados e 40+ modalidades.
            </p>
          </div>

          {/* Bottom stats */}
          <div className="flex items-center gap-6">
            {[
              { value: "27", label: "Estados" },
              { value: "40+", label: "Modalidades" },
              { value: "100K", label: "Atletas" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="font-mono text-xl font-bold text-[#009739]">
                  {stat.value}
                </div>
                <div className="text-[11px] text-white/30">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col bg-[#fafaf8]">
        {/* Top bar */}
        <div className="flex items-center justify-between p-5 sm:p-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-[#0a1628]/40 transition-colors hover:text-[#0a1628]/70"
          >
            <ArrowLeft className="size-3.5" />
            Voltar
          </Link>

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#009739]">
              <Activity className="size-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-[#0a1628] tracking-tight">
              Brasil <span className="text-[#FEDD00]">Atleta</span>
            </span>
          </div>

          <div className="w-16" />
        </div>

        {/* Form area */}
        <div className="flex flex-1 items-center justify-center px-5 sm:px-8 pb-12">
          <div className="w-full max-w-[380px]">
            {/* Form header */}
            <div className="mb-8">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#0a1628]/[0.06] bg-white mb-5 shadow-sm">
                <UserPlus className="size-5 text-[#0a1628]/40" />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#0a1628]">
                Criar sua conta
              </h1>
              <p className="mt-1.5 text-sm text-[#0a1628]/40">
                Preencha os dados para se registrar na plataforma
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Full name */}
              <div className="space-y-2">
                <Label
                  htmlFor="full_name"
                  className="text-xs font-semibold text-[#0a1628]/60 uppercase tracking-wider"
                >
                  Nome Completo
                </Label>
                <Input
                  id="full_name"
                  type="text"
                  placeholder="Seu nome completo"
                  autoComplete="name"
                  className="h-11 rounded-xl border-[#0a1628]/[0.08] bg-white text-sm placeholder:text-[#0a1628]/25 focus:border-[#009739] focus:ring-[#009739]/20"
                  {...register("full_name")}
                />
                {errors.full_name && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.full_name.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-xs font-semibold text-[#0a1628]/60 uppercase tracking-wider"
                >
                  E-Mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com.br"
                  autoComplete="email"
                  className="h-11 rounded-xl border-[#0a1628]/[0.08] bg-white text-sm placeholder:text-[#0a1628]/25 focus:border-[#009739] focus:ring-[#009739]/20"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-xs font-semibold text-[#0a1628]/60 uppercase tracking-wider"
                >
                  Senha
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
                  Confirmar Senha
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

              {/* User type */}
              <div className="space-y-2">
                <Label
                  htmlFor="user_type"
                  className="text-xs font-semibold text-[#0a1628]/60 uppercase tracking-wider"
                >
                  Tipo de Usuario
                </Label>
                <select
                  id="user_type"
                  className="h-11 w-full rounded-xl border border-[#0a1628]/[0.08] bg-white px-3 text-sm text-[#0a1628] focus:border-[#009739] focus:outline-none focus:ring-2 focus:ring-[#009739]/20 disabled:pointer-events-none disabled:opacity-50"
                  {...register("user_type")}
                >
                  <option value="" disabled>
                    Selecione o tipo de usuario
                  </option>
                  {Object.entries(USER_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                {errors.user_type && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.user_type.message}
                  </p>
                )}
              </div>

              {/* Accept terms */}
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <input
                    id="accept_terms"
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#0a1628]/[0.20] text-[#009739] accent-[#009739] focus:ring-[#009739]/20"
                    {...register("accept_terms")}
                  />
                  <Label
                    htmlFor="accept_terms"
                    className="text-xs font-normal text-[#0a1628]/60 normal-case tracking-normal leading-relaxed cursor-pointer"
                  >
                    Li e aceito os{" "}
                    <Link
                      href="/termos-de-uso"
                      className="font-semibold text-[#009739] hover:text-[#00b846] transition-colors"
                    >
                      Termos de Uso
                    </Link>{" "}
                    e a{" "}
                    <Link
                      href="/politica-de-privacidade"
                      className="font-semibold text-[#009739] hover:text-[#00b846] transition-colors"
                    >
                      Politica de Privacidade
                    </Link>
                  </Label>
                </div>
                {errors.accept_terms && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.accept_terms.message}
                  </p>
                )}
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 w-full rounded-xl bg-[#009739] text-sm font-bold text-white hover:bg-[#00b846] border-none transition-all shadow-sm hover:shadow-md disabled:opacity-60"
              >
                {isSubmitting ? "Criando conta..." : "Criar conta"}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-7">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#0a1628]/[0.06]" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[#fafaf8] px-3 text-[11px] font-medium text-[#0a1628]/25 uppercase tracking-wider">
                  ou
                </span>
              </div>
            </div>

            {/* Login link */}
            <div className="text-center">
              <p className="text-sm text-[#0a1628]/40">
                Ja tem acesso?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-[#009739] hover:text-[#00b846] transition-colors"
                >
                  Entrar
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
