// Fórmulas chicas que usan el motor y la interfaz. Todo en porcentaje.

/**
 * Retorno compuesto (geométrico) a partir del aritmético y la volatilidad, suponiendo que los
 * retornos siguen una distribución lognormal. Es la fórmula que reproduce los retornos compuestos
 * publicados por J.P. Morgan para cada clase de activo:
 *
 *   compuesto = (1 + r) / √(1 + σ² / (1 + r)²) − 1
 *
 * Para volatilidades bajas da casi lo mismo que la aproximación r − σ²/2.
 */
export function retornoCompuesto(aritmetico: number, volatilidad: number): number {
  const r = aritmetico / 100;
  const s = volatilidad / 100;
  return ((1 + r) / Math.sqrt(1 + (s * s) / ((1 + r) * (1 + r))) - 1) * 100;
}

/** Ratio de Sharpe como lo calcula el informe: (retorno aritmético − el de la liquidez) / volatilidad. */
export function sharpe(aritmetico: number, volatilidad: number, aritmeticoLiquidez: number): number {
  return volatilidad > 0 ? (aritmetico - aritmeticoLiquidez) / volatilidad : 0;
}

/** Descomposición de Cholesky. Devuelve null si la matriz no es definida positiva. */
export function cholesky(m: number[][]): number[][] | null {
  const n = m.length;
  const l = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let suma = m[i][j];
      for (let k = 0; k < j; k++) suma -= l[i][k] * l[j][k];
      if (i === j) {
        if (suma <= 1e-12) return null;
        l[i][i] = Math.sqrt(suma);
      } else {
        l[i][j] = suma / l[j][j];
      }
    }
  }
  return l;
}
