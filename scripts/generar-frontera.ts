// Calcula, una sola vez al compilar, todo lo que el sitio necesita de la optimización y lo escribe
// en datos/frontera.json: las 200 carteras de cada frontera, la cartera de cada perfil y los extremos.
// El navegador no optimiza nada: solo lee este archivo.
//
// De dónde saca los supuestos, en este orden:
//   1. La variable de entorno SUPUESTOS_JSON_BASE64 (así se cargan en Vercel sin subirlos al repositorio).
//   2. El archivo datos/supuestos-AAAA.json de la edición más nueva que haya en la carpeta.
//   3. datos/supuestos.ejemplo.json, con números inventados (avisa en la consola y en el sitio).

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  carteraMaximoSharpe,
  carteraParaVolatilidad,
  crearProblema,
  frontera,
} from "../src/motor/optimizador";
import { validarSupuestos } from "../src/motor/supuestos";
import type { Cartera, Perfil, ReglasCartera, Supuestos } from "../src/motor/tipos";
import type { CarteraGenerada, DatosGenerados, PuntoFrontera } from "../src/motor/generado";

const PUNTOS = 200;
const raiz = path.resolve(__dirname, "..");
const leer = <T>(relativo: string): T => JSON.parse(readFileSync(path.join(raiz, relativo), "utf8")) as T;

function cargarSupuestos(): { supuestos: Supuestos; origen: string } {
  const base64 = process.env.SUPUESTOS_JSON_BASE64;
  if (base64) {
    return { supuestos: JSON.parse(Buffer.from(base64, "base64").toString("utf8")), origen: "variable de entorno SUPUESTOS_JSON_BASE64" };
  }
  const reales = readdirSync(path.join(raiz, "datos"))
    .filter((f) => /^supuestos-\d{4}\.json$/.test(f))
    .sort();
  if (reales.length) {
    const archivo = reales.at(-1)!;
    return { supuestos: leer<Supuestos>(`datos/${archivo}`), origen: `datos/${archivo}` };
  }
  return { supuestos: leer<Supuestos>("datos/supuestos.ejemplo.json"), origen: "datos/supuestos.ejemplo.json" };
}

const r4 = (x: number) => Math.round(x * 10000) / 10000;

function redondearCartera(c: Cartera): Cartera {
  return {
    pesos: Object.fromEntries(Object.entries(c.pesos).map(([k, v]) => [k, r4(v)])),
    retornoAritmetico: r4(c.retornoAritmetico),
    retornoCompuesto: r4(c.retornoCompuesto),
    volatilidad: r4(c.volatilidad),
    sharpe: r4(c.sharpe),
  };
}

function main() {
  const inicio = Date.now();
  const { supuestos, origen } = cargarSupuestos();
  const { carteras: reglas } = leer<{ carteras: Record<string, ReglasCartera> }>("datos/restricciones.json");
  const { perfiles } = leer<{ perfiles: Perfil[] }>("datos/perfiles.json");

  const errores = validarSupuestos(supuestos, Object.values(reglas).map((r) => r.clases));
  if (errores.length) {
    console.error(`Los supuestos de ${origen} tienen problemas:\n - ${errores.join("\n - ")}`);
    process.exit(1);
  }

  const carteras: Record<string, CarteraGenerada> = {};
  for (const [id, r] of Object.entries(reglas)) {
    const problema = crearProblema(supuestos, r);
    const puntos: PuntoFrontera[] = frontera(problema, PUNTOS).map((c) => ({
      volatilidad: r4(c.volatilidad),
      retornoAritmetico: r4(c.retornoAritmetico),
      retornoCompuesto: r4(c.retornoCompuesto),
      sharpe: r4(c.sharpe),
      pesos: r.clases.map((clase) => r4(c.pesos[clase])),
    }));
    carteras[id] = {
      nombre: r.nombre,
      descripcion: r.descripcion,
      clases: r.clases,
      minima: redondearCartera(problema.minima),
      maxima: redondearCartera(problema.maxima),
      maximoSharpe: redondearCartera(carteraMaximoSharpe(problema)),
      perfiles: Object.fromEntries(perfiles.map((p) => [p.id, redondearCartera(carteraParaVolatilidad(problema, p.volatilidadObjetivo))])),
      frontera: puntos,
    };
  }

  const salida: DatosGenerados = {
    ejemplo: supuestos.ejemplo,
    fuente: supuestos.fuente,
    inflacionEEUU: supuestos.inflacionEEUU,
    clases: supuestos.clases,
    perfiles,
    carteras,
  };
  writeFileSync(path.join(raiz, "datos/frontera.json"), JSON.stringify(salida) + "\n");

  if (supuestos.ejemplo) {
    console.warn("ATENCIÓN: se usaron los datos de EJEMPLO (inventados). El sitio va a mostrar un aviso.");
  }
  const resumen = Object.entries(carteras)
    .map(([id, c]) => `${id}: volatilidad de ${c.minima.volatilidad.toFixed(2)}% a ${c.maxima.volatilidad.toFixed(2)}%`)
    .join("; ");
  console.log(`Frontera generada desde ${origen} en ${Date.now() - inicio} ms. ${resumen}.`);
  if (!existsSync(path.join(raiz, "datos/frontera.json"))) process.exit(1);
}

main();
