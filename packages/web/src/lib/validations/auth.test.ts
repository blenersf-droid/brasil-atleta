import { describe, expect, it } from "vitest";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "./auth";

describe("loginSchema", () => {
  it("aceita email e senha validos", () => {
    const result = loginSchema.safeParse({
      email: "atleta@example.com",
      password: "123456",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita email invalido", () => {
    const result = loginSchema.safeParse({
      email: "nao-e-email",
      password: "123456",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita senha com menos de 6 caracteres", () => {
    const result = loginSchema.safeParse({
      email: "atleta@example.com",
      password: "123",
    });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  const validPayload = {
    full_name: "Ana Souza",
    email: "ana.souza@example.com",
    password: "Senha123",
    confirm_password: "Senha123",
    accept_terms: true as const,
  };

  it("aceita um cadastro valido", () => {
    const result = registerSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("rejeita full_name com menos de 3 caracteres", () => {
    const result = registerSchema.safeParse({ ...validPayload, full_name: "An" });
    expect(result.success).toBe(false);
  });

  it("rejeita email invalido", () => {
    const result = registerSchema.safeParse({ ...validPayload, email: "invalido" });
    expect(result.success).toBe(false);
  });

  it("rejeita senha sem maiuscula/minuscula/numero", () => {
    const result = registerSchema.safeParse({
      ...validPayload,
      password: "somenteminusculas",
      confirm_password: "somenteminusculas",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita senha com menos de 8 caracteres", () => {
    const result = registerSchema.safeParse({
      ...validPayload,
      password: "Ab1",
      confirm_password: "Ab1",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita quando confirm_password nao confere com password", () => {
    const result = registerSchema.safeParse({
      ...validPayload,
      confirm_password: "Outra123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["confirm_password"]);
    }
  });

  it("rejeita quando accept_terms nao e true", () => {
    const result = registerSchema.safeParse({ ...validPayload, accept_terms: false });
    expect(result.success).toBe(false);
  });

  it("rejeita quando accept_terms esta ausente", () => {
    const withoutTerms = {
      full_name: validPayload.full_name,
      email: validPayload.email,
      password: validPayload.password,
      confirm_password: validPayload.confirm_password,
    };
    const result = registerSchema.safeParse(withoutTerms);
    expect(result.success).toBe(false);
  });

  it("nao exige user_type para um cadastro valido (removido do fluxo)", () => {
    // validPayload nunca inclui user_type — isso por si so prova que o campo
    // nao e obrigatorio. Reforcado abaixo: mesmo com user_type presente no
    // payload, o schema o ignora/descarta (nao faz parte do shape).
    const result = registerSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("ignora/descarta user_type caso seja enviado no payload", () => {
    const payloadWithUserType = { ...validPayload, user_type: "admin_nacional" };
    const result = registerSchema.safeParse(payloadWithUserType);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty("user_type");
    }
  });
});

describe("forgotPasswordSchema", () => {
  it("aceita email valido", () => {
    expect(forgotPasswordSchema.safeParse({ email: "atleta@example.com" }).success).toBe(true);
  });

  it("rejeita email invalido", () => {
    expect(forgotPasswordSchema.safeParse({ email: "invalido" }).success).toBe(false);
  });

  it("rejeita email vazio", () => {
    expect(forgotPasswordSchema.safeParse({ email: "" }).success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("aceita senha valida com confirmacao igual", () => {
    const result = resetPasswordSchema.safeParse({
      password: "NovaSenha1",
      confirm_password: "NovaSenha1",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita quando as senhas nao conferem", () => {
    const result = resetPasswordSchema.safeParse({
      password: "NovaSenha1",
      confirm_password: "Diferente1",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["confirm_password"]);
    }
  });

  it("rejeita senha sem numero", () => {
    const result = resetPasswordSchema.safeParse({
      password: "SenhaSemNumero",
      confirm_password: "SenhaSemNumero",
    });
    expect(result.success).toBe(false);
  });
});
