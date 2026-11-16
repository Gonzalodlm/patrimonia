import { describe, expect, it } from "vitest";
import { sanear, tienda } from "../src/componentes/plan/estado";

const inicial = tienda.inicial();

const guardado = {
  version: 2,
  paso: 3,
  pregunta: 10,
  respuestas: { edad: "a", horizonte: "e" },
  perfilElegido: "moderado",
  tipoCartera: "simple",
  monto: 25000,
  etfs: { oro: "IE00B579F325" },
  situacion: { edad: 35, ahorroMensual: 800, ingresos: null, gastos: 1500, ahorros: 12000, deudas: [{ id: "d1", tipo: "tarjeta", saldo: 1000, tasa: 60 }] },
  objetivos: [{ id: "o1", categoria: "casa", nombre: "Casa", monto: 40000, anio: 2036, prioridad: "importante" }],
};

describe("lo guardado en el navegador", () => {
  it("un estado válido se lee tal cual", () => {
    expect(sanear(guardado)).toEqual(guardado);
  });

  it("lo que no sirve vuelve al estado inicial, sin romper la página", () => {
    for (const malo of [null, undefined, "hola", 7, [], {}, { version: 99 }]) expect(sanear(malo)).toEqual(inicial);
  });

  it("cada campo dañado se reemplaza por su valor inicial", () => {
    const s = sanear({
      ...guardado,
      paso: 99,
      pregunta: -1,
      respuestas: "x",
      perfilElegido: 5,
      tipoCartera: "otra",
      monto: -3,
      etfs: null,
      situacion: { edad: "treinta", ahorroMensual: Number.NaN, deudas: [null, { id: "d", tipo: "inventada" }, { id: "d2", tipo: "hipoteca", saldo: "mucho", tasa: -1 }] },
      objetivos: [null, { id: "o", categoria: "yate" }, { id: "o2", categoria: "viaje", nombre: 5, monto: "x", anio: 2030.5, prioridad: "urgente" }],
    });
    expect(s.paso).toBe(0);
    expect(s.pregunta).toBe(0);
    expect(s.respuestas).toEqual({});
    expect(s.perfilElegido).toBeNull();
    expect(s.tipoCartera).toBe("diversificada");
    expect(s.monto).toBe(inicial.monto);
    expect(s.etfs).toEqual({});
    expect(s.situacion).toEqual({ edad: null, ahorroMensual: null, ingresos: null, gastos: null, ahorros: null, deudas: [{ id: "d2", tipo: "hipoteca", saldo: 0, tasa: null }] });
    expect(s.objetivos).toEqual([{ id: "o2", categoria: "viaje", nombre: "", monto: 0, anio: 0, prioridad: "importante" }]);
  });

  it("lo guardado con el test anterior conserva la situación y pide hacer el test de nuevo", () => {
    const s = sanear({ ...guardado, version: 1, respuestas: { caida: "c", horizonte: "b" } });
    expect(s.version).toBe(2);
    expect(s.respuestas).toEqual({});
    expect(s.perfilElegido).toBeNull();
    expect(s.paso).toBe(0);
    expect(s.situacion).toEqual(guardado.situacion);
    expect(s.objetivos).toEqual(guardado.objetivos);
  });
});
