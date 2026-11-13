import { describe, expect, it } from "vitest";
import { validarSupuestos } from "../src/motor/supuestos";
import { hayDatosReales, leerJson, reglas, supuestosEjemplo, supuestosReales } from "./ayuda";
import type { Supuestos } from "../src/motor/tipos";

const grupos = () => [reglas("simple").clases, reglas("diversificada").clases];

describe("validación de los supuestos", () => {
  it("el archivo de ejemplo es válido y está marcado como ejemplo", () => {
    const s = supuestosEjemplo();
    expect(validarSupuestos(s, grupos())).toEqual([]);
    expect(s.ejemplo).toBe(true);
  });

  it.skipIf(!hayDatosReales)("el archivo real es válido y no está marcado como ejemplo", () => {
    const s = supuestosReales();
    expect(validarSupuestos(s, grupos())).toEqual([]);
    expect(s.ejemplo).toBe(false);
    expect(s.fuente.edicion).toBe(2027);
  });

  it("ejemplo y real tienen las mismas clases, en el mismo orden", () => {
    const ejemplo = supuestosEjemplo().clases.map((c) => c.id);
    const lista = leerJson<{ clases: { id: string }[] }>("datos/clases.json").clases.map((c) => c.id);
    expect(ejemplo).toEqual(lista);
    if (hayDatosReales) expect(supuestosReales().clases.map((c) => c.id)).toEqual(lista);
  });

  it("todas las clases de las dos carteras existen en los supuestos", () => {
    const ids = new Set(supuestosEjemplo().clases.map((c) => c.id));
    for (const cual of ["simple", "diversificada"] as const) {
      for (const id of reglas(cual).clases) expect(ids.has(id), `${cual}: ${id}`).toBe(true);
    }
  });

  const base = () => structuredClone(supuestosEjemplo());

  it("detecta una matriz no simétrica", () => {
    const s: Supuestos = base();
    s.correlaciones[1][2] = 0.5;
    s.correlaciones[2][1] = 0.4;
    expect(validarSupuestos(s, grupos()).join(" ")).toMatch(/simétrica/);
  });

  it("detecta una diagonal distinta de 1", () => {
    const s: Supuestos = base();
    s.correlaciones[3][3] = 0.9;
    expect(validarSupuestos(s, grupos()).join(" ")).toMatch(/diagonal/);
  });

  it("detecta una matriz imposible dentro del grupo de una cartera", () => {
    const s: Supuestos = base();
    // A y B muy correlacionadas, B y C muy correlacionadas, pero A y C opuestas: no existe.
    s.correlaciones[1][2] = s.correlaciones[2][1] = 0.95;
    s.correlaciones[2][4] = s.correlaciones[4][2] = 0.95;
    s.correlaciones[1][4] = s.correlaciones[4][1] = -0.95;
    expect(validarSupuestos(s, grupos()).join(" ")).toMatch(/imposible/);
  });

  it("detecta una volatilidad negativa y una clase faltante en la matriz", () => {
    const s: Supuestos = base();
    s.clases[0].volatilidad = -1;
    s.correlaciones.pop();
    const errores = validarSupuestos(s, grupos()).join(" ");
    expect(errores).toMatch(/volatilidad/);
    expect(errores).toMatch(/filas/);
  });
});
