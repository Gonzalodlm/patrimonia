// Valida lo que llega a la API antes de mandarlo al modelo. Todo texto tiene que ser de una lista
// conocida (perfiles, clases, categorías, códigos de pasos) y toda cifra tiene forma de cifra:
// así nadie puede usar el endpoint para mandarle instrucciones o texto arbitrario al modelo.
import { categoriasObjetivo, estadosTexto, gruposTexto, pasosConocidos, prioridadesTexto, type PedidoTexto } from "./tipos";

export interface Listas {
  perfiles: string[];
  clases: string[];
}

const esCifra = (v: unknown): v is string => typeof v === "string" && v.length <= 24 && /^(USD )?\d[\d.,]*%?$/.test(v);
const esLista = (v: unknown, max: number): v is Record<string, unknown>[] => Array.isArray(v) && v.length <= max;
const enLista = (v: unknown, lista: string[]) => typeof v === "string" && lista.includes(v);
const esPlazo = (v: unknown) => typeof v === "string" && /^\d{1,2} años?$/.test(v);

export function validarPedido(cuerpo: unknown, listas: Listas): PedidoTexto | null {
  if (!cuerpo || typeof cuerpo !== "object") return null;
  const { tipo, datos: d } = cuerpo as { tipo?: unknown; datos?: Record<string, unknown> };
  if (!d || typeof d !== "object") return null;

  if (tipo === "cartera") {
    const ok =
      enLista(d.perfil, listas.perfiles) &&
      (d.cartera === "simple" || d.cartera === "diversificada") &&
      esCifra(d.retornoPorAnio) &&
      esCifra(d.riesgo) &&
      esCifra(d.sharpe) &&
      esCifra(d.caidaEnAnioMalo) &&
      esCifra(d.riesgoCarteraMaximoSharpe) &&
      ["tolerancia", "capacidad", "ambos", "horizonte", "eleccion"].includes(d.motivoPerfil as string) &&
      esLista(d.grupos, 4) &&
      d.grupos.every((g) => enLista(g.grupo, gruposTexto) && esCifra(g.peso)) &&
      esLista(d.principales, 3) &&
      d.principales.every((p) => enLista(p.clase, listas.clases) && esCifra(p.peso));
    return ok ? ({ tipo, datos: d } as unknown as PedidoTexto) : null;
  }

  if (tipo === "plan") {
    const c = d.colchon as Record<string, unknown> | undefined;
    const p = d.patrimonio as Record<string, unknown> | undefined;
    const ok =
      enLista(d.perfil, listas.perfiles) &&
      esCifra(d.ahorroMensual) &&
      !!c &&
      ["completo", "falta", "sin_datos", "propio"].includes(c.estado as string) &&
      (c.faltante === undefined || esCifra(c.faltante)) &&
      (c.mesesParaCompletar === undefined || esCifra(c.mesesParaCompletar)) &&
      Number.isInteger(d.deudasACancelar) &&
      (d.deudasACancelar as number) >= 0 &&
      (d.deudasACancelar as number) <= 20 &&
      esLista(d.objetivos, 15) &&
      d.objetivos.every(
        (o) =>
          enLista(o.tipo, categoriasObjetivo) &&
          esPlazo(o.plazo) &&
          enLista(o.prioridad, prioridadesTexto) &&
          enLista(o.estado, estadosTexto) &&
          esCifra(o.ahorroMensual) &&
          esCifra(o.probabilidad),
      ) &&
      (d.faltantePorMes === null || esCifra(d.faltantePorMes)) &&
      (d.sobrantePorMes === null || esCifra(d.sobrantePorMes)) &&
      !!p &&
      esCifra(p.anio) &&
      esCifra(p.medio) &&
      Array.isArray(d.proximosPasos) &&
      d.proximosPasos.length <= 3 &&
      d.proximosPasos.every((x) => typeof x === "string" && x in pasosConocidos);
    return ok ? ({ tipo, datos: d } as unknown as PedidoTexto) : null;
  }
  return null;
}
