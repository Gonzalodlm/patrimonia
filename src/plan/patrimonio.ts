// El plan patrimonial: colchón, deudas, una cartera por objetivo, cuánto ahorrar por mes,
// qué pasa si no alcanza y cómo evoluciona el patrimonio.
//
// Criterios en datos/criterios-plan.json. Montos en dólares; los objetivos se cargan en dólares de
// hoy y se ajustan por la inflación de EE.UU. del informe. La proyección se muestra en dólares de hoy.

import { aporteParaProbabilidad, parametrosMensuales, probabilidadDeLlegar, shocks } from "./simulacion";

export type Prioridad = "imprescindible" | "importante" | "deseable";
export type CategoriaObjetivo = "emergencia" | "casa" | "auto" | "educacion" | "viaje" | "retiro" | "otro";
export type TipoDeuda = "tarjeta" | "prestamo_personal" | "hipoteca" | "otra";

export interface Deuda {
  id: string;
  tipo: TipoDeuda;
  saldo: number;
  /** Tasa anual en %, si se conoce. */
  tasa: number | null;
}

export interface Situacion {
  edad: number | null;
  ahorroMensual: number | null;
  ingresos: number | null;
  gastos: number | null;
  ahorros: number | null;
  deudas: Deuda[];
}

export interface Objetivo {
  id: string;
  categoria: CategoriaObjetivo;
  nombre: string;
  /** En dólares de hoy. */
  monto: number;
  anio: number;
  prioridad: Prioridad;
}

/** Una cartera ya resumida, con retornos netos de costos (en %). */
export interface CarteraResumen {
  id: string;
  nombre: string;
  retornoAritmetico: number;
  retornoCompuesto: number;
  volatilidad: number;
}

export interface Criterios {
  plazos: { hasta: number | null; cartera?: "liquidez"; perfilMaximo?: string; texto: string }[];
  fondoEmergencia: { meses: number; mesesSiIngresosInestables: number; respuestasInestables: Record<string, string[]> };
  deudas: { siempreCancelarPrimero: string[]; nuncaCancelarPrimero: string[] };
  retiro: { multiplicadorGastoAnual: number; edadDeRetiroSugerida: number };
}

export interface EntradaPlan {
  situacion: Situacion;
  objetivos: Objetivo[];
  /** Perfil de la persona (id). */
  perfil: string;
  /** Ids de perfiles, del más conservador al más agresivo. */
  perfiles: string[];
  /** Carteras disponibles: una por perfil y "liquidez". */
  carteras: Record<string, CarteraResumen>;
  criterios: Criterios;
  respuestasTest: Record<string, string>;
  anioActual: number;
  inflacion: number;
  caminos?: number;
  semilla?: number;
}

export interface ResultadoColchon {
  /** false si la persona cargó su propio objetivo de fondo de emergencia. */
  automatico: boolean;
  meses: number;
  /** Monto del colchón; null si no hay gastos cargados. */
  objetivo: number | null;
  conAhorros: number;
  faltante: number;
  /** Meses de ahorro para completarlo; null si no se puede (sin ahorro mensual). */
  mesesParaCompletar: number | null;
}

export interface ResultadoDeuda {
  deuda: Deuda;
  cancelarPrimero: boolean;
  motivo: string;
  pagadoConAhorros: number;
}

export type Estado = "cubierto" | "parcial" | "sin_cubrir";

export interface ResultadoObjetivo {
  objetivo: Objetivo;
  anios: number;
  cartera: CarteraResumen;
  /** Monto en dólares de la fecha del objetivo (con inflación). */
  montoNominal: number;
  conAhorros: number;
  /** Aporte mensual necesario para llegar en el escenario medio. null si ya no hay meses para aportar. */
  aporteNecesario: number | null;
  /** Aporte mensual que le toca, según lo que alcanza. */
  aporte: number;
  /** Probabilidad aproximada de llegar con el aporte que le toca (0 a 1). */
  probabilidad: number;
  /** Aporte mensual para llegar con 80% de probabilidad. */
  aporte80: number | null;
  estado: Estado;
  /** Monto al que se llega en el escenario medio con lo asignado, en dólares de hoy. */
  montoAlcanzable: number;
  /** Años más que haría falta esperar con el mismo aporte; null si no alcanza ni con 30 años más. */
  aniosExtra: number | null;
}

