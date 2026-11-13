// Frontera eficiente de Markowitz con restricciones lineales.
//
// Idea: para cada nivel de retorno buscamos la cartera de menor volatilidad que lo alcanza
// (un problema de programación cuadrática). Recorriendo los niveles de retorno se obtiene la
// frontera. Para una volatilidad objetivo (la del perfil) buscamos por bisección el retorno
// cuya cartera de mínima volatilidad tiene exactamente esa volatilidad: es la cartera de mayor
// retorno que no pasa ese riesgo, que es lo que pide el documento.
//
// Los pesos se manejan internamente como fracciones (suman 1); retornos y volatilidades en %.
// Hacia afuera, los pesos se devuelven en % (suman 100).

import { solveQP } from "quadprog";
import { retornoCompuesto, sharpe } from "./matematica";
import type { Cartera, ReglasCartera, Supuestos } from "./tipos";

interface Restriccion {
  coeficientes: number[];
  valor: number; // coeficientes · w  ≥ valor  (o = valor si es igualdad)
  igualdad: boolean;
}

export interface Problema {
  ids: string[];
  retornos: number[]; // aritméticos, en %
  covarianzas: number[][]; // en %²
  aritmeticoLiquidez: number;
  restricciones: Restriccion[];
  minima: Cartera;
  maxima: Cartera;
}

/** Arma el problema para unas reglas y calcula sus dos extremos. Lanza un error si las reglas son imposibles. */
export function crearProblema(supuestos: Supuestos, reglas: ReglasCartera): Problema {
  const indice = new Map(supuestos.clases.map((c, i) => [c.id, i]));
  const desconocidas = [
    ...reglas.clases,
    ...Object.keys(reglas.topes),
    ...reglas.proporciones.flatMap((p) => [p.clase, ...p.grupo]),
  ].filter((id) => !indice.has(id));
  if (desconocidas.length) throw new Error(`Las reglas nombran clases que no están en los supuestos: ${[...new Set(desconocidas)].join(", ")}`);
  const liquidez = supuestos.clases.find((c) => c.id === "liquidez_usd");
  if (!liquidez) throw new Error("Los supuestos no tienen la clase liquidez_usd.");

  const ids = [...reglas.clases];
  const n = ids.length;
  const pos = new Map(ids.map((id, i) => [id, i]));
  const clases = ids.map((id) => supuestos.clases[indice.get(id)!]);
  const retornos = clases.map((c) => c.retornoAritmetico);
  const covarianzas = ids.map((a, i) =>
    ids.map((b, j) => supuestos.correlaciones[indice.get(a)!][indice.get(b)!] * clases[i].volatilidad * clases[j].volatilidad),
  );

  const unidad = (i: number, valor = 1) => ids.map((_, k) => (k === i ? valor : 0));
  const restricciones: Restriccion[] = [{ coeficientes: ids.map(() => 1), valor: 1, igualdad: true }];
  for (let i = 0; i < n; i++) {
    restricciones.push({ coeficientes: unidad(i), valor: 0, igualdad: false });
    const tope = Math.min(reglas.topeGeneral, reglas.topes[ids[i]] ?? 100) / 100;
    if (tope < 1) restricciones.push({ coeficientes: unidad(i, -1), valor: -tope, igualdad: false });
  }
  for (const p of reglas.proporciones) {
    // Clases del grupo que no están en esta cartera pesan 0: se ignoran.
    const enGrupo = (k: number) => p.grupo.includes(ids[k]);
    const propia = pos.get(p.clase);
    if (propia === undefined) continue;
    if (p.minimo !== undefined) {
      // w_clase − mínimo · Σ grupo ≥ 0
      const m = p.minimo / 100;
      restricciones.push({ coeficientes: ids.map((_, k) => (k === propia ? 1 : 0) - (enGrupo(k) ? m : 0)), valor: 0, igualdad: false });
    }
    if (p.maximo !== undefined) {
      // máximo · Σ grupo − w_clase ≥ 0
      const m = p.maximo / 100;
      restricciones.push({ coeficientes: ids.map((_, k) => (enGrupo(k) ? m : 0) - (k === propia ? 1 : 0)), valor: 0, igualdad: false });
    }
  }

  const base = { ids, retornos, covarianzas, aritmeticoLiquidez: liquidez.retornoAritmetico, restricciones };
  let minima: Cartera, maxima: Cartera;
  try {
    minima = describir(base, minimaVarianza(base));
    // Máximo retorno: maximizar el retorno con una penalización ínfima de varianza (para que el
    // problema sea cuadrático), y después buscar la de menor volatilidad entre las de ese retorno.
    const casiLineal = resolver(base, base.covarianzas.map((f) => f.map((x) => x * 2e-7)), base.retornos, []);
    const retornoMaximo = productoEscalar(retornos, casiLineal) - 1e-9;
    maxima = describir(base, minimaVarianza(base, retornoMaximo));
  } catch (e) {
    throw new Error(`Las reglas de la cartera "${reglas.nombre}" no se pueden cumplir todas juntas. ${(e as Error).message}`);
  }
  return { ...base, minima, maxima };
}

