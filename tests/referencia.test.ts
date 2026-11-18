// Valores de referencia calculados con otros solvers sobre los datos reales de J.P. Morgan 2027.
// Se saltean si datos/supuestos-2027.json no está (repositorio público).
//
// Tolerancias (sección 5 del documento): retorno y volatilidad ±0,05 puntos; pesos ±1 punto.
// Si un test falla, no se ajusta el número: se busca la diferencia.
import { describe, expect, it } from "vitest";
import {
  carteraMaximoRetorno,
  carteraMaximoSharpe,
  carteraMinimaVolatilidad,
  carteraParaVolatilidad,
  crearProblema,
} from "../src/motor/optimizador";
import type { ReglasCartera } from "../src/motor/tipos";
import { compararCartera, hayDatosReales, leerJson, reglas, supuestosReales, type Esperado } from "./ayuda";

describe.skipIf(!hayDatosReales)("datos reales", () => {
  // Calculadas por Gonzalo con cvxpy (tabla de la sección 5 del documento).
  describe("restricciones del documento: reproduce la tabla de cvxpy", () => {
    const problema = () => crearProblema(supuestosReales(), leerJson<ReglasCartera>("tests/fixtures/reglas-del-documento.json"));
    const tabla: [string, Esperado][] = [
      ["Conservador", { volatilidad: 4, retornoAritmetico: 5.58, pesos: { tesoro_medio: 42.4, renta_fija_agregada: 38.5, corporativos_hy: 10.0, acciones_eeuu_grandes: 1.8, inmobiliario_cotizado: 2.2, materias_primas: 4.4 } }],
      ["Moderado conservador", { volatilidad: 7, retornoAritmetico: 6.86, pesos: { tesoro_largo: 2.9, renta_fija_agregada: 53.8, corporativos_hy: 10.0, acciones_eeuu_grandes: 7.8, acciones_eeuu_chicas: 2.4, acciones_desarrollados_ex_eeuu: 5.5, inmobiliario_cotizado: 10.0, oro: 7.6 } }],
      ["Moderado", { volatilidad: 10, retornoAritmetico: 7.75, pesos: { tesoro_largo: 15.0, renta_fija_agregada: 10.8, corporativos_hy: 10.0, deuda_emergente: 10.0, acciones_eeuu_grandes: 17.1, acciones_eeuu_chicas: 5.1, acciones_desarrollados_ex_eeuu: 12.0, inmobiliario_cotizado: 10.0, oro: 10.0 } }],
      ["Moderado agresivo", { volatilidad: 13, retornoAritmetico: 8.47, pesos: { tesoro_largo: 15.0, corporativos_hy: 4.7, acciones_eeuu_grandes: 30.1, acciones_eeuu_chicas: 9.0, acciones_desarrollados_ex_eeuu: 21.1, inmobiliario_cotizado: 10.0, oro: 10.0 } }],
      ["Agresivo", { volatilidad: 16, retornoAritmetico: 8.98, pesos: { tesoro_largo: 1.1, acciones_eeuu_grandes: 40.8, acciones_eeuu_chicas: 10.0, acciones_desarrollados_ex_eeuu: 30.8, inmobiliario_cotizado: 10.0, oro: 7.2 } }],
    ];
    it.each(tabla)("%s", (_perfil, esperada) => {
      compararCartera(carteraParaVolatilidad(problema(), esperada.volatilidad), esperada);
    });
    it("máximo retorno: 9,17% con 17,28% de volatilidad", () => {
      const c = carteraMaximoRetorno(problema());
      expect(Math.abs(c.retornoAritmetico - 9.17)).toBeLessThanOrEqual(0.05);
      expect(Math.abs(c.volatilidad - 17.28)).toBeLessThanOrEqual(0.05);
    });
    it("mínima volatilidad: 0,68%", () => {
      expect(Math.abs(carteraMinimaVolatilidad(problema()).volatilidad - 0.68)).toBeLessThanOrEqual(0.05);
    });
    it("máximo Sharpe: casi toda renta fija, volatilidad cerca de 3,5%", () => {
      const c = carteraMaximoSharpe(problema());
      expect(c.volatilidad).toBeGreaterThan(2.5);
      expect(c.volatilidad).toBeLessThan(4.5);
    });
  });

  // Calculadas con scipy (SLSQP, 40 puntos de partida, ftol 1e-15) sobre los mismos datos redondeados
  // a dos decimales que usa el sitio, el 18/11/2026, con las once clases (sin TIPS, corporativos de
  // grado inversor, deuda emergente ni materias primas).
  // Sin esas clases la cartera de menor riesgo posible tiene 4,33%: el perfil Conservador (4%) queda en ella.
  describe("cartera diversificada (tope 20% parejo)", () => {
    const problema = () => crearProblema(supuestosReales(), reglas("diversificada"));
    const tabla: [string, Esperado][] = [
      ["Conservador", { volatilidad: 4.33, retornoAritmetico: 5.53, pesos: { liquidez_usd: 20.0, tesoro_medio: 20.0, tesoro_largo: 10.59, renta_fija_agregada: 20.0, corporativos_hy: 20.0, acciones_eeuu_grandes: 1.41, acciones_eeuu_chicas: 1.94, oro: 6.06 } }],
      ["Moderado conservador", { volatilidad: 7, retornoAritmetico: 6.83, pesos: { tesoro_medio: 18.24, tesoro_largo: 9.97, renta_fija_agregada: 20.0, corporativos_hy: 20.0, acciones_eeuu_chicas: 8.31, acciones_desarrollados_ex_eeuu: 1.64, inmobiliario_cotizado: 12.93, oro: 8.9 } }],
      ["Moderado", { volatilidad: 10, retornoAritmetico: 7.87, pesos: { tesoro_largo: 20.0, renta_fija_agregada: 4.66, corporativos_hy: 20.0, acciones_eeuu_chicas: 13.71, acciones_desarrollados_ex_eeuu: 8.02, inmobiliario_cotizado: 20.0, oro: 13.62 } }],
      ["Moderado agresivo", { volatilidad: 13, retornoAritmetico: 8.61, pesos: { tesoro_largo: 17.37, acciones_eeuu_grandes: 7.21, acciones_eeuu_chicas: 20.0, acciones_desarrollados_ex_eeuu: 20.0, acciones_emergentes: 3.63, inmobiliario_cotizado: 20.0, oro: 11.79 } }],
      ["Agresivo", { volatilidad: 16, retornoAritmetico: 9.11, pesos: { tesoro_largo: 2.04, acciones_eeuu_grandes: 18.53, acciones_eeuu_chicas: 20.0, acciones_desarrollados_ex_eeuu: 20.0, acciones_emergentes: 13.38, inmobiliario_cotizado: 20.0, oro: 6.04 } }],
    ];
    it.each(tabla)("%s", (perfil, esperada) => {
      // El Conservador pide 4%, pero lo más bajo posible es 4,33%: se usa esa cartera.
      compararCartera(carteraParaVolatilidad(problema(), perfil === "Conservador" ? 4 : esperada.volatilidad), esperada);
    });
    it("máximo retorno: 9,30% con 17,27% de volatilidad", () => {
      const c = carteraMaximoRetorno(problema());
      expect(Math.abs(c.retornoAritmetico - 9.3)).toBeLessThanOrEqual(0.05);
      expect(Math.abs(c.volatilidad - 17.27)).toBeLessThanOrEqual(0.05);
    });
    it("mínima volatilidad: 4,33%", () => {
      expect(Math.abs(carteraMinimaVolatilidad(problema()).volatilidad - 4.33)).toBeLessThanOrEqual(0.05);
    });
  });

  describe("cartera simple (acciones globales y bonos globales cubiertos)", () => {
    const problema = () => crearProblema(supuestosReales(), reglas("simple"));
    it.each([
      [4, 4],
      [7, 34],
      [10, 53],
      [13, 72],
      [16, 89],
    ])("volatilidad %i%%: alrededor de %i%% en acciones", (vol, acciones) => {
      expect(Math.abs(carteraParaVolatilidad(problema(), vol).pesos.acciones_globales - acciones)).toBeLessThanOrEqual(1);
    });
  });
});
