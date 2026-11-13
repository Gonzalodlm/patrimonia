import type { ClaseActivo, TipoClase } from "@/motor/tipos";

// Colores de los cuatro grupos, validados con el verificador de paletas (separación para daltonismo
// y visión normal). El dorado tiene poco contraste con el fondo: por eso la mezcla siempre lleva
// etiquetas y tabla, nunca solo color.
export const grupos: { id: TipoClase; nombre: string; color: string; textoSobreColor: string }[] = [
  { id: "liquidez", nombre: "Liquidez", color: "#3f8a5a", textoSobreColor: "#ffffff" },
  { id: "renta_fija", nombre: "Renta fija", color: "#2e66a8", textoSobreColor: "#ffffff" },
  { id: "acciones", nombre: "Acciones", color: "#a33a28", textoSobreColor: "#ffffff" },
  { id: "alternativos", nombre: "Inmobiliario, oro y materias primas", color: "#b58e1a", textoSobreColor: "#0b0b0b" },
];

export const colorDeGrupo = (tipo: TipoClase) => grupos.find((g) => g.id === tipo)!.color;

/** Suma los pesos (en %) de cada grupo. */
export function pesosPorGrupo(pesos: Record<string, number>, clases: ClaseActivo[]): { id: TipoClase; nombre: string; peso: number }[] {
  const tipo = new Map(clases.map((c) => [c.id, c.tipo]));
  return grupos.map((g) => ({
    id: g.id,
    nombre: g.nombre,
    peso: Object.entries(pesos).reduce((s, [id, p]) => s + (tipo.get(id) === g.id ? p : 0), 0),
  }));
}
