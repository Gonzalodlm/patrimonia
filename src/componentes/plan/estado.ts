// Lo que la persona va cargando en el plan. Se guarda solo en su navegador (localStorage).
// Si el almacenamiento no está disponible (modo privado, bloqueado), el plan funciona igual,
// pero se pierde al cerrar la página.

import type { CategoriaObjetivo, Deuda, Objetivo, Prioridad, Situacion, TipoDeuda } from "@/plan/patrimonio";

export type TipoCartera = "simple" | "diversificada";

/**
 * Versión de lo guardado. Subila cuando cambien las preguntas del test: las respuestas viejas
 * dejan de valer (la misma letra puede significar otra cosa) y se le pide a la persona que lo
 * haga de nuevo. Su situación y sus objetivos se conservan.
 */
const VERSION = 2;

export interface EstadoPlan {
  situacion: Situacion;
  objetivos: Objetivo[];
  version: typeof VERSION;
  paso: number;
  /** Pregunta del test en la que va (índice). */
  pregunta: number;
  respuestas: Record<string, string>;
  /** Perfil elegido por la persona; puede ser igual o más conservador que el del test. */
  perfilElegido: string | null;
  tipoCartera: TipoCartera;
  monto: number;
  /** ETF elegido para cada clase (por ISIN). */
  etfs: Record<string, string>;
}

const estadoInicial: EstadoPlan = {
  version: VERSION,
  paso: 0,
  pregunta: 0,
  respuestas: {},
  perfilElegido: null,
  tipoCartera: "diversificada",
  monto: 10000,
  etfs: {},
  situacion: { edad: null, ahorroMensual: null, ingresos: null, gastos: null, ahorros: null, deudas: [] },
  objetivos: [],
};

const CLAVE = "patrimonia.plan.v1";
const ULTIMO_PASO = 4;

// ─── Lectura segura ──────────────────────────────────────────────────────────
// Lo guardado puede venir de una versión vieja del sitio o estar dañado. Cada campo se revisa y,
// si no tiene la forma esperada, se reemplaza por su valor inicial: nunca rompe la página.

type Objeto = Record<string, unknown>;
const esObjeto = (v: unknown): v is Objeto => !!v && typeof v === "object" && !Array.isArray(v);
const numeroONull = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : null);
const entero = (v: unknown, min: number, max: number, defecto: number) => (typeof v === "number" && Number.isInteger(v) && v >= min && v <= max ? v : defecto);
const textos = (v: unknown): Record<string, string> =>
  esObjeto(v) ? Object.fromEntries(Object.entries(v).filter((e): e is [string, string] => typeof e[1] === "string" && e[1].length <= 40).slice(0, 60)) : {};

const tiposDeuda: TipoDeuda[] = ["tarjeta", "prestamo_personal", "hipoteca", "otra"];
const categorias: CategoriaObjetivo[] = ["emergencia", "casa", "auto", "educacion", "viaje", "retiro", "otro"];
const prioridades: Prioridad[] = ["imprescindible", "importante", "deseable"];

function deuda(v: unknown): Deuda | null {
  if (!esObjeto(v) || typeof v.id !== "string" || !tiposDeuda.includes(v.tipo as TipoDeuda)) return null;
  return { id: v.id, tipo: v.tipo as TipoDeuda, saldo: numeroONull(v.saldo) ?? 0, tasa: numeroONull(v.tasa) };
}

function objetivo(v: unknown): Objetivo | null {
  if (!esObjeto(v) || typeof v.id !== "string" || !categorias.includes(v.categoria as CategoriaObjetivo)) return null;
  return {
    id: v.id,
    categoria: v.categoria as CategoriaObjetivo,
    nombre: typeof v.nombre === "string" ? v.nombre.slice(0, 60) : "",
    monto: numeroONull(v.monto) ?? 0,
    anio: entero(v.anio, 1900, 2300, 0),
    prioridad: prioridades.includes(v.prioridad as Prioridad) ? (v.prioridad as Prioridad) : "importante",
  };
}

/** Convierte lo leído del navegador en un estado válido. Si no sirve, devuelve el estado inicial. */
export function sanear(guardado: unknown): EstadoPlan {
  if (!esObjeto(guardado) || (guardado.version !== VERSION && guardado.version !== 1)) return estadoInicial;
  const s = esObjeto(guardado.situacion) ? guardado.situacion : {};
  const base: EstadoPlan = {
    version: VERSION,
    paso: entero(guardado.paso, 0, ULTIMO_PASO, 0),
    pregunta: entero(guardado.pregunta, 0, 100, 0),
    respuestas: textos(guardado.respuestas),
    perfilElegido: typeof guardado.perfilElegido === "string" ? guardado.perfilElegido : null,
    tipoCartera: guardado.tipoCartera === "simple" ? "simple" : "diversificada",
    monto: numeroONull(guardado.monto) ?? estadoInicial.monto,
    etfs: textos(guardado.etfs),
    situacion: {
      edad: numeroONull(s.edad),
      ahorroMensual: numeroONull(s.ahorroMensual),
      ingresos: numeroONull(s.ingresos),
      gastos: numeroONull(s.gastos),
      ahorros: numeroONull(s.ahorros),
      deudas: Array.isArray(s.deudas) ? s.deudas.map(deuda).filter((d): d is Deuda => d !== null).slice(0, 20) : [],
    },
    objetivos: Array.isArray(guardado.objetivos) ? guardado.objetivos.map(objetivo).filter((o): o is Objetivo => o !== null).slice(0, 15) : [],
  };
  // Guardado con el test anterior: se conserva la situación y se vuelve a hacer el test.
  if (guardado.version === 1) return { ...base, paso: 0, pregunta: 0, respuestas: {}, perfilElegido: null };
  return base;
}

function leerEstado(): EstadoPlan {
  try {
    const texto = window.localStorage.getItem(CLAVE);
    return texto ? sanear(JSON.parse(texto)) : estadoInicial;
  } catch {
    return estadoInicial;
  }
}

/** Devuelve false si no se pudo guardar. */
function guardarEstado(estado: EstadoPlan): boolean {
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(estado));
    return true;
  } catch {
    return false;
  }
}

function borrarEstado() {
  try {
    window.localStorage.removeItem(CLAVE);
  } catch {
    // nada que hacer
  }
}

// ─── Tienda para React (useSyncExternalStore) ────────────────────────────────
// El servidor dibuja la primera pantalla con el estado inicial (así carga rápido); en el navegador,
// React lee lo guardado y actualiza sin errores de diferencia entre servidor y navegador.

let actual: EstadoPlan | null = null;
let puede: boolean | null = null;
const oyentes = new Set<() => void>();

export const tienda = {
  suscribir(oyente: () => void) {
    oyentes.add(oyente);
    return () => oyentes.delete(oyente);
  },
  obtener(): EstadoPlan {
    if (!actual) actual = leerEstado();
    return actual;
  },
  inicial(): EstadoPlan {
    return estadoInicial;
  },
  cambiar(cambio: EstadoPlan | ((e: EstadoPlan) => EstadoPlan)) {
    actual = typeof cambio === "function" ? cambio(tienda.obtener()) : cambio;
    guardarEstado(actual);
    oyentes.forEach((o) => o());
  },
  reiniciar() {
    borrarEstado();
    tienda.cambiar(estadoInicial);
  },
  /** Si el navegador deja guardar (se prueba una sola vez). */
  puedeGuardar(): boolean {
    if (puede === null) puede = guardarEstado(tienda.obtener());
    return puede;
  },
};
