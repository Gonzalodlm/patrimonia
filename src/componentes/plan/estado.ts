// Lo que la persona va cargando en el plan. Se guarda solo en su navegador (localStorage).
// Si el almacenamiento no está disponible (modo privado, bloqueado), el plan funciona igual,
// pero se pierde al cerrar la página.

export type TipoCartera = "simple" | "diversificada";

export interface EstadoPlan {
  version: 1;
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

export const estadoInicial: EstadoPlan = {
  version: 1,
  paso: 0,
  pregunta: 0,
  respuestas: {},
  perfilElegido: null,
  tipoCartera: "diversificada",
  monto: 10000,
  etfs: {},
};

const CLAVE = "patrimonia.plan.v1";

export function leerEstado(): EstadoPlan {
  try {
    const texto = window.localStorage.getItem(CLAVE);
    if (!texto) return estadoInicial;
    const guardado = JSON.parse(texto) as Partial<EstadoPlan>;
    if (guardado.version !== 1) return estadoInicial;
    return { ...estadoInicial, ...guardado };
  } catch {
    return estadoInicial;
  }
}

/** Devuelve false si no se pudo guardar. */
export function guardarEstado(estado: EstadoPlan): boolean {
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(estado));
    return true;
  } catch {
    return false;
  }
}

export function borrarEstado() {
  try {
    window.localStorage.removeItem(CLAVE);
  } catch {
    // nada que hacer
  }
}
