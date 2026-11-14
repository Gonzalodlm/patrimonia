// Arma los datos anónimos que se mandan al modelo a partir de lo que ya calculó la web.
import { dolares, numero, porcentaje } from "@/lib/formato";
import type { ResultadoPlan, Situacion } from "@/plan/patrimonio";
import { proximosPasos } from "@/plan/pasos";
import type { DatosTextoCartera, DatosTextoPlan } from "./tipos";
import { categoriasObjetivo, estadosTexto } from "./tipos";

export function datosCartera(a: {
  perfil: string;
  cartera: "simple" | "diversificada";
  retorno: number;
  riesgo: number;
  sharpe: number;
  grupos: { nombre: string; peso: number }[];
  principales: { nombre: string; peso: number }[];
  caidaPorcentaje: number;
  riesgoMaximoSharpe: number;
  motivoPerfil: string;
}): DatosTextoCartera {
  return {
    perfil: a.perfil,
    cartera: a.cartera,
    retornoPorAnio: porcentaje(a.retorno, 1),
    riesgo: porcentaje(a.riesgo, 1),
    sharpe: numero(a.sharpe, 2),
    grupos: a.grupos.map((g) => ({ grupo: g.nombre, peso: porcentaje(g.peso, 0) })),
    principales: a.principales.slice(0, 3).map((p) => ({ clase: p.nombre, peso: porcentaje(p.peso, 1) })),
    caidaEnAnioMalo: porcentaje(a.caidaPorcentaje, 0),
    riesgoCarteraMaximoSharpe: porcentaje(a.riesgoMaximoSharpe, 1),
    motivoPerfil: a.motivoPerfil,
  };
}

const categoria: Record<string, string> = {
  emergencia: categoriasObjetivo[0],
  casa: categoriasObjetivo[1],
  auto: categoriasObjetivo[2],
  educacion: categoriasObjetivo[3],
  viaje: categoriasObjetivo[4],
  retiro: categoriasObjetivo[5],
  otro: categoriasObjetivo[6],
};
const estado: Record<string, string> = { cubierto: estadosTexto[0], parcial: estadosTexto[1], sin_cubrir: estadosTexto[2] };

export function datosPlan(plan: ResultadoPlan, s: Situacion, perfil: string): DatosTextoPlan {
  const c = plan.colchon;
  return {
    perfil,
    ahorroMensual: dolares(s.ahorroMensual ?? 0),
    colchon: !c.automatico
      ? { estado: "propio" }
      : c.objetivo === null
        ? { estado: "sin_datos" }
        : c.faltante > 0
          ? { estado: "falta", faltante: dolares(c.faltante), ...(c.mesesParaCompletar !== null ? { mesesParaCompletar: String(c.mesesParaCompletar) } : {}) }
          : { estado: "completo" },
    deudasACancelar: plan.deudas.filter((d) => d.cancelarPrimero).length,
    objetivos: plan.objetivos.map((o) => ({
      tipo: categoria[o.objetivo.categoria],
      plazo: `${Math.min(99, o.anios)} ${o.anios === 1 ? "año" : "años"}`,
      prioridad: o.objetivo.prioridad,
      estado: estado[o.estado],
      ahorroMensual: dolares(o.aporte),
      probabilidad: porcentaje(o.probabilidad * 100, 0),
    })),
    faltantePorMes: plan.aporteFaltanteTotal > 1 ? dolares(plan.aporteFaltanteTotal) : null,
    sobrantePorMes: plan.sobranteMensual > 1 ? dolares(plan.sobranteMensual) : null,
    juntado: { hastaAnio: String(plan.juntado.anio), medio: dolares(plan.juntado.medio) },
    proximosPasos: proximosPasos(plan, s).map((p) => p.codigo),
  };
}
