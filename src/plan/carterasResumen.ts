// Arma las carteras que usa el plan (una por perfil y la de liquidez), con retornos netos de costos.
import type { DatosGenerados } from "@/motor/generado";
import { retornoCompuesto } from "@/motor/matematica";
import type { CarteraResumen } from "./patrimonio";
import { costoPonderado } from "./proyecciones";
import { terDeReferencia, type ListaEtfs } from "./etfs";

export function carterasResumen(datos: DatosGenerados, etfs: ListaEtfs, tipo: string, elegidos: Record<string, string>): Record<string, CarteraResumen> {
  const c = datos.carteras[tipo];
  const ter = Object.fromEntries([...c.clases, "liquidez_usd"].map((id) => [id, terDeReferencia(etfs, id, elegidos[id])]));
  const salida: Record<string, CarteraResumen> = {};
  for (const p of datos.perfiles) {
    const cp = c.perfiles[p.id];
    const arit = cp.retornoAritmetico - costoPonderado(cp.pesos, ter);
    salida[p.id] = { id: p.id, nombre: p.nombre, retornoAritmetico: arit, retornoCompuesto: retornoCompuesto(arit, cp.volatilidad), volatilidad: cp.volatilidad };
  }
  const liq = datos.clases.find((x) => x.id === "liquidez_usd")!;
  const aritLiq = liq.retornoAritmetico - ter.liquidez_usd;
  salida.liquidez = {
    id: "liquidez",
    nombre: "Liquidez en dólares",
    retornoAritmetico: aritLiq,
    retornoCompuesto: retornoCompuesto(aritLiq, liq.volatilidad),
    volatilidad: liq.volatilidad,
  };
  return salida;
}
