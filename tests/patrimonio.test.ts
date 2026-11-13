import { describe, expect, it } from "vitest";
import { armarPlan, carteraParaPlazo, type CarteraResumen, type Criterios, type EntradaPlan, type Objetivo } from "../src/plan/patrimonio";
import { generador, probabilidadDeLlegar, shocks } from "../src/plan/simulacion";
import { leerJson } from "./ayuda";

const criterios = leerJson<Criterios>("datos/criterios-plan.json");
const perfiles = ["conservador", "moderado_conservador", "moderado", "moderado_agresivo", "agresivo"];

// Carteras de prueba con números redondos (no son las reales).
const cartera = (id: string, arit: number, comp: number, vol: number): CarteraResumen => ({ id, nombre: id, retornoAritmetico: arit, retornoCompuesto: comp, volatilidad: vol });
const carteras: Record<string, CarteraResumen> = {
  liquidez: cartera("liquidez", 3, 3, 0.5),
  conservador: cartera("conservador", 5, 4.9, 4),
  moderado_conservador: cartera("moderado_conservador", 6, 5.8, 7),
  moderado: cartera("moderado", 7, 6.5, 10),
  moderado_agresivo: cartera("moderado_agresivo", 8, 7.2, 13),
  agresivo: cartera("agresivo", 9, 7.8, 16),
};

function entrada(cambios: Partial<EntradaPlan> = {}): EntradaPlan {
  return {
    situacion: { edad: 35, ahorroMensual: 1000, ingresos: 3000, gastos: 2000, ahorros: 0, deudas: [] },
    objetivos: [],
    perfil: "agresivo",
    perfiles,
    carteras,
    criterios,
    respuestasTest: { ingresos: "c", dependientes: "a" },
    anioActual: 2026,
    inflacion: 2.4,
    caminos: 300,
    ...cambios,
  };
}

const objetivo = (id: string, monto: number, anio: number, prioridad: Objetivo["prioridad"] = "importante", categoria: Objetivo["categoria"] = "otro"): Objetivo => ({
  id,
  nombre: id,
  categoria,
  monto,
  anio,
  prioridad,
});

describe("simulación", () => {
  it("el generador es reproducible", () => {
    const a = generador(7);
    const b = generador(7);
    for (let i = 0; i < 5; i++) expect(a()).toBe(b());
  });

  it("los shocks tienen media cerca de 0 y desvío cerca de 1", () => {
    const z = shocks(200, 120, 1).flatMap((f) => Array.from(f));
    const media = z.reduce((a, b) => a + b, 0) / z.length;
    const desvio = Math.sqrt(z.reduce((a, b) => a + (b - media) ** 2, 0) / z.length);
    expect(Math.abs(media)).toBeLessThan(0.02);
    expect(Math.abs(desvio - 1)).toBeLessThan(0.02);
  });

  it("con más aporte, más probabilidad", () => {
    const z = shocks(300, 120, 3);
    const p1 = probabilidadDeLlegar({ inicial: 0, mensual: 100, desdeMes: 0, meses: 120 }, 7, 10, 18000, z);
    const p2 = probabilidadDeLlegar({ inicial: 0, mensual: 150, desdeMes: 0, meses: 120 }, 7, 10, 18000, z);
    expect(p2).toBeGreaterThan(p1);
  });
});

describe("cartera según el plazo (tabla aprobada)", () => {
  it.each([
    [1, "agresivo", "liquidez"],
    [2.9, "agresivo", "liquidez"],
    [3, "agresivo", "conservador"],
    [6, "agresivo", "conservador"],
    [7, "agresivo", "moderado"],
    [14, "agresivo", "moderado"],
    [15, "agresivo", "agresivo"],
    [30, "moderado_conservador", "moderado_conservador"],
    [10, "moderado_conservador", "moderado_conservador"],
    [5, "conservador", "conservador"],
  ])("a %s años con perfil %s → %s", (anios, perfil, esperada) => {
    expect(carteraParaPlazo(anios, { criterios, perfil, perfiles, carteras }).id).toBe(esperada);
  });
});

