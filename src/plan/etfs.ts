export interface Etf {
  nombre: string;
  emisor: string;
  ticker: string;
  bolsa: string;
  isin: string;
  domicilio: string;
  moneda: string;
  politica: "acumula" | "distribuye";
  ter: number;
  indice: string;
  tipo: string;
}

export interface ListaEtfs {
  verificado: string;
  clases: Record<string, { nota: string | null; etfs: Etf[] }>;
}

/** Ficha del ETF en justETF, donde se verificaron los datos. */
export const enlaceFicha = (isin: string) => `https://www.justetf.com/en/etf-profile.html?isin=${isin}`;

/** Costo de referencia de una clase cuando la persona todavía no eligió ETF: el promedio de sus opciones. */
export function terDeReferencia(lista: ListaEtfs, clase: string, elegido?: string): number {
  const etfs = lista.clases[clase]?.etfs ?? [];
  const e = etfs.find((x) => x.isin === elegido);
  if (e) return e.ter;
  return etfs.length ? etfs.reduce((s, x) => s + x.ter, 0) / etfs.length : 0;
}
