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
4. No agregues avisos legales: se muestran aparte.`;

export function mensajePara(p: PedidoTexto): string {
  if (p.tipo === "cartera") {
    return `Explicá en uno o dos párrafos por qué esta cartera corresponde a este perfil, qué hay adentro y qué puede pasar en un año malo. "motivoPerfil" dice qué definió el perfil: la tolerancia ante una caída, la capacidad para asumir riesgo, las dos, el plazo corto, o "eleccion" si la persona eligió uno más conservador que el del test.

Datos:
${JSON.stringify(p.datos, null, 2)}`;
  }
  const pasos = p.datos.proximosPasos.map((c) => pasosConocidos[c]);
  return `Resumí este plan en uno o dos párrafos: qué hacer primero, cómo quedan los objetivos y cuáles son los próximos pasos. Los objetivos van por tipo, sin nombres. Máximo 120 palabras: si hay más de tres objetivos, no los detalles uno por uno; nombrá los más importantes y resumí el resto en una frase. "deudasACancelar" es cuántas deudas conviene cancelar antes de invertir (si es 1, escribí "una deuda"; si es 0, no hace falta mencionarlo). "juntado" es todo lo que la persona llegaría a juntar hasta ese año en el escenario medio, en dólares de hoy, contando lo que use en sus objetivos: no lo llames "patrimonio final".

Datos:
${JSON.stringify({ ...p.datos, proximosPasos: pasos }, null, 2)}`;
}
