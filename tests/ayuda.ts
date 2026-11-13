import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { expect } from "vitest";
import type { Cartera, ReglasCartera, Supuestos } from "../src/motor/tipos";

export const raiz = path.resolve(__dirname, "..");

export function leerJson<T>(relativo: string): T {
  return JSON.parse(readFileSync(path.join(raiz, relativo), "utf8")) as T;
}

/** Los supuestos reales no están en el repositorio público: los tests que los usan se saltean si faltan. */
export const rutaReales = path.join(raiz, "datos/supuestos-2027.json");
export const hayDatosReales = existsSync(rutaReales);
export const supuestosReales = (): Supuestos => leerJson<Supuestos>("datos/supuestos-2027.json");
export const supuestosEjemplo = (): Supuestos => leerJson<Supuestos>("datos/supuestos.ejemplo.json");

export const reglas = (cual: "simple" | "diversificada"): ReglasCartera =>
  leerJson<{ carteras: Record<string, ReglasCartera> }>("datos/restricciones.json").carteras[cual];

export interface Esperado {
  volatilidad: number;
  retornoAritmetico: number;
  /** Pesos en % de las clases con más de 0,4%. Las que no aparecen tienen que estar por debajo de 1%. */
  pesos: Record<string, number>;
}

/** Tolerancias del documento de requisitos: 0,05 puntos en retorno y volatilidad, 1 punto en pesos. */
export function compararCartera(obtenida: Cartera, esperada: Esperado) {
  expect(obtenida.volatilidad).toBeCloseTo(esperada.volatilidad, 1);
  expect(Math.abs(obtenida.volatilidad - esperada.volatilidad)).toBeLessThanOrEqual(0.05);
  expect(Math.abs(obtenida.retornoAritmetico - esperada.retornoAritmetico)).toBeLessThanOrEqual(0.05);
  const ids = new Set([...Object.keys(obtenida.pesos), ...Object.keys(esperada.pesos)]);
  for (const id of ids) {
    const real = obtenida.pesos[id] ?? 0;
    const objetivo = esperada.pesos[id] ?? 0;
    expect(Math.abs(real - objetivo), `peso de ${id}: obtuve ${real.toFixed(2)}, esperaba ${objetivo}`).toBeLessThanOrEqual(1);
  }
}
