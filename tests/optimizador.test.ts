// Propiedades que el motor tiene que cumplir con cualquier dato. Corren con los datos de ejemplo,
// así que funcionan también en el repositorio público, sin los supuestos de J.P. Morgan.
import { describe, expect, it } from "vitest";
import {
  carteraMaximoRetorno,
  carteraMaximoSharpe,
  carteraMinimaVolatilidad,
  carteraParaVolatilidad,
  crearProblema,
  frontera,
} from "../src/motor/optimizador";
import type { Cartera, ReglasCartera, Supuestos } from "../src/motor/tipos";
import { hayDatosReales, leerJson, reglas, supuestosEjemplo, supuestosReales } from "./ayuda";

const reglasDocumento = leerJson<ReglasCartera>("tests/fixtures/reglas-del-documento.json");

function cumpleReglas(c: Cartera, r: ReglasCartera) {
  const suma = Object.values(c.pesos).reduce((a, b) => a + b, 0);
  expect(suma).toBeCloseTo(100, 6);
  for (const [id, peso] of Object.entries(c.pesos)) {
    expect(r.clases).toContain(id);
    expect(peso).toBeGreaterThanOrEqual(-1e-6);
    expect(peso).toBeLessThanOrEqual(Math.min(r.topeGeneral, r.topes[id] ?? 100) + 1e-6);
  }
  for (const p of r.proporciones) {
    const grupo = p.grupo.reduce((a, id) => a + (c.pesos[id] ?? 0), 0);
    const propio = c.pesos[p.clase] ?? 0;
    if (p.minimo !== undefined) expect(propio).toBeGreaterThanOrEqual((p.minimo / 100) * grupo - 1e-6);
    if (p.maximo !== undefined) expect(propio).toBeLessThanOrEqual((p.maximo / 100) * grupo + 1e-6);
  }
}

describe.each([
  ["diversificada (tope 20%)", () => reglas("diversificada")],
  ["simple (dos activos)", () => reglas("simple")],
  ["restricciones del documento", () => reglasDocumento],
])("motor con datos de ejemplo: %s", (_nombre, obtenerReglas) => {
  const r = obtenerReglas();
  const problema = crearProblema(supuestosEjemplo(), r);
  const minima = carteraMinimaVolatilidad(problema);
  const maxima = carteraMaximoRetorno(problema);
  const puntos = frontera(problema, 60);

  it("todas las carteras de la frontera respetan las reglas", () => {
    for (const c of [minima, maxima, ...puntos]) cumpleReglas(c, r);
  });

  it("la frontera sube: más volatilidad, más retorno", () => {
    for (let i = 1; i < puntos.length; i++) {
      expect(puntos[i].volatilidad).toBeGreaterThan(puntos[i - 1].volatilidad);
      expect(puntos[i].retornoAritmetico).toBeGreaterThanOrEqual(puntos[i - 1].retornoAritmetico - 1e-9);
    }
  });

  it("empieza en la de mínima volatilidad y termina en la de máximo retorno", () => {
    expect(puntos[0].volatilidad).toBeCloseTo(minima.volatilidad, 4);
    expect(puntos.at(-1)!.retornoAritmetico).toBeCloseTo(maxima.retornoAritmetico, 4);
  });

  it("ninguna cartera de la frontera tiene menos volatilidad que la mínima", () => {
    for (const c of puntos) expect(c.volatilidad).toBeGreaterThanOrEqual(minima.volatilidad - 1e-6);
  });

  it("la cartera para una volatilidad objetivo tiene esa volatilidad", () => {
    for (const objetivo of [minima.volatilidad + 0.5, (minima.volatilidad + maxima.volatilidad) / 2, maxima.volatilidad - 0.5]) {
      expect(carteraParaVolatilidad(problema, objetivo).volatilidad).toBeCloseTo(objetivo, 3);
    }
  });

  it("si el objetivo queda fuera de la frontera, devuelve el extremo más cercano", () => {
    expect(carteraParaVolatilidad(problema, 0.01).volatilidad).toBeCloseTo(minima.volatilidad, 6);
    expect(carteraParaVolatilidad(problema, 99).retornoAritmetico).toBeCloseTo(maxima.retornoAritmetico, 6);
  });

  it("la de máximo Sharpe no es superada por ningún punto de la frontera", () => {
    const sharpe = carteraMaximoSharpe(problema);
    for (const c of puntos) expect(sharpe.sharpe).toBeGreaterThanOrEqual(c.sharpe - 1e-4);
  });

  it("es determinista: los mismos datos dan exactamente la misma cartera", () => {
    const otra = carteraParaVolatilidad(crearProblema(supuestosEjemplo(), r), 9);
    expect(otra).toEqual(carteraParaVolatilidad(problema, 9));
  });
});

describe("casos que se pueden calcular a mano", () => {
  it("con tope 20% parejo, el máximo retorno es el promedio de las cinco clases que más rinden", () => {
    const s = supuestosEjemplo();
    const r = reglas("diversificada");
    const top5 = s.clases
      .filter((c) => r.clases.includes(c.id))
      .map((c) => c.retornoAritmetico)
      .sort((a, b) => b - a)
      .slice(0, 5);
    const esperado = top5.reduce((a, b) => a + b, 0) / 5;
    expect(carteraMaximoRetorno(crearProblema(s, r)).retornoAritmetico).toBeCloseTo(esperado, 4);
  });

  const casosDosActivos: [string, () => Supuestos][] = [["ejemplo", supuestosEjemplo]];
  if (hayDatosReales) casosDosActivos.push(["reales", supuestosReales]);

  it.each(casosDosActivos)("cartera simple: coincide con la fórmula cerrada de dos activos (datos %s)", (_n, obtener) => {
    const s = obtener();
    const a = s.clases.find((c) => c.id === "acciones_globales")!;
    const b = s.clases.find((c) => c.id === "bonos_globales")!;
    const rho = s.correlaciones[s.clases.indexOf(a)][s.clases.indexOf(b)];
    const problema = crearProblema(s, reglas("simple"));
    for (const t of [7, 10, 13, 16]) {
      // Peso en acciones x tal que la volatilidad de la mezcla es t: resolver la cuadrática y tomar la raíz mayor.
      const A = a.volatilidad ** 2 + b.volatilidad ** 2 - 2 * rho * a.volatilidad * b.volatilidad;
      const B = 2 * rho * a.volatilidad * b.volatilidad - 2 * b.volatilidad ** 2;
      const C = b.volatilidad ** 2 - t ** 2;
      const x = (-B + Math.sqrt(B * B - 4 * A * C)) / (2 * A);
      const c = carteraParaVolatilidad(problema, t);
      expect(c.pesos.acciones_globales).toBeCloseTo(x * 100, 2);
      expect(c.retornoAritmetico).toBeCloseTo(x * a.retornoAritmetico + (1 - x) * b.retornoAritmetico, 3);
    }
  });

  it("avisa con un mensaje claro si las reglas no se pueden cumplir", () => {
    const imposible: ReglasCartera = { ...reglas("simple"), topeGeneral: 40 };
    expect(() => crearProblema(supuestosEjemplo(), imposible)).toThrow(/no se pueden cumplir/);
  });

  it("avisa si una regla nombra una clase que no existe", () => {
    const mal: ReglasCartera = { ...reglas("simple"), clases: ["acciones_globales", "bonos_de_marte"] };
    expect(() => crearProblema(supuestosEjemplo(), mal)).toThrow(/bonos_de_marte/);
  });
});
