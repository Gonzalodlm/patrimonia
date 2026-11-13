// Forma de datos/frontera.json, el archivo que genera `npm run frontera` y que lee el sitio.
import type { Cartera, ClaseActivo, Fuente, Perfil } from "./tipos";

/** Un punto de la frontera. Los pesos van en % y en el mismo orden que `CarteraGenerada.clases`. */
export interface PuntoFrontera {
  volatilidad: number;
  retornoAritmetico: number;
  retornoCompuesto: number;
  sharpe: number;
  pesos: number[];
}

export interface CarteraGenerada {
  nombre: string;
  descripcion: string;
  clases: string[];
  minima: Cartera;
  maxima: Cartera;
  maximoSharpe: Cartera;
  /** La cartera de cada perfil, por id de perfil. */
  perfiles: Record<string, Cartera>;
  frontera: PuntoFrontera[];
}

export interface DatosGenerados {
  ejemplo: boolean;
  fuente: Fuente;
  inflacionEEUU: number;
  clases: ClaseActivo[];
  perfiles: Perfil[];
  carteras: Record<string, CarteraGenerada>;
}
