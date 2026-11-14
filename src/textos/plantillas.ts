// Textos armados con plantillas. Se usan si el modelo no está configurado, falla, tarda o su
// respuesta no pasa los controles. La web funciona completa solo con esto.
import type { DatosTextoCartera, DatosTextoPlan } from "./tipos";

const motivos: Record<string, string> = {
  tolerancia: "Tu perfil lo definió cómo reaccionás ante una caída, que pesó más que tu capacidad para asumir riesgo.",
  capacidad: "Tu perfil lo definió tu capacidad para asumir riesgo: tu situación pide más prudencia que tu tolerancia.",
  ambos: "Tu tolerancia ante una caída y tu capacidad para asumir riesgo apuntaron al mismo perfil.",
  horizonte: "Como vas a usar la plata en pocos años, el perfil queda acotado por el plazo.",
  eleccion: "Elegiste un perfil más conservador que el que dio el test.",
};

/** Pasa a minúscula solo la primera letra, para no romper siglas como EE.UU. o REITs. */
const inicialMinuscula = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

export function plantillaCartera(d: DatosTextoCartera): string {
  const mayor = [...d.grupos].sort((a, b) => parseFloat(b.peso) - parseFloat(a.peso))[0];
  const principales = d.principales.map((p) => `${inicialMinuscula(p.clase)} (${p.peso})`).join(", ");
  const cifra = (s: string) => parseFloat(s.replace(".", "").replace(",", "."));
  const sharpe =
    cifra(d.riesgo) > cifra(d.riesgoCarteraMaximoSharpe) + 0.5
      ? `La cartera de mayor Sharpe tiene menos riesgo (${d.riesgoCarteraMaximoSharpe}), pero también rinde menos: tu perfil te permite ir más arriba en la frontera.`
      : "Está muy cerca de la cartera de mayor Sharpe, la que más retorno da por cada punto de riesgo.";
  return [
    `Para un perfil ${d.perfil.toLowerCase()}, esta es la cartera de mayor retorno esperado que no pasa un riesgo de ${d.riesgo}. ${motivos[d.motivoPerfil] ?? ""}`,
    `La parte más grande va a ${inicialMinuscula(mayor.grupo)} (${mayor.peso}), y las clases con más peso son ${principales}. Se espera que rinda ${d.retornoPorAnio} por año a largo plazo, pero en un año malo, de esos que pasan 1 vez cada 20, podría caer ${d.caidaEnAnioMalo} o más. ${sharpe}`,
  ].join("\n\n");
}

export function plantillaPlan(d: DatosTextoPlan): string {
  const partes: string[] = [];
  if (d.colchon.estado === "falta") {
    partes.push(
      `Lo primero es tu fondo de emergencia: te faltan ${d.colchon.faltante}${d.colchon.mesesParaCompletar ? `, que completás en ${d.colchon.mesesParaCompletar} meses con tu ahorro` : ""}.`,
    );
  } else if (d.colchon.estado === "completo") {
    partes.push("Tu fondo de emergencia ya está cubierto con tus ahorros.");
  } else if (d.colchon.estado === "sin_datos") {
    partes.push("Antes de invertir, separá entre 3 y 6 meses de gastos como fondo de emergencia.");
  }
  if (d.deudasACancelar > 0) partes.push(d.deudasACancelar === 1 ? "Conviene cancelar una deuda antes de invertir." : "Conviene cancelar tus deudas de consumo antes de invertir.");
  const cubiertos = d.objetivos.filter((o) => o.estado === "cubierto").length;
  if (d.objetivos.length) {
    partes.push(
      `Con ${d.ahorroMensual} por mes cubrís ${cubiertos} de tus ${d.objetivos.length} objetivos${d.faltantePorMes ? `; para cubrirlos todos te faltarían ${d.faltantePorMes} por mes` : ""}.`,
    );
  }
  if (d.sobrantePorMes) partes.push(`Te sobran ${d.sobrantePorMes} por mes para tu patrimonio de largo plazo.`);
  partes.push(
    `En el escenario medio, hasta ${d.juntado.hastaAnio} llegarías a juntar ${d.juntado.medio} en dólares de hoy${d.objetivos.length ? ", contando lo que uses en tus objetivos" : ""}.`,
  );
  return partes.join(" ");
}
