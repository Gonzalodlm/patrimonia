// Simulación de escenarios con semilla fija: los mismos datos dan siempre el mismo resultado.
// Cada mes, el valor crece según una distribución lognormal con el retorno aritmético y la
// volatilidad anuales de la cartera.

import { parametrosLognormales } from "./proyecciones";

/** Generador pseudoaleatorio pequeño y reproducible (mulberry32). */
export function generador(semilla: number) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Matriz de shocks normales estándar [camino][mes], reproducible. */
export function shocks(caminos: number, meses: number, semilla: number): Float64Array[] {
  const azar = generador(semilla);
  const salida: Float64Array[] = [];
  for (let c = 0; c < caminos; c++) {
    const fila = new Float64Array(meses);
    for (let m = 0; m < meses; m += 2) {
      // Box-Muller: dos normales por par de uniformes.
      const u1 = Math.max(azar(), 1e-12);
      const u2 = azar();
      const radio = Math.sqrt(-2 * Math.log(u1));
      fila[m] = radio * Math.cos(2 * Math.PI * u2);
      if (m + 1 < meses) fila[m + 1] = radio * Math.sin(2 * Math.PI * u2);
    }
    salida.push(fila);
  }
  return salida;
}

/** Parámetros mensuales a partir de los anuales (en %). */
export function parametrosMensuales(aritmetico: number, volatilidad: number) {
  const { mu, sigma } = parametrosLognormales(aritmetico, volatilidad);
  return { mu: mu / 12, sigma: sigma / Math.sqrt(12) };
}

export interface Aportes {
  inicial: number;
  mensual: number;
  /** Mes (desde 0) en que empiezan los aportes mensuales. */
  desdeMes: number;
  meses: number;
}

/** Probabilidad de terminar con al menos `objetivo`, usando los shocks dados. Aporte al final de cada mes. */
export function probabilidadDeLlegar(a: Aportes, aritmetico: number, volatilidad: number, objetivo: number, z: Float64Array[]): number {
  if (objetivo <= 0) return 1;
  const { mu, sigma } = parametrosMensuales(aritmetico, volatilidad);
  let llegan = 0;
  for (const fila of z) {
    let valor = a.inicial;
    for (let m = 0; m < a.meses; m++) {
      valor *= Math.exp(mu + sigma * fila[m]);
      if (m >= a.desdeMes) valor += a.mensual;
    }
    if (valor >= objetivo * (1 - 1e-9)) llegan++;
  }
  return llegan / z.length;
}

/** Aporte mensual mínimo para llegar con la probabilidad pedida (búsqueda binaria con los mismos shocks). */
export function aporteParaProbabilidad(
  a: Omit<Aportes, "mensual">,
  aritmetico: number,
  volatilidad: number,
  objetivo: number,
  probabilidad: number,
  z: Float64Array[],
): number | null {
  const mesesAporte = a.meses - a.desdeMes;
  if (probabilidadDeLlegar({ ...a, mensual: 0 }, aritmetico, volatilidad, objetivo, z) >= probabilidad) return 0;
  if (mesesAporte <= 0) return null;
  let bajo = 0;
  let alto = objetivo / mesesAporte;
  while (probabilidadDeLlegar({ ...a, mensual: alto }, aritmetico, volatilidad, objetivo, z) < probabilidad) {
    alto *= 2;
    if (alto > objetivo * 10) return null;
  }
  for (let i = 0; i < 30; i++) {
    const medio = (bajo + alto) / 2;
    if (probabilidadDeLlegar({ ...a, mensual: medio }, aritmetico, volatilidad, objetivo, z) >= probabilidad) alto = medio;
    else bajo = medio;
  }
  return alto;
}
