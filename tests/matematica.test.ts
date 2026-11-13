import { describe, expect, it } from "vitest";
import { retornoCompuesto } from "../src/motor/matematica";
import { hayDatosReales, supuestosReales } from "./ayuda";

describe("retorno compuesto a partir del aritmético y la volatilidad", () => {
  it("sin volatilidad, el compuesto es igual al aritmético", () => {
    expect(retornoCompuesto(5, 0)).toBeCloseTo(5, 10);
  });

  it("baja cuando sube la volatilidad", () => {
    expect(retornoCompuesto(9, 20)).toBeLessThan(retornoCompuesto(9, 10));
  });

  it("queda cerca de la aproximación r − σ²/200 cuando la volatilidad es baja", () => {
    expect(retornoCompuesto(5, 4)).toBeCloseTo(5 - 16 / 200, 1);
  });

  // La fórmula tiene que reproducir el retorno compuesto que publica el informe para cada clase.
  // Esto también comprueba que la extracción del Excel no mezcló columnas.
  it.skipIf(!hayDatosReales)("reproduce el compuesto publicado de cada clase (datos reales)", () => {
    for (const c of supuestosReales().clases) {
      expect(Math.abs(retornoCompuesto(c.retornoAritmetico, c.volatilidad) - c.retornoCompuesto), c.id).toBeLessThanOrEqual(0.02);
    }
  });
});
