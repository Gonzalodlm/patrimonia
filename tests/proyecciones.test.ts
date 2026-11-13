import { describe, expect, it } from "vitest";
import { costoPonderado, parametrosLognormales, peorCaidaUnAnio, rangos, valorEnPercentil, Z } from "../src/plan/proyecciones";
import { retornoCompuesto } from "../src/motor/matematica";

describe("proyecciones", () => {
  it("la mediana crece al retorno compuesto", () => {
    const anual = retornoCompuesto(8, 15) / 100;
    for (const n of [1, 5, 10, 15]) {
      expect(valorEnPercentil(10000, n, 8, 15, Z.p50)).toBeCloseTo(10000 * (1 + anual) ** n, 6);
    }
  });

  it("la media lognormal reproduce el retorno aritmético de un año", () => {
    const { mu, sigma } = parametrosLognormales(8, 15);
    expect(Math.exp(mu + (sigma * sigma) / 2)).toBeCloseTo(1.08, 10);
  });

  it("sin volatilidad, malo, medio y bueno coinciden", () => {
    const [r] = rangos(10000, 4, 0, [10]);
    expect(r.malo).toBeCloseTo(r.bueno, 6);
    expect(r.medio).toBeCloseTo(10000 * 1.04 ** 10, 6);
  });

  it("el rango se abre con los años y con el riesgo", () => {
    const [a, b] = rangos(10000, 8, 15, [1, 10]);
    expect(b.bueno - b.malo).toBeGreaterThan(a.bueno - a.malo);
    const [bajo] = rangos(10000, 8, 5, [10]);
    expect(bajo.bueno - bajo.malo).toBeLessThan(b.bueno - b.malo);
  });

  it("reproduce los montos de la pregunta de carteras del test (perfil Moderado: 9.541 y 12.093)", () => {
    // Cartera diversificada Moderada con los datos 2027: aritmético 7,8744%, volatilidad 10%.
    expect(Math.round(valorEnPercentil(10000, 1, 7.8744, 10, Z.p10))).toBeCloseTo(9541, -1);
    expect(Math.round(valorEnPercentil(10000, 1, 7.8744, 10, Z.p90))).toBeCloseTo(12093, -1);
  });

  it("la peor caída razonable es positiva, menor que el monto y mayor con más riesgo", () => {
    const baja = peorCaidaUnAnio(10000, 6, 7);
    const alta = peorCaidaUnAnio(10000, 9, 16);
    expect(baja).toBeGreaterThan(0);
    expect(alta).toBeGreaterThan(baja);
    expect(alta).toBeLessThan(10000);
  });

  it("si en el peor caso igual se gana, la caída es cero", () => {
    expect(peorCaidaUnAnio(10000, 3, 0.5)).toBe(0);
  });

  it("el costo ponderado pesa cada TER por su peso en la cartera", () => {
    expect(costoPonderado({ a: 60, b: 40 }, { a: 0.1, b: 0.2 })).toBeCloseTo(0.14, 10);
    expect(costoPonderado({ a: 100 }, {})).toBe(0);
  });
});