export interface PuntoProyeccion {
  anio: number;
  edad: number | null;
  malo: number;
  medio: number;
  bueno: number;
}

export interface ResultadoPlan {
  faltanDatos: string[];
  colchon: ResultadoColchon;
  deudas: ResultadoDeuda[];
  /** Meses de ahorro que se van en colchón y deudas antes de empezar con los objetivos. null si nunca. */
  mesesAntesDeObjetivos: number | null;
  objetivos: ResultadoObjetivo[];
  /** Ahorro mensual que queda libre después de cubrir lo que se pudo. */
  sobranteMensual: number;
  /** Ahorros actuales que no hicieron falta para nada de lo anterior. */
  ahorrosSinAsignar: number;
  /** Cuánto más habría que ahorrar por mes para cubrir todos los objetivos. */
  aporteFaltanteTotal: number;
  proyeccion: PuntoProyeccion[];
}

const ordenPrioridad: Record<Prioridad, number> = { imprescindible: 0, importante: 1, deseable: 2 };

/** Cartera que le toca a un objetivo según el plazo y el perfil. */
export function carteraParaPlazo(anios: number, e: Pick<EntradaPlan, "criterios" | "perfil" | "perfiles" | "carteras">): CarteraResumen {
  const tramo = e.criterios.plazos.find((t) => t.hasta === null || anios < t.hasta)!;
  if (tramo.cartera === "liquidez") return e.carteras.liquidez;
  const tope = e.perfiles.indexOf(tramo.perfilMaximo!);
  const propio = e.perfiles.indexOf(e.perfil);
  return e.carteras[e.perfiles[Math.min(tope, propio)]];
}

const mensual = (anual: number) => Math.pow(1 + anual / 100, 1 / 12) - 1;

/** Valor futuro de un aporte mensual al final de cada mes durante `meses` meses. */
function factorAnualidad(tasaMensual: number, meses: number): number {
  if (meses <= 0) return 0;
  return Math.abs(tasaMensual) < 1e-12 ? meses : (Math.pow(1 + tasaMensual, meses) - 1) / tasaMensual;
}

/** Meses para pagar un saldo con un pago fijo; null si el pago no alcanza ni para los intereses. */
function mesesParaPagar(saldo: number, pago: number, tasaAnual: number | null): number | null {
  if (saldo <= 0) return 0;
  if (pago <= 0) return null;
  const i = tasaAnual ? mensual(tasaAnual) : 0;
  if (i === 0) return saldo / pago;
  if (pago <= i * saldo) return null;
  return -Math.log(1 - (i * saldo) / pago) / Math.log(1 + i);
}

