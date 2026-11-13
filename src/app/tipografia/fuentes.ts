// PROVISORIO: las dos direcciones tipográficas para elegir. Se borra cuando Gonzalo elija.
import { Cormorant_Garamond, Newsreader, Source_Sans_3 } from "next/font/google";

export const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["500", "600"], variable: "--fuente-titular", display: "swap" });
export const sourceSans = Source_Sans_3({ subsets: ["latin"], variable: "--fuente-texto", display: "swap" });
export const newsreaderTitular = Newsreader({ subsets: ["latin"], variable: "--fuente-titular", display: "swap", axes: ["opsz"] });
export const newsreaderTexto = Newsreader({ subsets: ["latin"], variable: "--fuente-texto", display: "swap", axes: ["opsz"] });