describe("colchón", () => {
  it("3 meses de gastos con ingresos estables y nadie a cargo", () => {
    const r = armarPlan(entrada());
    expect(r.colchon.meses).toBe(3);
    expect(r.colchon.objetivo).toBe(6000);
    expect(r.colchon.mesesParaCompletar).toBe(6);
  });

  it("6 meses si los ingresos varían o hay personas a cargo", () => {
    expect(armarPlan(entrada({ respuestasTest: { ingresos: "b", dependientes: "a" } })).colchon.meses).toBe(6);
    expect(armarPlan(entrada({ respuestasTest: { ingresos: "d", dependientes: "c" } })).colchon.meses).toBe(6);
  });

  it("los ahorros actuales completan primero el colchón", () => {
    const r = armarPlan(entrada({ situacion: { edad: 35, ahorroMensual: 1000, ingresos: null, gastos: 2000, ahorros: 10000, deudas: [] } }));
    expect(r.colchon.conAhorros).toBe(6000);
    expect(r.colchon.faltante).toBe(0);
    expect(r.ahorrosSinAsignar).toBe(4000);
    expect(r.mesesAntesDeObjetivos).toBe(0);
  });

  it("sin gastos no hay colchón automático; si la persona carga uno propio, se usa ese", () => {
    expect(armarPlan(entrada({ situacion: { edad: 35, ahorroMensual: 1000, ingresos: null, gastos: null, ahorros: 0, deudas: [] } })).colchon.objetivo).toBeNull();
    const r = armarPlan(entrada({ objetivos: [objetivo("mi colchón", 5000, 2027, "deseable", "emergencia"), objetivo("viaje", 3000, 2027, "imprescindible")] }));
    expect(r.colchon.automatico).toBe(false);
    expect(r.objetivos[0].objetivo.categoria).toBe("emergencia"); // va primero aunque su prioridad sea más baja
  });
});

describe("deudas (regla simple aprobada)", () => {
  const conDeuda = (tipo: "tarjeta" | "prestamo_personal" | "hipoteca" | "otra", tasa: number | null) =>
    armarPlan(entrada({ situacion: { edad: 35, ahorroMensual: 1000, ingresos: null, gastos: null, ahorros: 0, deudas: [{ id: "d", tipo, saldo: 5000, tasa }] } })).deudas[0];

  it("tarjeta y préstamo personal se cancelan siempre primero", () => {
    expect(conDeuda("tarjeta", null).cancelarPrimero).toBe(true);
    expect(conDeuda("prestamo_personal", 3).cancelarPrimero).toBe(true);
  });
  it("la hipoteca nunca", () => {
    expect(conDeuda("hipoteca", 20).cancelarPrimero).toBe(false);
  });
  it("las otras, si la tasa supera el retorno esperado de la cartera", () => {
    expect(conDeuda("otra", 9).cancelarPrimero).toBe(true); // retorno compuesto agresivo de prueba: 7,8%
    expect(conDeuda("otra", 5).cancelarPrimero).toBe(false);
  });
  it("las deudas a cancelar retrasan los aportes a los objetivos", () => {
    const r = armarPlan(entrada({ situacion: { edad: 35, ahorroMensual: 1000, ingresos: null, gastos: null, ahorros: 0, deudas: [{ id: "d", tipo: "tarjeta", saldo: 5000, tasa: 0 }] } }));
    expect(r.mesesAntesDeObjetivos).toBe(5);
  });
});

