// Lee el Excel de la matriz en USD de J.P. Morgan y escribe datos/supuestos-AAAA.json.
//
// Uso:  npm run extraer -- referencia/ltcma-2027-matriz-usd.xlsx --edicion 2027 --fecha 2026-09-30
//
// Busca cada clase de datos/clases.json por su nombre en inglés (columna B del Excel).
// Las columnas que usa: C = retorno compuesto de la edición, D = retorno aritmético,
// E = volatilidad, y desde G la matriz de correlaciones (triángulo inferior),
// cuyos encabezados están en la fila 5. Si el Excel de un año cambia de forma,
// el script se detiene y dice qué no encontró.

import ExcelJS from "exceljs";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { ClaseActivo, Supuestos } from "../src/motor/tipos";

const raiz = path.resolve(__dirname, "..");

function argumento(nombre: string, porDefecto?: string): string {
  const i = process.argv.indexOf(`--${nombre}`);
  if (i > -1 && process.argv[i + 1]) return process.argv[i + 1];
  if (porDefecto !== undefined) return porDefecto;
  throw new Error(`Falta el argumento --${nombre}`);
}

const redondear = (x: number) => Math.round(x * 100) / 100;

function numero(valor: ExcelJS.CellValue, donde: string): number {
  const v = typeof valor === "object" && valor !== null && "result" in valor ? valor.result : valor;
  if (typeof v !== "number" || !Number.isFinite(v)) {
    throw new Error(`Esperaba un número en ${donde} y encontré: ${JSON.stringify(valor)}`);
  }
  return v;
}

const texto = (valor: ExcelJS.CellValue) => (typeof valor === "string" ? valor.trim() : "");

async function main() {
  const archivo = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : "referencia/ltcma-2027-matriz-usd.xlsx";
  const edicion = Number(argumento("edicion", "2027"));
  const fecha = argumento("fecha", "2026-09-30");

  const { clases: lista } = JSON.parse(readFileSync(path.join(raiz, "datos/clases.json"), "utf8")) as {
    clases: Omit<ClaseActivo, "retornoCompuesto" | "retornoAritmetico" | "volatilidad">[];
  };

  const libro = new ExcelJS.Workbook();
  await libro.xlsx.readFile(path.resolve(raiz, archivo));
  const hoja = libro.getWorksheet("USD") ?? libro.worksheets[0];

  // Fila de cada nombre (columna B) y columna de cada nombre (encabezados de la fila 5).
  const filaDe = new Map<string, number>();
  hoja.eachRow((fila, n) => {
    const nombre = texto(fila.getCell(2).value);
    if (nombre && n > 5 && !filaDe.has(nombre)) filaDe.set(nombre, n);
  });
  const columnaDe = new Map<string, number>();
  hoja.getRow(5).eachCell((celda, c) => {
    const nombre = texto(celda.value);
    if (nombre && c >= 7) columnaDe.set(nombre, c);
  });

  const faltan = lista.filter((c) => !filaDe.has(c.nombreInforme) || !columnaDe.has(c.nombreInforme));
  if (faltan.length) throw new Error(`No encontré en el Excel: ${faltan.map((c) => c.nombreInforme).join(", ")}`);

  const clases: ClaseActivo[] = lista.map((c) => {
    const fila = hoja.getRow(filaDe.get(c.nombreInforme)!);
    const donde = (col: string) => `${col}${fila.number} (${c.nombreInforme})`;
    return {
      ...c,
      retornoCompuesto: redondear(numero(fila.getCell(3).value, donde("C"))),
      retornoAritmetico: redondear(numero(fila.getCell(4).value, donde("D"))),
      volatilidad: redondear(numero(fila.getCell(5).value, donde("E"))),
    };
  });

  // La matriz del Excel es triangular: el dato está en la fila de la clase que aparece más abajo.
  const correlaciones = lista.map((a) =>
    lista.map((b) => {
      if (a.id === b.id) return 1;
      const [abajo, arriba] = filaDe.get(a.nombreInforme)! > filaDe.get(b.nombreInforme)! ? [a, b] : [b, a];
      const fila = filaDe.get(abajo.nombreInforme)!;
      const columna = columnaDe.get(arriba.nombreInforme)!;
      return redondear(numero(hoja.getRow(fila).getCell(columna).value, `fila ${fila}, columna ${columna}`));
    }),
  );

  const filaInflacion = filaDe.get("U.S. Inflation");
  if (!filaInflacion) throw new Error("No encontré la fila 'U.S. Inflation'");
  const inflacionEEUU = redondear(numero(hoja.getRow(filaInflacion).getCell(3).value, "inflación"));

  const supuestos: Supuestos = {
    ejemplo: false,
    fuente: {
      nombre: "J.P. Morgan Asset Management, Long-Term Capital Market Assumptions",
      edicion,
      fechaDatos: fecha,
      moneda: "USD",
      url: null,
    },
    inflacionEEUU,
    clases,
    correlaciones,
  };

  const destino = path.join(raiz, `datos/supuestos-${edicion}.json`);
  writeFileSync(destino, JSON.stringify(supuestos, null, 2) + "\n");
  console.log(`Listo: ${clases.length} clases e inflación ${inflacionEEUU}% escritas en ${path.relative(raiz, destino)}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
