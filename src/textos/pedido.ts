// Valida lo que llega a la API antes de mandarlo al modelo. Todo texto tiene que ser de una lista
// conocida (perfiles, clases, categorías, códigos de pasos) y toda cifra tiene forma de cifra.
// Además el pedido se ARMA DE NUEVO solo con los campos conocidos: cualquier campo extra que
// alguien agregue se descarta, así nadie puede usar el endpoint para mandarle instrucciones o
// texto arbitrario al modelo.
import {
  categoriasObjetivo,
  estadosTexto,
  gruposTexto,
  pasosConocidos,
  prioridadesTexto,
  type DatosTextoCartera,
  type DatosTextoPlan,
  type PedidoTexto,
} from "./tipos";

interface Listas {
  perfiles: string[];
  clases: string[];
}

type Objeto = Record<string, unknown>;

const esObjeto = (v: unknown): v is Objeto => !!v && typeof v === "object" && !Array.isArray(v);
const esCifra = (v: unknown): v is string => typeof v === "string" && v.length <= 24 && /^(USD )?\d[\d.,]*%?$/.test(v);
const esLista = (v: unknown, max: number): v is Objeto[] => Array.isArray(v) && v.length <= max && v.every(esObjeto);
const enLista = (v: unknown, lista: readonly string[]): v is string => typeof v === "string" && lista.includes(v);
const esPlazo = (v: unknown): v is string => typeof v === "string" && /^\d{1,2} años?$/.test(v);

const motivosPerfil = ["tolerancia", "capacidad", "ambos", "horizonte", "eleccion"] as const;
const estadosColchon = ["completo", "falta", "sin_datos", "propio"] as const;

function cartera(d: Objeto, listas: Listas): DatosTextoCartera | null {
  if (
    !enLista(d.perfil, listas.perfiles) ||
    (d.cartera !== "simple" && d.cartera !== "diversificada") ||
    !esCifra(d.retornoPorAnio) ||
    !esCifra(d.riesgo) ||
    !esCifra(d.sharpe) ||
    !esCifra(d.caidaEnAnioMalo) ||
    !esCifra(d.riesgoCarteraMaximoSharpe) ||
    !enLista(d.motivoPerfil, motivosPerfil) ||
    !esLista(d.grupos, 4) ||
    !esLista(d.principales, 3)
  )
    return null;
  const grupos: DatosTextoCartera["grupos"] = [];
  for (const g of d.grupos) {
    if (!enLista(g.grupo, gruposTexto) || !esCifra(g.peso)) return null;
    grupos.push({ grupo: g.grupo, peso: g.peso });
  }
  const principales: DatosTextoCartera["principales"] = [];
  for (const p of d.principales) {
    if (!enLista(p.clase, listas.clases) || !esCifra(p.peso)) return null;
    principales.push({ clase: p.clase, peso: p.peso });
  }
  return {
    perfil: d.perfil,
    cartera: d.cartera,
    retornoPorAnio: d.retornoPorAnio,
    riesgo: d.riesgo,
    sharpe: d.sharpe,
    grupos,
    principales,
    caidaEnAnioMalo: d.caidaEnAnioMalo,
    riesgoCarteraMaximoSharpe: d.riesgoCarteraMaximoSharpe,
    motivoPerfil: d.motivoPerfil,
  };
}

function plan(d: Objeto, listas: Listas): DatosTextoPlan | null {
  const c = d.colchon;
  const j = d.juntado;
  if (
    !enLista(d.perfil, listas.perfiles) ||
    !esCifra(d.ahorroMensual) ||
    !esObjeto(c) ||
    !enLista(c.estado, estadosColchon) ||
    (c.faltante !== undefined && !esCifra(c.faltante)) ||
    (c.mesesParaCompletar !== undefined && !esCifra(c.mesesParaCompletar)) ||
    typeof d.deudasACancelar !== "number" ||
    !Number.isInteger(d.deudasACancelar) ||
    d.deudasACancelar < 0 ||
    d.deudasACancelar > 20 ||
    !esLista(d.objetivos, 15) ||
    (d.faltantePorMes !== null && !esCifra(d.faltantePorMes)) ||
    (d.sobrantePorMes !== null && !esCifra(d.sobrantePorMes)) ||
    !esObjeto(j) ||
    !esCifra(j.hastaAnio) ||
    !esCifra(j.medio) ||
    !Array.isArray(d.proximosPasos) ||
    d.proximosPasos.length > 3
  )
    return null;
  const objetivos: DatosTextoPlan["objetivos"] = [];
  for (const o of d.objetivos) {
    if (
      !enLista(o.tipo, categoriasObjetivo) ||
      !esPlazo(o.plazo) ||
      !enLista(o.prioridad, prioridadesTexto) ||
      !enLista(o.estado, estadosTexto) ||
      !esCifra(o.ahorroMensual) ||
      !esCifra(o.probabilidad)
    )
      return null;
    objetivos.push({ tipo: o.tipo, plazo: o.plazo, prioridad: o.prioridad, estado: o.estado, ahorroMensual: o.ahorroMensual, probabilidad: o.probabilidad });
  }
  const proximosPasos: string[] = [];
  for (const p of d.proximosPasos) {
    if (typeof p !== "string" || !Object.hasOwn(pasosConocidos, p)) return null;
    proximosPasos.push(p);
  }
  return {
    perfil: d.perfil,
    ahorroMensual: d.ahorroMensual,
    colchon: {
      estado: c.estado as DatosTextoPlan["colchon"]["estado"],
      ...(c.faltante !== undefined ? { faltante: c.faltante as string } : {}),
      ...(c.mesesParaCompletar !== undefined ? { mesesParaCompletar: c.mesesParaCompletar as string } : {}),
    },
    deudasACancelar: d.deudasACancelar,
    objetivos,
    faltantePorMes: d.faltantePorMes as string | null,
    sobrantePorMes: d.sobrantePorMes as string | null,
    juntado: { hastaAnio: j.hastaAnio, medio: j.medio },
    proximosPasos,
  };
}

export function validarPedido(cuerpo: unknown, listas: Listas): PedidoTexto | null {
  if (!esObjeto(cuerpo) || !esObjeto(cuerpo.datos)) return null;
  if (cuerpo.tipo === "cartera") {
    const datos = cartera(cuerpo.datos, listas);
    return datos && { tipo: "cartera", datos };
  }
  if (cuerpo.tipo === "plan") {
    const datos = plan(cuerpo.datos, listas);
    return datos && { tipo: "plan", datos };
  }
  return null;
}
