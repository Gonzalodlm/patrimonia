import { cholesky } from "./matematica";
import type { Supuestos } from "./tipos";

/**
 * Revisa que un archivo de supuestos tenga sentido antes de usarlo.
 * Devuelve la lista de problemas encontrados, en castellano; vacía si está todo bien.
 *
 * `grupos` son los conjuntos de clases que se usan juntos (uno por cartera). La matriz completa
 * no necesita ser consistente: con correlaciones redondeadas a dos decimales, "acciones globales"
 * junto con las acciones regionales (de las que está hecha) ya no lo es. Lo que importa es que
 * cada grupo que se usa en una cartera lo sea.
 */
export function validarSupuestos(s: Supuestos, grupos: string[][] = []): string[] {
  const errores: string[] = [];
  const n = s.clases?.length ?? 0;
  if (!n) return ["No hay clases de activo."];

  const ids = new Set<string>();
  for (const c of s.clases) {
    if (ids.has(c.id)) errores.push(`La clase ${c.id} está repetida.`);
    ids.add(c.id);
    for (const campo of ["retornoCompuesto", "retornoAritmetico", "volatilidad"] as const) {
      if (typeof c[campo] !== "number" || !Number.isFinite(c[campo])) errores.push(`${c.id}: falta ${campo}.`);
    }
    if (c.volatilidad < 0) errores.push(`${c.id}: la volatilidad no puede ser negativa.`);
  }
  if (!ids.has("liquidez_usd")) errores.push("Falta la clase liquidez_usd, que se usa como referencia para el ratio de Sharpe.");

  const m = s.correlaciones;
  if (!Array.isArray(m) || m.length !== n) {
    errores.push(`La matriz de correlaciones tiene ${m?.length ?? 0} filas y debería tener ${n}.`);
    return errores;
  }
  if (m.some((fila) => fila.length !== n)) {
    errores.push(`Alguna fila de la matriz no tiene ${n} columnas.`);
    return errores;
  }
  for (let i = 0; i < n; i++) {
    if (m[i][i] !== 1) errores.push(`La diagonal de la matriz debe ser 1 (fila ${s.clases[i].id}).`);
    for (let j = 0; j < i; j++) {
      if (m[i][j] !== m[j][i]) errores.push(`La matriz no es simétrica entre ${s.clases[i].id} y ${s.clases[j].id}.`);
      if (Math.abs(m[i][j]) > 1) errores.push(`Correlación fuera de rango entre ${s.clases[i].id} y ${s.clases[j].id}.`);
    }
  }
  if (!errores.length) {
    const posicion = new Map(s.clases.map((c, i) => [c.id, i]));
    for (const grupo of grupos) {
      const idx = grupo.map((id) => posicion.get(id));
      if (idx.some((i) => i === undefined)) {
        errores.push(`Un grupo nombra clases que no existen: ${grupo.filter((id) => !posicion.has(id)).join(", ")}.`);
        continue;
      }
      const sub = idx.map((i) => idx.map((j) => m[i!][j!]));
      if (!cholesky(sub)) {
        errores.push(
          `La matriz de correlaciones es imposible para el grupo ${grupo.join(", ")}: esas correlaciones no pueden darse todas juntas (no es definida positiva). Revisá que no haya un número mal copiado.`,
        );
      }
    }
  }
  if (typeof s.inflacionEEUU !== "number") errores.push("Falta la inflación de EE.UU.");
  if (!s.fuente?.edicion || !s.fuente?.fechaDatos) errores.push("Falta la edición o la fecha de los datos.");
  return errores;
}
