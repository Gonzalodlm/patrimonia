// Lo que se le pide al modelo. El modelo solo redacta: los números ya vienen calculados.
import { pasosConocidos, type PedidoTexto } from "./tipos";

export const SISTEMA = `Sos el redactor de Patrimonia, una guía educativa y gratuita de Uruguay para armar una cartera de inversión a largo plazo. Le explicás a una persona común, que no sabe de finanzas, su propio resultado.

Cómo escribís:
- Español rioplatense con voseo ("tenés", "tu cartera"). Frases cortas y concretas. Sin jerga; si usás un término, explicalo en pocas palabras.
- Texto plano: sin títulos, listas, negritas, emojis ni enlaces. Uno o dos párrafos, máximo 110 palabras.
- Tono sereno y honesto. Nada de "potenciá", "desbloqueá", "increíble" ni promesas.
- Empezá directo con el contenido: sin saludos ("Hola"), sin presentarte y sin despedida.

Reglas que no podés romper:
1. Usá solo los números que aparecen en los datos, escritos exactamente igual (por ejemplo "7,1%" o "USD 800"). No calcules, no redondees, no inventes cifras, años ni porcentajes.
2. No recomiendes productos, ETFs, bancos ni brokers por su nombre.
3. Los retornos son estimaciones de largo plazo, no promesas: no digas que algo "va a" rendir.
4. No agregues avisos legales: se muestran aparte.
5. Escribí todo con palabras comunes, como se lo dirías a alguien en persona. Nunca uses palabras pegadas o nombres técnicos de datos, y no repitas palabras ("te falta un faltante").`;

// Los datos se le pasan al modelo ya escritos en castellano, sin nombres de campos: si recibe
// JSON con claves como "mesesParaCompletar", a veces las copia dentro del texto.

const motivoTexto: Record<string, string> = {
  tolerancia: "su tolerancia ante una caída, que pesó más que su capacidad para asumir riesgo",
  capacidad: "su capacidad para asumir riesgo, que pide más prudencia que su tolerancia",
  ambos: "su tolerancia ante una caída y su capacidad para asumir riesgo, que dieron el mismo perfil",
  horizonte: "el plazo: va a usar la plata en pocos años",
  eleccion: "su elección: eligió un perfil más conservador que el que dio el test",
};

function fichaCartera(d: Extract<PedidoTexto, { tipo: "cartera" }>["datos"]): string {
  return [
    `- Perfil: ${d.perfil}.`,
    `- Qué definió el perfil: ${motivoTexto[d.motivoPerfil] ?? d.motivoPerfil}.`,
    `- Cartera ${d.cartera}.`,
    `- Retorno esperado: ${d.retornoPorAnio} por año, a largo plazo.`,
    `- Riesgo (cuánto oscila por año): ${d.riesgo}. Ratio de Sharpe: ${d.sharpe}.`,
    `- Cómo se reparte: ${d.grupos.map((g) => `${g.grupo.toLowerCase()} ${g.peso}`).join(", ")}.`,
    `- Clases con más peso: ${d.principales.map((c) => `${c.clase} ${c.peso}`).join(", ")}.`,
    `- En un año malo, de esos que pasan 1 vez cada 20, podría caer ${d.caidaEnAnioMalo} o más.`,
    `- La cartera de mayor Sharpe tiene un riesgo de ${d.riesgoCarteraMaximoSharpe}.`,
  ].join("\n");
}

function fichaPlan(d: Extract<PedidoTexto, { tipo: "plan" }>["datos"]): string {
  const c = d.colchon;
  const colchon =
    c.estado === "falta"
      ? `le faltan ${c.faltante} para completarlo${c.mesesParaCompletar ? `, y con su ahorro lo completa en ${c.mesesParaCompletar} ${c.mesesParaCompletar === "1" ? "mes" : "meses"}` : ""}`
      : c.estado === "completo"
        ? "ya está completo con sus ahorros"
        : c.estado === "sin_datos"
          ? "no cargó sus gastos: tiene que separar entre 3 y 6 meses de gastos antes de invertir"
          : "lo cargó como un objetivo más, que va primero";
  const deudas = d.deudasACancelar === 0 ? "ninguna" : d.deudasACancelar === 1 ? "una" : String(d.deudasACancelar);
  const lineas = [
    `- Perfil: ${d.perfil}.`,
    `- Ahorro por mes: ${d.ahorroMensual}.`,
    `- Fondo de emergencia: ${colchon}.`,
    `- Deudas que conviene cancelar antes de invertir: ${deudas}.`,
  ];
  if (d.objetivos.length) {
    lineas.push("- Objetivos, en el orden en que se cubren:");
    for (const o of d.objetivos)
      lineas.push(`  · ${o.tipo}, dentro de ${o.plazo}, prioridad ${o.prioridad}: ${o.estado}. Le toca ${o.ahorroMensual} por mes; probabilidad de llegar: ${o.probabilidad}.`);
  } else {
    lineas.push("- No cargó objetivos: todo su ahorro va a su cartera de largo plazo.");
  }
  if (d.faltantePorMes) lineas.push(`- Para cubrir todos los objetivos le faltarían ${d.faltantePorMes} por mes.`);
  if (d.sobrantePorMes) lineas.push(`- Después de cubrir sus objetivos le sobran ${d.sobrantePorMes} por mes.`);
  lineas.push(
    `- En el escenario medio, hasta ${d.juntado.hastaAnio} llegaría a juntar ${d.juntado.medio} en dólares de hoy, contando lo que use en sus objetivos.`,
    `- Próximos pasos: ${d.proximosPasos.map((x) => pasosConocidos[x]).join("; ")}.`,
  );
  return lineas.join("\n");
}

export function mensajePara(p: PedidoTexto): string {
  if (p.tipo === "cartera") {
    return `Explicá en uno o dos párrafos por qué esta cartera corresponde a este perfil, qué hay adentro y qué puede pasar en un año malo.

Datos:
${fichaCartera(p.datos)}`;
  }
  return `Resumí este plan en uno o dos párrafos: qué hacer primero, cómo quedan los objetivos y cuáles son los próximos pasos. Máximo 120 palabras: si hay más de tres objetivos, no los detalles uno por uno; nombrá los más importantes y resumí el resto en una frase. Si no hay deudas para cancelar, no las menciones. Lo que llegaría a juntar no es su "patrimonio final": cuenta también lo que usa en sus objetivos.

Datos:
${fichaPlan(p.datos)}`;
}