describe("objetivos", () => {
  const sinColchon = { edad: 35, ahorroMensual: 1000, ingresos: null, gastos: null, ahorros: 0, deudas: [] };

  it("el aporte necesario lleva justo al monto (con inflación) en el escenario medio", () => {
    const r = armarPlan(entrada({ situacion: sinColchon, objetivos: [objetivo("casa", 50000, 2036)] }));
    const o = r.objetivos[0];
    expect(o.cartera.id).toBe("moderado"); // 10 años, perfil agresivo → hasta moderado
    const rm = Math.pow(1.065, 1 / 12) - 1;
    const fv = (o.aporteNecesario! * (Math.pow(1 + rm, 120) - 1)) / rm;
    expect(fv).toBeCloseTo(50000 * 1.024 ** 10, 2);
    expect(o.estado).toBe("cubierto");
    // Con el aporte del escenario medio, la probabilidad ronda la mitad; el aporte para 80% es mayor.
    expect(o.probabilidad).toBeGreaterThan(0.35);
    expect(o.probabilidad).toBeLessThan(0.75);
    expect(o.aporte80!).toBeGreaterThan(o.aporteNecesario!);
  });

  it("si no alcanza, se cubre primero lo imprescindible y se informa cuánto falta", () => {
    const r = armarPlan(
      entrada({
        situacion: { ...sinColchon, ahorroMensual: 500 },
        objetivos: [objetivo("viaje", 20000, 2030, "deseable"), objetivo("educación", 60000, 2040, "imprescindible")],
      }),
    );
    const [primero, segundo] = r.objetivos;
    expect(primero.objetivo.nombre).toBe("educación");
    expect(primero.estado).toBe("cubierto");
    expect(segundo.estado).not.toBe("cubierto");
    expect(r.aporteFaltanteTotal).toBeGreaterThan(0);
    expect(segundo.montoAlcanzable).toBeLessThan(20000);
    expect(segundo.aniosExtra === null || segundo.aniosExtra > 0).toBe(true);
    expect(r.sobranteMensual).toBeCloseTo(0, 6);
  });

  it("los ahorros actuales se reparten por prioridad", () => {
    const r = armarPlan(
      entrada({
        situacion: { ...sinColchon, ahorros: 10000 },
        objetivos: [objetivo("auto", 15000, 2028, "deseable"), objetivo("casa", 9000, 2028, "imprescindible")],
      }),
    );
    const casa = r.objetivos.find((o) => o.objetivo.nombre === "casa")!;
    const auto = r.objetivos.find((o) => o.objetivo.nombre === "auto")!;
    expect(casa.conAhorros).toBeGreaterThan(8000);
    expect(casa.aporteNecesario).toBe(0);
    expect(auto.conAhorros).toBeCloseTo(10000 - casa.conAhorros, 6);
  });

  it("el sobrante mensual queda informado", () => {
    const r = armarPlan(entrada({ situacion: sinColchon, objetivos: [objetivo("viaje", 3000, 2028)] }));
    expect(r.sobranteMensual).toBeGreaterThan(800);
  });

  it("faltan datos si no hay edad o ahorro mensual", () => {
    const r = armarPlan(entrada({ situacion: { ...sinColchon, edad: null, ahorroMensual: null } }));
    expect(r.faltanDatos).toEqual(["edad", "ahorro mensual"]);
  });
});

describe("proyección del patrimonio", () => {
  it("empieza en los ahorros actuales, crece con los aportes y el bueno supera al malo", () => {
    const r = armarPlan(entrada({ situacion: { edad: 35, ahorroMensual: 1000, ingresos: null, gastos: null, ahorros: 10000, deudas: [] } }));
    const p = r.proyeccion;
    expect(p[0].medio).toBeCloseTo(10000, 6);
    expect(p.length).toBe(11);
    expect(p[10].medio).toBeGreaterThan(p[5].medio);
    expect(p[10].bueno).toBeGreaterThan(p[10].malo);
    expect(p[10].edad).toBe(45);
  });

  it("cuando vence un objetivo, la plata se usa y el patrimonio baja", () => {
    const r = armarPlan(entrada({ situacion: { edad: 35, ahorroMensual: 0, ingresos: null, gastos: null, ahorros: 50000, deudas: [] }, objetivos: [objetivo("casa", 40000, 2031)] }));
    const p = r.proyeccion;
    expect(p[6].medio).toBeLessThan(p[4].medio);
  });

  it("la plata del retiro no se resta: es el capital con el que la persona se retira", () => {
    const base = { edad: 35, ahorroMensual: 0, ingresos: null, gastos: null, ahorros: 50000, deudas: [] };
    const conRetiro = armarPlan(entrada({ situacion: base, objetivos: [objetivo("retiro", 40000, 2031, "imprescindible", "retiro")] })).proyeccion;
    const conCasa = armarPlan(entrada({ situacion: base, objetivos: [objetivo("casa", 40000, 2031, "imprescindible", "casa")] })).proyeccion;
    expect(conRetiro[6].medio).toBeGreaterThan(conRetiro[4].medio);
    expect(conCasa[6].medio).toBeLessThan(conCasa[4].medio);
  });

  it("es determinista", () => {
    const a = armarPlan(entrada({ objetivos: [objetivo("casa", 50000, 2036)] }));
    const b = armarPlan(entrada({ objetivos: [objetivo("casa", 50000, 2036)] }));
    expect(a).toEqual(b);
  });
});
