import { describe, expect, it } from "vitest";
import { enlaceBaja, firmaBaja, firmaValida, normalizarMail } from "../src/servidor/suscripciones";

describe("mails del aviso anual", () => {
  it("normaliza y valida mails", () => {
    expect(normalizarMail("  Ana@Ejemplo.COM ")).toBe("ana@ejemplo.com");
    expect(normalizarMail("sin-arroba")).toBeNull();
    expect(normalizarMail("a@b")).toBeNull();
    expect(normalizarMail("x".repeat(250) + "@a.com")).toBeNull();
  });

  it("la firma de baja depende del mail y del secreto, y se verifica", () => {
    const f = firmaBaja("ana@ejemplo.com", "secreto");
    expect(f).toHaveLength(32);
    expect(firmaValida("ana@ejemplo.com", f, "secreto")).toBe(true);
    expect(firmaValida("otra@ejemplo.com", f, "secreto")).toBe(false);
    expect(firmaValida("ana@ejemplo.com", f, "otro secreto")).toBe(false);
    expect(firmaValida("ana@ejemplo.com", "corta", "secreto")).toBe(false);
  });

  it("arma el enlace de baja con el mail codificado", () => {
    expect(enlaceBaja("ana+1@ejemplo.com", "s", "https://patrimonia.uy/")).toBe(`https://patrimonia.uy/baja?e=ana%2B1%40ejemplo.com&t=${firmaBaja("ana+1@ejemplo.com", "s")}`);
  });
});
