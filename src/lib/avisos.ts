// Avisos legales (sección 11 del documento). Un solo lugar para que el abogado los revise
// y para que la landing, el pie, la cartera y el plan muestren siempre el mismo texto.
// Nunca se mezclan con texto generado por el modelo de lenguaje.

export const avisos: { titulo: string; texto: string }[] = [
  {
    titulo: "Es una herramienta educativa",
    texto:
      "Patrimonia no es asesoramiento financiero, legal ni tributario, y no es una recomendación de inversión hecha a tu medida. Muestra un método y un resultado orientativo. La decisión es tuya.",
  },
  {
    titulo: "No somos un asesor regulado",
    texto: "Patrimonia no es un asesor de inversiones ni una entidad regulada por el Banco Central del Uruguay.",
  },
  {
    titulo: "Los retornos no son promesas",
    texto:
      "Son estimaciones de largo plazo hechas por un tercero. Nadie sabe cuánto va a rendir una inversión. Toda inversión puede perder valor, y en un año malo puede perder mucho.",
  },
  {
    titulo: "Los ETFs son ejemplos",
    texto:
      "Para cada clase de activo listamos algunos ETFs como ejemplo. No son una recomendación de compra y Patrimonia no recibe nada de sus emisores.",
  },
  {
    titulo: "No tenemos relación con J.P. Morgan",
    texto:
      "Los supuestos son de J.P. Morgan Asset Management. Patrimonia no tiene relación con J.P. Morgan ni cuenta con su aval.",
  },
  {
    titulo: "Consultá antes de invertir",
    texto: "Antes de invertir, hablá con un asesor habilitado.",
  },
];

/** Versión corta, para el pie de cada página. */
export const avisoCorto =
  "Patrimonia es una herramienta educativa. No es asesoramiento financiero, legal ni tributario, ni una recomendación personalizada de inversión. No es un asesor de inversiones ni una entidad regulada por el Banco Central del Uruguay. Los retornos son estimaciones de largo plazo de un tercero, no promesas: toda inversión puede perder valor. Los ETFs se listan como ejemplos y Patrimonia no recibe nada de sus emisores. Los supuestos son de J.P. Morgan Asset Management; Patrimonia no tiene relación con J.P. Morgan ni cuenta con su aval. Antes de invertir, consultá con un asesor habilitado.";