export function armarPlan(e: EntradaPlan): ResultadoPlan {
  const s = e.situacion;
  const faltanDatos: string[] = [];
  if (!s.edad) faltanDatos.push("edad");
  if (s.ahorroMensual === null || s.ahorroMensual < 0) faltanDatos.push("ahorro mensual");
  const ahorroMensual = Math.max(0, s.ahorroMensual ?? 0);
  let ahorros = Math.max(0, s.ahorros ?? 0);
  const perfilCartera = e.carteras[e.perfil];

  // 1. Colchón primero.
  const fe = e.criterios.fondoEmergencia;
  const inestable = Object.entries(fe.respuestasInestables).some(([p, ops]) => ops.includes(e.respuestasTest[p]));
  const meses = inestable ? fe.mesesSiIngresosInestables : fe.meses;
  const manual = e.objetivos.some((o) => o.categoria === "emergencia");
  const objetivoColchon = manual ? null : s.gastos ? s.gastos * meses : null;
  const colchonConAhorros = objetivoColchon ? Math.min(ahorros, objetivoColchon) : 0;
  ahorros -= colchonConAhorros;
  const faltanteColchon = objetivoColchon ? objetivoColchon - colchonConAhorros : 0;
  const mesesColchon = faltanteColchon > 0 ? (ahorroMensual > 0 ? faltanteColchon / ahorroMensual : null) : 0;

  // 2. Deudas: las que conviene cancelar antes de invertir se pagan con ahorros y después con el ahorro mensual.
  const deudas: ResultadoDeuda[] = s.deudas.map((d) => {
    let cancelarPrimero: boolean;
    let motivo: string;
    if (e.criterios.deudas.siempreCancelarPrimero.includes(d.tipo)) {
      cancelarPrimero = true;
      motivo = "Las deudas de consumo suelen tener tasas más altas que lo que rinde cualquier cartera.";
    } else if (e.criterios.deudas.nuncaCancelarPrimero.includes(d.tipo)) {
      cancelarPrimero = false;
      motivo = "Una hipoteca suele tener una tasa baja y plazo largo: no hace falta cancelarla antes de invertir.";
    } else if (d.tasa !== null && d.tasa > perfilCartera.retornoCompuesto) {
      cancelarPrimero = true;
      motivo = "Su tasa es mayor que el retorno esperado de tu cartera: pagarla rinde más que invertir.";
    } else {
      cancelarPrimero = false;
      motivo = d.tasa === null ? "Sin la tasa no podemos compararla; si es alta, conviene cancelarla primero." : "Su tasa es menor que el retorno esperado de tu cartera.";
    }
    const pagadoConAhorros = cancelarPrimero ? Math.min(ahorros, d.saldo) : 0;
    ahorros -= pagadoConAhorros;
    return { deuda: d, cancelarPrimero, motivo, pagadoConAhorros };
  });
  let mesesDeudas: number | null = 0;
  for (const r of deudas) {
    if (!r.cancelarPrimero) continue;
    const m = mesesParaPagar(r.deuda.saldo - r.pagadoConAhorros, ahorroMensual, r.deuda.tasa);
    mesesDeudas = m === null || mesesDeudas === null ? null : mesesDeudas + m;
  }
  const mesesAntes = mesesColchon === null || mesesDeudas === null ? null : Math.max(0, Math.ceil(mesesColchon + mesesDeudas - 1e-9));

  // 3. Objetivos, en orden: fondo de emergencia propio, prioridad y fecha.
  const caminos = e.caminos ?? 500;
  const anios = (o: Objetivo) => Math.max(0, o.anio - e.anioActual);
  const ordenados = [...e.objetivos].sort(
    (a, b) =>
      Number(b.categoria === "emergencia") - Number(a.categoria === "emergencia") ||
      ordenPrioridad[a.prioridad] - ordenPrioridad[b.prioridad] ||
      a.anio - b.anio,
  );
  // Meses a simular: hasta un año después del último objetivo, y al menos 10 años para la proyección.
  const horizonteMeses = Math.max(10 * 12, ...ordenados.map((o) => Math.round(anios(o) * 12) + 12));
  const z = shocks(caminos, horizonteMeses, e.semilla ?? 2027);

  let disponible = ahorroMensual;
  const objetivos: ResultadoObjetivo[] = ordenados.map((o) => {
    const n = anios(o);
    const cartera = carteraParaPlazo(n, e);
    const r = cartera.retornoCompuesto / 100;
    const rm = mensual(cartera.retornoCompuesto);
    const montoNominal = o.monto * Math.pow(1 + e.inflacion / 100, n);
    const totalMeses = Math.round(n * 12);
    const desde = mesesAntes ?? totalMeses;
    const mesesAporte = Math.max(0, totalMeses - desde);

    const necesarioHoy = montoNominal / Math.pow(1 + r, n);
    const conAhorros = Math.min(ahorros, necesarioHoy);
    ahorros -= conAhorros;
    const conAhorrosFuturo = conAhorros * Math.pow(1 + r, n);
    const resta = Math.max(0, montoNominal - conAhorrosFuturo);
    const aporteNecesario = resta <= 1e-6 ? 0 : mesesAporte > 0 ? resta / factorAnualidad(rm, mesesAporte) : null;
    const aporte = aporteNecesario === null ? 0 : Math.min(aporteNecesario, disponible);
    disponible -= aporte;

    const cubierto = aporteNecesario !== null && aporte >= aporteNecesario - 0.005;
    const estado: Estado = cubierto ? "cubierto" : aporte > 0 || conAhorros > 0 ? "parcial" : "sin_cubrir";
    const alcanzableNominal = conAhorrosFuturo + aporte * factorAnualidad(rm, mesesAporte);
    const montoAlcanzable = Math.min(o.monto, alcanzableNominal / Math.pow(1 + e.inflacion / 100, n));

    let aniosExtra: number | null = 0;
    if (!cubierto) {
      aniosExtra = null;
      for (let k = 1; k <= 30; k++) {
        const objetivoK = o.monto * Math.pow(1 + e.inflacion / 100, n + k);
        const carteraK = carteraParaPlazo(n + k, e);
        const rK = carteraK.retornoCompuesto / 100;
        const llega = conAhorros * Math.pow(1 + rK, n + k) + aporte * factorAnualidad(mensual(carteraK.retornoCompuesto), Math.round((n + k) * 12) - desde);
        if (llega >= objetivoK) {
          aniosExtra = k;
          break;
        }
      }
    }

    const filas = z.map((f) => f.subarray(0, totalMeses));
    const base = { inicial: conAhorros, desdeMes: desde, meses: totalMeses };
    const probabilidad = totalMeses === 0 ? (conAhorros >= montoNominal - 1e-6 ? 1 : 0) : probabilidadDeLlegar({ ...base, mensual: aporte }, cartera.retornoAritmetico, cartera.volatilidad, montoNominal, filas);
    const aporte80 = totalMeses === 0 ? null : aporteParaProbabilidad(base, cartera.retornoAritmetico, cartera.volatilidad, montoNominal, 0.8, filas);

    return { objetivo: o, anios: n, cartera, montoNominal, conAhorros, aporteNecesario, aporte, probabilidad, aporte80, estado, montoAlcanzable, aniosExtra };
  });

  const aporteFaltanteTotal = objetivos.reduce((t, o) => t + (o.aporteNecesario === null ? 0 : Math.max(0, o.aporteNecesario - o.aporte)), 0);

  // 4. Proyección del patrimonio invertido, año a año, en dólares de hoy.
  const proyeccion = proyectar(e, {
    colchonInicial: colchonConAhorros,
    faltanteColchon,
    mesesColchon,
    mesesAntes,
    objetivos,
    sobranteMensual: mesesAntes === null ? 0 : disponible,
    ahorrosSinAsignar: ahorros,
    z,
    ahorroMensual,
  });

  return {
    faltanDatos,
    colchon: {
      automatico: !manual,
      meses,
      objetivo: objetivoColchon,
      conAhorros: colchonConAhorros,
      faltante: faltanteColchon,
      mesesParaCompletar: mesesColchon === null ? null : Math.max(0, Math.ceil(mesesColchon - 1e-9)),
    },
    deudas,
    mesesAntesDeObjetivos: mesesAntes,
    objetivos,
    sobranteMensual: mesesAntes === null ? 0 : disponible,
    ahorrosSinAsignar: ahorros,
    aporteFaltanteTotal,
    proyeccion,
  };
}

