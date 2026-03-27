import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "E-mail e obrigatorio")
    .email("E-mail invalido"),
  password: z
    .string()
    .min(1, "Senha e obrigatoria")
    .min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    full_name: z
      .string()
      .min(1, "Nome completo e obrigatorio")
      .min(3, "Nome deve ter pelo menos 3 caracteres"),
    email: z
      .string()
      .min(1, "E-mail e obrigatorio")
      .email("E-mail invalido"),
    password: z
      .string()
      .min(1, "Senha e obrigatoria")
      .min(8, "Senha deve ter pelo menos 8 caracteres")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Senha deve conter maiuscula, minuscula e numero"
      ),
    confirm_password: z.string().min(1, "Confirmacao de senha e obrigatoria"),
    user_type: z.enum(
      [
        "admin_nacional",
        "confederacao",
        "federacao",
        "clube",
        "tecnico",
        "atleta",
      ],
      { message: "Selecione o tipo de usuario" }
    ),
    accept_terms: z.literal(true, {
      message: "Voce deve aceitar os termos de uso",
    }),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Senhas nao conferem",
    path: ["confirm_password"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "E-mail e obrigatorio")
    .email("E-mail invalido"),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, "Senha e obrigatoria")
      .min(8, "Senha deve ter pelo menos 8 caracteres")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Senha deve conter maiuscula, minuscula e numero"
      ),
    confirm_password: z.string().min(1, "Confirmacao e obrigatoria"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Senhas nao conferem",
    path: ["confirm_password"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const USER_TYPE_LABELS: Record<string, string> = {
  admin_nacional: "Admin Nacional",
  confederacao: "Confederacao",
  federacao: "Federacao",
  clube: "Clube / Centro de Treinamento",
  tecnico: "Tecnico / Preparador Fisico",
  atleta: "Atleta",
};
