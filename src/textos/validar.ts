// Controles sobre el texto que devuelve el modelo. Si alguno falla, se descarta y se usa la plantilla.

const NUMERO = /\d+(?:[.,]\d+)*/g;

/** Números chicos que pueden aparecer en cualquier texto ("3 a 6 meses", "1 de cada 20", "una vez cada 2 años"). */
const PERMITIDOS_SIEMPRE = new Set(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "12", "20"]);

/** Todos los números que aparecen en los datos enviados, escritos igual que en la web. */
export function numerosPermitidos(datos: unknown): Set<string> {
  const salida = new Set(PERMITIDOS_SIEMPRE);
  const recorrer = (v: unknown) => {
    if (typeof v === "string") for (const m of v.match(NUMERO) ?? []) salida.add(m);
    else if (typeof v === "number") salida.add(String(v));
    else if (Array.isArray(v)) v.forEach(recorrer);
    else if (v && typeof v === "object") Object.values(v).forEach(recorrer);
  };
  recorrer(datos);
  return salida;
}

/** Saca un saludo inicial ("Hola.", "¡Hola! ", "Hola, ") si el modelo lo puso igual, y deja la mayúscula inicial. */
export function sinSaludo(texto: string): string {
  const limpio = texto.trim().replace(/^¡?\s*(hola|buenas tardes|buenas noches|buenas|buen día|buenos días)\s*[.!,]+\s*/i, "");
  return limpio.charAt(0).toUpperCase() + limpio.slice(1);
}

export interface Revision {
  valido: boolean;
  motivo?: string;
}

export function revisarTexto(texto: string, datos: unknown, maxPalabras = 160): Revision {
  const limpio = texto.trim();
  if (!limpio) return { valido: false, motivo: "vacío" };
  const palabras = limpio.split(/\s+/).length;
  if (palabras > maxPalabras) return { valido: false, motivo: `demasiado largo (${palabras} palabras)` };
  if (/[*#_`>|{}"]|https?:\/\//.test(limpio)) return { valido: false, motivo: "formato o enlaces no permitidos" };
  // Nombres de campos copiados de los datos ("ahorroMensual", "hastaAnio"): minúscula seguida de mayúscula dentro de una palabra.
  const campos = limpio.match(/\b[a-záéíóúñ]+[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ]*\b/g);
  if (campos) return { valido: false, motivo: `nombres de campos en el texto: ${[...new Set(campos)].join(", ")}` };
  const permitidos = numerosPermitidos(datos);
  const ajenos = (limpio.match(NUMERO) ?? []).filter((n) => !permitidos.has(n));
  if (ajenos.length) return { valido: false, motivo: `números que no están en los datos: ${ajenos.join(", ")}` };
  return { valido: true };
}
