// Formato de números de Uruguay: coma decimal y punto de miles.

const cache = new Map<number, Intl.NumberFormat>();

function formateador(decimales: number) {
  let f = cache.get(decimales);
  if (!f) {
    f = new Intl.NumberFormat("es-UY", { minimumFractionDigits: decimales, maximumFractionDigits: decimales });
    cache.set(decimales, f);
  }
  return f;
}

/** 7.456 → "7,46" */
export const numero = (x: number, decimales = 2) => formateador(decimales).format(x);

/** 7.456 → "7,5%" */
export const porcentaje = (x: number, decimales = 1) => `${numero(x, decimales)}%`;

/** 10000 → "USD 10.000" */
export const dolares = (x: number) => `USD ${numero(Math.round(x), 0)}`;
