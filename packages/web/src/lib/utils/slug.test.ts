import { describe, expect, it } from "vitest";
import { generateSlug } from "./slug";

describe("generateSlug", () => {
  it("remove acentos e normaliza para minusculas", () => {
    expect(generateSlug("João da Silva Ação")).toBe("joao-da-silva-acao");
  });

  it("lida com apostrofos convertendo-os em hifen", () => {
    expect(generateSlug("O'Brien Silva")).toBe("o-brien-silva");
  });

  it("colapsa multiplos espacos em um unico hifen", () => {
    expect(generateSlug("Maria   Souza")).toBe("maria-souza");
  });

  it("retorna string vazia para entrada vazia", () => {
    expect(generateSlug("")).toBe("");
  });

  it("remove hifens residuais de espacos nas bordas", () => {
    expect(generateSlug("  Ana  ")).toBe("ana");
  });

  it("remove caracteres especiais preservando as palavras", () => {
    expect(generateSlug("Nome & Sobrenome!")).toBe("nome-sobrenome");
  });

  it("trata numeros como caracteres validos do slug", () => {
    expect(generateSlug("Atleta 2024")).toBe("atleta-2024");
  });

  it("nao produz hifens duplicados a partir de simbolos repetidos", () => {
    expect(generateSlug("Atleta ---- Teste")).toBe("atleta-teste");
  });
});
