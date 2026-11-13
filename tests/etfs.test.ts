import { describe, expect, it } from "vitest";
import { leerJson, reglas } from "./ayuda";
import type { ListaEtfs } from "../src/plan/etfs";

const lista = leerJson<ListaEtfs>("datos/etfs.json");

/** Dígito verificador de un ISIN (norma ISO 6166, algoritmo de Luhn sobre los dígitos expandidos). */
function isinValido(isin: string): boolean {
  if (!/^[A-Z]{2}[A-Z0-9]{9}\d$/.test(isin)) return false;
  const digitos = isin
    .split("")
    .map((ch) => (/[A-Z]/.test(ch) ? String(ch.charCodeAt(0) - 55) : ch))
    .join("");
  let suma = 0;
  for (let i = 0; i < digitos.length; i++) {
    let d = Number(digitos[digitos.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    suma += d;
  }
  return suma % 10 === 0;
}

describe("lista de ETFs", () => {
  it("el validador de ISIN funciona", () => {
    expect(isinValido("IE00B5BMR087")).toBe(true);
    expect(isinValido("IE00B5BMR088")).toBe(false);
  });

  it("cada clase de las dos carteras tiene al menos una opción", () => {
    for (const id of [...reglas("diversificada").clases, ...reglas("simple").clases]) {
      expect(lista.clases[id]?.etfs.length ?? 0, id).toBeGreaterThan(0);
    }
  });

  it("cada ETF tiene todos los datos y un ISIN con dígito verificador correcto", () => {
    for (const [clase, { etfs }] of Object.entries(lista.clases)) {
      for (const e of etfs) {
        const donde = `${clase}: ${e.nombre}`;
        expect(isinValido(e.isin), donde).toBe(true);
        expect(e.ticker, donde).toMatch(/^[A-Z0-9]{3,6}$/);
        expect(["acumula", "distribuye"], donde).toContain(e.politica);
        expect(e.ter, donde).toBeGreaterThan(0);
        expect(e.ter, donde).toBeLessThan(1);
        expect(e.moneda, donde).toBe("USD");
        for (const campo of ["nombre", "emisor", "bolsa", "domicilio", "indice", "tipo"] as const) expect(e[campo], donde).toBeTruthy();
      }
    }
  });

  it("dentro de cada clase van ordenados alfabéticamente por emisor y sin ISIN repetidos", () => {
    const vistos = new Set<string>();
    for (const [clase, { etfs }] of Object.entries(lista.clases)) {
      const emisores = etfs.map((e) => e.emisor.toLowerCase());
      expect(emisores, clase).toEqual([...emisores].sort((a, b) => a.localeCompare(b, "es")));
      for (const e of etfs) {
        expect(vistos.has(e.isin), e.isin).toBe(false);
        vistos.add(e.isin);
      }
    }
  });

  it("como mucho cuatro opciones por clase", () => {
    for (const [clase, { etfs }] of Object.entries(lista.clases)) expect(etfs.length, clase).toBeLessThanOrEqual(4);
  });
});
