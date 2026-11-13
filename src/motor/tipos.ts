// Tipos compartidos del motor. Todos los números van en porcentaje:
// 7,5% se guarda como 7.5 y una volatilidad de 18% como 18.

export type TipoClase = "liquidez" | "renta_fija" | "acciones" | "alternativos";

export interface ClaseActivo {
  id: string;
  nombre: string;
  nombreInforme: string;
  tipo: TipoClase;
  retornoCompuesto: number;
  retornoAritmetico: number;
  volatilidad: number;
}

export interface Fuente {
  nombre: string;
  edicion: number;
  fechaDatos: string; // AAAA-MM-DD
  moneda: string;
  url: string | null;
}

export interface Supuestos {
  ejemplo: boolean;
  fuente: Fuente;
  inflacionEEUU: number;
  clases: ClaseActivo[];
  /** Matriz de correlaciones en el mismo orden que `clases`. */
  correlaciones: number[][];
}

export interface Proporcion {
  clase: string;
  grupo: string[];
  minimo?: number;
  maximo?: number;
}

export interface ReglasCartera {
  nombre: string;
  descripcion: string;
  clases: string[];
  topeGeneral: number;
  topes: Record<string, number>;
  proporciones: Proporcion[];
}

export interface Perfil {
  id: string;
  nombre: string;
  volatilidadObjetivo: number;
}

/** Una cartera concreta: pesos en % (suman 100) y sus números. */
export interface Cartera {
  pesos: Record<string, number>;
  retornoAritmetico: number;
  retornoCompuesto: number;
  volatilidad: number;
  sharpe: number;
}
