// Los próximos tres pasos del plan, con un código fijo (lo que se manda al modelo) y el texto que ve la persona.
import { dolares } from "../lib/formato";
import type { ResultadoPlan, Situacion } from "./patrimonio";

export const nombreDeuda: Record<string, string> = {
  tarjeta: "la tarjeta de crédito",
  prestamo_personal: "el préstamo personal",
  hipoteca: "la hipoteca",
  otra: "la deuda",
};

/**
 * Cómo quedan los objetivos, para el resumen y el PDF. Si no se cubre ninguno, en vez de "0 de 1"
 * se muestra cuánto falta ahorrar por mes para cubrirlos.
 */
export function estadoObjetivos(plan: ResultadoPlan): { titulo: string; valor: string; detalle?: string; frase: string } | null {
  const n = plan.objetivos.length;
  if (!n) return null;
  const cubiertos = plan.objetivos.filter((o) => o.estado === "cubierto").length;
  const falta = plan.aporteFaltanteTotal > 1 ? dolares(plan.aporteFaltanteTotal) : null;
  const tus = n === 1 ? "tu objetivo" : "tus objetivos";
  if (cubiertos === n || !falta)
    return {
      titulo: n === 1 ? "Tu objetivo" : "Tus objetivos",
      valor: cubiertos === n ? (n === 1 ? "Cubierto" : "Todos cubiertos") : `${cubiertos} de ${n} cubiertos`,
      frase: cubiertos === n ? (n === 1 ? "Tu objetivo queda cubierto." : `Tus ${n} objetivos quedan cubiertos.`) : `Cubrís ${cubiertos} de tus ${n} objetivos.`,
    };
  if (cubiertos === 0)
    return { titulo: `Para cubrir ${tus}`, valor: falta, detalle: "más de ahorro por mes", frase: `Para cubrir ${tus} te faltan ${falta} por mes.` };
  return {
    titulo: "Objetivos cubiertos",
    valor: `${cubiertos} de ${n}`,
    detalle: `Faltan ${falta} por mes`,
    frase: `Cubrís ${cubiertos} de tus ${n} objetivos; para cubrirlos todos te faltan ${falta} por mes.`,
  };
}

export function proximosPasos(plan: ResultadoPlan, s: Situacion): { codigo: string; texto: string }[] {
  const pasos: { codigo: string; texto: string }[] = [];
  if (plan.colchon.automatico && plan.colchon.objetivo === null)
    pasos.push({ codigo: "calcular_colchon", texto: "Calculá tus gastos por mes y separá entre 3 y 6 meses en liquidez en dólares: es tu fondo de emergencia." });
  if (plan.colchon.faltante > 0)
    pasos.push({
      codigo: "completar_colchon",
      texto: `Completá tu fondo de emergencia: juntá ${dolares(plan.colchon.faltante)} más en liquidez en dólares, por ejemplo en un ETF de letras del Tesoro.`,
    });
  for (const d of plan.deudas)
    if (d.cancelarPrimero && d.deuda.saldo > 0) pasos.push({ codigo: "cancelar_deuda", texto: `Cancelá ${nombreDeuda[d.deuda.tipo]} (${dolares(d.deuda.saldo)}) antes de invertir.` });
  pasos.push({ codigo: "abrir_broker", texto: "Abrí una cuenta en un broker que te dé acceso a las bolsas europeas, comparando cuánto cobra y quién lo regula." });
  const aportes = plan.objetivos.reduce((t, o) => t + o.aporte, 0) + plan.sobranteMensual;
  if (aportes > 0)
    pasos.push({ codigo: "programar_aporte", texto: `Programá un aporte de ${dolares(aportes)} por mes y repartilo entre las carteras de tus objetivos como dice este plan.` });
  else if ((s.ahorros ?? 0) > 0) pasos.push({ codigo: "invertir_ahorros", texto: "Invertí tus ahorros en las carteras de tus objetivos, como dice este plan." });
  if (plan.aporteFaltanteTotal > 1)
    pasos.push({
      codigo: "ajustar_objetivos",
      texto: `Decidí qué ajustar para cubrir todo: ahorrar ${dolares(plan.aporteFaltanteTotal)} más por mes, esperar más o bajar algún objetivo.`,
    });
  pasos.push({ codigo: "revisar_anual", texto: "Revisá este plan una vez por año, cuando rebalancees tu cartera." });
  // Un solo paso por código (puede haber varias deudas).
  return pasos.filter((p, i) => pasos.findIndex((q) => q.codigo === p.codigo) === i).slice(0, 3);
}
