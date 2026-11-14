import { describe, expect, it } from "vitest";
import { calcularPerfil, faltantes, type Cuestionario } from "../src/plan/perfil";
import { leerJson } from "./ayuda";

const c = leerJson<Cuestionario>("datos/cuestionario.json");
const perfiles = leerJson<{ perfiles: { id: string }[] }>("datos/perfiles.json").perfiles.map((p) => p.id);

/** Respuestas con la opción de más puntos (o la de menos) en cada pregunta. */
function extremo(mas: boolean): Record<string, string> {
  return Object.fromEntries(
    c.preguntas.map((p) => {
      const orden = [...p.opciones].sort((a, b) => (mas ? b.puntos - a.puntos : a.puntos - b.puntos));
      return [p.id, orden[0].id];
    }),
  );
}

describe("estructura del cuestionario aprobado", () => {
  it("tiene 10 preguntas, 5 de tolerancia y 5 de capacidad, cada bloque con máximo de 20 puntos", () => {
    expect(c.preguntas).toHaveLength(10);
    for (const b of ["tolerancia", "capacidad"] as const) {
      const ps = c.preguntas.filter((p) => p.bloque === b);
      expect(ps).toHaveLength(5);
      expect(ps.reduce((s, p) => s + Math.max(...p.opciones.map((o) => o.puntos)), 0)).toBe(20);
      expect(ps.reduce((s, p) => s + Math.min(...p.opciones.map((o) => o.puntos)), 0)).toBeLessThan(c.umbrales[0]);
    }
  });

  it("si hay pregunta de carteras, tiene una opción por perfil, en orden", () => {
    for (const p of c.preguntas.filter((q) => q.tipo === "carteras")) expect(p.opciones.map((o) => o.perfil)).toEqual(perfiles);
  });

  it("los ids de preguntas y de opciones no se repiten", () => {
    expect(new Set(c.preguntas.map((p) => p.id)).size).toBe(c.preguntas.length);
    for (const p of c.preguntas) expect(new Set(p.opciones.map((o) => o.id)).size).toBe(p.opciones.length);
  });

  it("los topes por horizonte nombran perfiles que existen", () => {
    for (const p of c.preguntas) for (const o of p.opciones) if (o.perfilMaximo) expect(perfiles).toContain(o.perfilMaximo);
  });
});

describe("cálculo del perfil", () => {
  it("todo al máximo da Agresivo; todo al mínimo, Conservador", () => {
    expect(calcularPerfil(c, extremo(true), perfiles).perfil).toBe("agresivo");
    expect(calcularPerfil(c, extremo(false), perfiles).perfil).toBe("conservador");
  });

  it.each([
    [0, "conservador"],
    [3, "conservador"],
    [4, "moderado_conservador"],
    [7, "moderado_conservador"],
    [8, "moderado"],
    [11, "moderado"],
    [12, "moderado_agresivo"],
    [15, "moderado_agresivo"],
    [16, "agresivo"],
    [20, "agresivo"],
  ])("tolerancia con %i puntos → %s", (puntos, perfil) => {
    // Capacidad al máximo para que no limite; armamos la tolerancia sumando puntos de a una pregunta.
    const r = extremo(true);
    let restante = puntos;
    for (const p of c.preguntas.filter((q) => q.bloque === "tolerancia")) {
      const elegida = [...p.opciones].sort((a, b) => b.puntos - a.puntos).find((o) => o.puntos <= restante)!;
      r[p.id] = elegida.id;
      restante -= elegida.puntos;
    }
    expect(restante).toBe(0);
    const res = calcularPerfil(c, r, perfiles);
    expect(res.tolerancia.puntos).toBe(puntos);
    expect(res.tolerancia.perfil).toBe(perfil);
    expect(res.perfil).toBe(perfil);
  });

  it("el perfil final es el más bajo de los dos bloques", () => {
    const r = extremo(true);
    r.ingresos = "a"; // 0
    r.colchon = "a"; // 0
    r.porcentaje = "a"; // 0
    // capacidad: edad 4 + horizonte 4 = 8 → moderado
    const res = calcularPerfil(c, r, perfiles);
    expect(res.capacidad.puntos).toBe(8);
    expect(res.tolerancia.perfil).toBe("agresivo");
    expect(res.perfil).toBe("moderado");
    expect(res.limitante).toBe("capacidad");
  });

  it("si la plata se usa en menos de 3 años, el perfil queda en Conservador", () => {
    const r = { ...extremo(true), horizonte: "a" };
    const res = calcularPerfil(c, r, perfiles);
    expect(res.capacidad.puntos).toBe(16); // 0 del horizonte + 4 de cada una de las otras cuatro
    expect(res.capacidad.perfil).toBe("agresivo");
    expect(res.perfil).toBe("conservador");
    expect(res.limitante).toBe("horizonte");
  });

  it("entre 3 y 5 años, el perfil queda en Moderado conservador como máximo", () => {
    expect(calcularPerfil(c, { ...extremo(true), horizonte: "b" }, perfiles).perfil).toBe("moderado_conservador");
  });

  it("avisa qué preguntas faltan responder", () => {
    const r = extremo(true);
    delete r.colchon;
    expect(faltantes(c, r)).toEqual(["colchon"]);
    expect(() => calcularPerfil(c, r, perfiles)).toThrow(/colchon/);
  });
});