interface DatosProyeccion {
  colchonInicial: number;
  faltanteColchon: number;
  mesesColchon: number | null;
  mesesAntes: number | null;
  objetivos: ResultadoObjetivo[];
  sobranteMensual: number;
  ahorrosSinAsignar: number;
  z: Float64Array[];
  ahorroMensual: number;
}

/**
 * Simula todos los "bolsillos" juntos (colchón, uno por objetivo y el sobrante) con los mismos
 * shocks de mercado. Eso supone que todas las carteras suben y bajan a la vez, así que la banda
 * entre el escenario malo y el bueno queda algo más ancha que la real: es una aproximación prudente.
 */
function proyectar(e: EntradaPlan, d: DatosProyeccion): PuntoProyeccion[] {
  const ultimo = Math.max(10, ...d.objetivos.map((o) => o.anios + 1));
  const anios = Math.min(ultimo, Math.floor(d.z[0].length / 12));
  const liq = parametrosMensuales(e.carteras.liquidez.retornoAritmetico, e.carteras.liquidez.volatilidad);
  const largo = parametrosMensuales(e.carteras[e.perfil].retornoAritmetico, e.carteras[e.perfil].volatilidad);
  const bolsillos = d.objetivos.map((o) => ({
    p: parametrosMensuales(o.cartera.retornoAritmetico, o.cartera.volatilidad),
    inicial: o.conAhorros,
    aporte: o.aporte,
    vence: Math.round(o.anios * 12),
    // La plata del retiro no se gasta de una vez: es el capital con el que la persona se retira.
    retiro: o.objetivo.categoria === "retiro" ? 0 : o.montoNominal,
  }));
  const mesesColchon = d.mesesColchon ?? Infinity;
  const desde = d.mesesAntes ?? Infinity;

  const porAnio: number[][] = Array.from({ length: anios + 1 }, () => []);
  for (const fila of d.z) {
    let colchon = d.colchonInicial;
    let sobrante = d.ahorrosSinAsignar;
    const valores = bolsillos.map((b) => b.inicial);
    porAnio[0].push(colchon + sobrante + valores.reduce((a, b) => a + b, 0));
    for (let m = 0; m < anios * 12; m++) {
      const zm = fila[m];
      colchon *= Math.exp(liq.mu + liq.sigma * zm);
      if (m < mesesColchon) colchon += Math.min(d.ahorroMensual, Math.max(0, d.faltanteColchon - d.ahorroMensual * m));
      sobrante *= Math.exp(largo.mu + largo.sigma * zm);
      if (m >= desde) sobrante += d.sobranteMensual;
      for (let i = 0; i < bolsillos.length; i++) {
        const b = bolsillos[i];
        if (m >= b.vence) {
          // Lo que queda después de la fecha (el capital del retiro, o un sobrante) sigue invertido en liquidez.
          valores[i] *= Math.exp(liq.mu + liq.sigma * zm);
          continue;
        }
        valores[i] *= Math.exp(b.p.mu + b.p.sigma * zm);
        if (m >= desde) valores[i] += b.aporte;
        if (m === b.vence - 1) valores[i] = Math.max(0, valores[i] - b.retiro); // se usa la plata del objetivo
      }
      if ((m + 1) % 12 === 0) {
        const y = (m + 1) / 12;
        const total = colchon + sobrante + valores.reduce((a, b) => a + b, 0);
        porAnio[y].push(total / Math.pow(1 + e.inflacion / 100, y));
      }
    }
  }
  const percentil = (xs: number[], p: number) => {
    const ord = [...xs].sort((a, b) => a - b);
    return ord[Math.min(ord.length - 1, Math.floor(p * ord.length))];
  };
  return porAnio.map((xs, y) => ({
    anio: e.anioActual + y,
    edad: e.situacion.edad ? e.situacion.edad + y : null,
    malo: percentil(xs, 0.1),
    medio: percentil(xs, 0.5),
    bueno: percentil(xs, 0.9),
  }));
}
