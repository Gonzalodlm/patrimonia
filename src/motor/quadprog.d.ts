// Tipos para la librería quadprog (Goldfarb-Idnani). Usa índices desde 1, como el Fortran original:
// el elemento 0 de cada arreglo se ignora.
declare module "quadprog" {
  export function solveQP(
    Dmat: number[][],
    dvec: number[],
    Amat: number[][],
    bvec: number[],
    meq?: number,
  ): { solution: number[]; value: number[]; message: string };
}
