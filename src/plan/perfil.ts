// Cálculo del perfil de riesgo a partir de las respuestas del test (datos/cuestionario.json).

export type Bloque = "tolerancia" | "capacidad";

export interface Opcion {
  id: string;
  texto?: string;
  puntos: number;
  /** Para la pregunta de carteras: a qué perfil corresponde la opción. */
  perfil?: string;
  /** Si se elige esta opción, el perfil final no puede pasar este. */
  perfilMaximo?: string;
}

export interface Pregunta {
  id: string;
  bloque: Bloque;
  texto: string;
  ayuda?: string;
  tipo?: "carteras";
  opciones: Opcion[];
}

export interface Cuestionario {
  umbrales: number[];
  preguntas: Pregunta[];
}

export interface ResultadoBloque {
  puntos: number;
  maximo: number;
  perfil: string;
}

export interface ResultadoPerfil {
  tolerancia: ResultadoBloque;
  capacidad: ResultadoBloque;
  /** Tope por horizonte, si alguna respuesta lo impuso. */
  tope: string | null;
  perfil: string;
  /** Qué definió el perfil final: el bloque más bajo o el tope por horizonte. */
  limitante: "tolerancia" | "capacidad" | "ambos" | "horizonte";
}

/** Índice del perfil (0 = el más conservador) para una suma de puntos. */
function indicePorPuntos(puntos: number, umbrales: number[]): number {
  return umbrales.filter((u) => puntos >= u).length;
}

export function faltantes(c: Cuestionario, respuestas: Record<string, string>): string[] {
  return c.preguntas.filter((p) => !p.opciones.some((o) => o.id === respuestas[p.id])).map((p) => p.id);
}

/**
 * Calcula el perfil. `perfiles` es la lista ordenada de ids, del más conservador al más agresivo.
 * Lanza un error si falta alguna respuesta.
 */
export function calcularPerfil(c: Cuestionario, respuestas: Record<string, string>, perfiles: string[]): ResultadoPerfil {
  const sinResponder = faltantes(c, respuestas);
  if (sinResponder.length) throw new Error(`Faltan respuestas: ${sinResponder.join(", ")}`);

  const bloque = (b: Bloque): ResultadoBloque => {
    const preguntas = c.preguntas.filter((p) => p.bloque === b);
    const puntos = preguntas.reduce((s, p) => s + p.opciones.find((o) => o.id === respuestas[p.id])!.puntos, 0);
    const maximo = preguntas.reduce((s, p) => s + Math.max(...p.opciones.map((o) => o.puntos)), 0);
    return { puntos, maximo, perfil: perfiles[Math.min(indicePorPuntos(puntos, c.umbrales), perfiles.length - 1)] };
  };
  const tolerancia = bloque("tolerancia");
  const capacidad = bloque("capacidad");

  const topes = c.preguntas
    .map((p) => p.opciones.find((o) => o.id === respuestas[p.id])?.perfilMaximo)
    .filter((t): t is string => !!t)
    .map((t) => perfiles.indexOf(t));
  const indiceTope = topes.length ? Math.min(...topes) : Infinity;

  const iT = perfiles.indexOf(tolerancia.perfil);
  const iC = perfiles.indexOf(capacidad.perfil);
  const minimoBloques = Math.min(iT, iC);
  const final = Math.min(minimoBloques, indiceTope);

  let limitante: ResultadoPerfil["limitante"];
  if (indiceTope < minimoBloques) limitante = "horizonte";
  else if (iT === iC) limitante = "ambos";
  else limitante = iT < iC ? "tolerancia" : "capacidad";

  return {
    tolerancia,
    capacidad,
    tope: Number.isFinite(indiceTope) ? perfiles[indiceTope] : null,
    perfil: perfiles[final],
    limitante,
  };
}