export const carteraMinimaVolatilidad = (p: Problema): Cartera => p.minima;
export const carteraMaximoRetorno = (p: Problema): Cartera => p.maxima;

/** La cartera de mayor retorno cuya volatilidad no pasa el objetivo. */
export function carteraParaVolatilidad(p: Problema, objetivo: number): Cartera {
  if (objetivo <= p.minima.volatilidad) return p.minima;
  if (objetivo >= p.maxima.volatilidad) return p.maxima;
  let bajo = p.minima.retornoAritmetico;
  let alto = p.maxima.retornoAritmetico;
  let mejor = p.minima;
  for (let i = 0; i < 100 && alto - bajo > 1e-11; i++) {
    const medio = (bajo + alto) / 2;
    const c = describir(p, minimaVarianza(p, medio));
    if (c.volatilidad <= objetivo) {
      bajo = medio;
      mejor = c;
    } else {
      alto = medio;
    }
  }
  return mejor;
}

/** La cartera de la frontera con mayor ratio de Sharpe (búsqueda por sección áurea sobre el retorno). */
export function carteraMaximoSharpe(p: Problema): Cartera {
  const en = (r: number) => describir(p, minimaVarianza(p, r));
  const phi = (Math.sqrt(5) - 1) / 2;
  let a = p.minima.retornoAritmetico;
  let b = p.maxima.retornoAritmetico;
  let c = b - phi * (b - a);
  let d = a + phi * (b - a);
  let fc = en(c);
  let fd = en(d);
  for (let i = 0; i < 80 && b - a > 1e-9; i++) {
    if (fc.sharpe >= fd.sharpe) {
      b = d;
      d = c;
      fd = fc;
      c = b - phi * (b - a);
      fc = en(c);
    } else {
      a = c;
      c = d;
      fc = fd;
      d = a + phi * (b - a);
      fd = en(d);
    }
  }
  return [p.minima, p.maxima, fc, fd].reduce((x, y) => (y.sharpe > x.sharpe ? y : x));
}

/** `cantidad` carteras de la frontera, con volatilidades igualmente espaciadas entre los dos extremos. */
export function frontera(p: Problema, cantidad: number): Cartera[] {
  const desde = p.minima.volatilidad;
  const hasta = p.maxima.volatilidad;
  if (cantidad < 2 || hasta - desde < 1e-9) return [p.minima];
  return Array.from({ length: cantidad }, (_, i) => {
    if (i === 0) return p.minima;
    if (i === cantidad - 1) return p.maxima;
    return carteraParaVolatilidad(p, desde + ((hasta - desde) * i) / (cantidad - 1));
  });
}

// ─── Internos ────────────────────────────────────────────────────────────────

type Base = Pick<Problema, "ids" | "retornos" | "covarianzas" | "aritmeticoLiquidez" | "restricciones">;

const productoEscalar = (a: number[], b: number[]) => a.reduce((s, x, i) => s + x * b[i], 0);

/** Cartera de mínima varianza, opcionalmente con un retorno mínimo. */
function minimaVarianza(p: Base, retornoMinimo?: number): number[] {
  const extra = retornoMinimo === undefined ? [] : [{ coeficientes: p.retornos, valor: retornoMinimo, igualdad: false }];
  return resolver(p, p.covarianzas.map((f) => f.map((x) => 2 * x)), p.ids.map(() => 0), extra);
}

/** Minimiza ½ wᵀDw − dᵀw sujeto a las restricciones del problema y las extra. */
function resolver(p: Base, D: number[][], d: number[], extra: Restriccion[]): number[] {
  const todas = [...p.restricciones, ...extra].sort((a, b) => Number(b.igualdad) - Number(a.igualdad));
  const n = p.ids.length;
  // quadprog usa índices desde 1 y modifica la matriz D: armamos copias nuevas en cada llamada.
  const Dmat = [[], ...D.map((fila) => [0, ...fila])];
  const dvec = [0, ...d];
  const Amat: number[][] = [[]];
  for (let i = 0; i < n; i++) Amat.push([0, ...todas.map((r) => r.coeficientes[i])]);
  const bvec = [0, ...todas.map((r) => r.valor)];
  const meq = todas.filter((r) => r.igualdad).length;
  const { solution, message } = solveQP(Dmat, dvec, Amat, bvec, meq);
  if (message) throw new Error(message === "constraints are inconsistent, no solution!" ? "No hay ninguna cartera que cumpla todas las restricciones." : message);
  return solution.slice(1).map((x) => (Math.abs(x) < 1e-10 ? 0 : x));
}

function describir(p: Base, w: number[]): Cartera {
  const aritmetico = productoEscalar(p.retornos, w);
  let varianza = 0;
  for (let i = 0; i < w.length; i++) for (let j = 0; j < w.length; j++) varianza += w[i] * w[j] * p.covarianzas[i][j];
  const volatilidad = Math.sqrt(Math.max(varianza, 0));
  return {
    pesos: Object.fromEntries(p.ids.map((id, i) => [id, w[i] * 100])),
    retornoAritmetico: aritmetico,
    retornoCompuesto: retornoCompuesto(aritmetico, volatilidad),
    volatilidad,
    sharpe: sharpe(aritmetico, volatilidad, p.aritmeticoLiquidez),
  };
}
