// Qué puede pasar con una inversión: rangos de resultados a varios años.
//
// Supuesto: el crecimiento de cada año es lognormal, con la media (aritmética) y la volatilidad de
// la cartera, y los años son independientes. Con eso, el valor a N años también es lognormal y sus
// percentiles se calculan con una fórmula, sin simulación: los mismos datos dan siempre lo mismo.

/** Parámetros del logaritmo del crecimiento anual, a partir de la media aritmética y la volatilidad (en %). */
export function parametrosLognormales(aritmetico: number, volatilidad: number) {
  const r = aritmetico / 100;
  const s = volatilidad / 100;
  const varianza = Math.log(1 + (s * s) / ((1 + r) * (1 + r)));
  return { mu: Math.log(1 + r) - varianza / 2, sigma: Math.sqrt(varianza) };
}

/** Valor z de la normal estándar para los percentiles que usamos. */
export const Z = { p5: -1.6449, p10: -1.2816, p50: 0, p90: 1.2816 } as const;

/** Valor de `monto` después de `anios`, en el percentil dado por `z`. */
export function valorEnPercentil(monto: number, anios: number, aritmetico: number, volatilidad: number, z: number): number {
  const { mu, sigma } = parametrosLognormales(aritmetico, volatilidad);
  return monto * Math.exp(mu * anios + z * sigma * Math.sqrt(anios));
}

export interface Rango {
  anios: number;
  malo: number; // percentil 10
  medio: number; // percentil 50
  bueno: number; // percentil 90
}

export function rangos(monto: number, aritmetico: number, volatilidad: number, horizontes = [1, 5, 10, 15]): Rango[] {
  return horizontes.map((anios) => ({
    anios,
    malo: valorEnPercentil(monto, anios, aritmetico, volatilidad, Z.p10),
    medio: valorEnPercentil(monto, anios, aritmetico, volatilidad, Z.p50),
    bueno: valorEnPercentil(monto, anios, aritmetico, volatilidad, Z.p90),
  }));
}

/** Peor caída razonable en un año: lo que se pierde en 1 año de cada 20 (percentil 5). Devuelve un monto positivo. */
export function peorCaidaUnAnio(monto: number, aritmetico: number, volatilidad: number): number {
  return Math.max(0, monto - valorEnPercentil(monto, 1, aritmetico, volatilidad, Z.p5));
}

/** Costo anual ponderado (TER) de una cartera, en %. `ter` da el costo elegido para cada clase. */
export function costoPonderado(pesos: Record<string, number>, ter: Record<string, number>): number {
  return Object.entries(pesos).reduce((s, [id, peso]) => s + (peso / 100) * (ter[id] ?? 0), 0);
}
