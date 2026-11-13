"use client";

import { useMemo } from "react";
import type { DatosGenerados } from "@/motor/generado";
import { armarPlan, type Criterios, type Objetivo, type ResultadoObjetivo, type ResultadoPlan, type Situacion } from "@/plan/patrimonio";
import { carterasResumen } from "@/plan/carterasResumen";
import type { ListaEtfs } from "@/plan/etfs";
import { dolares, numero } from "@/lib/formato";
import { GraficoPatrimonio } from "./GraficoPatrimonio";
import { Avisos } from "./Cartera";
import type { TipoCartera } from "./estado";

const nombreDeuda: Record<string, string> = { tarjeta: "la tarjeta de crédito", prestamo_personal: "el préstamo personal", hipoteca: "la hipoteca", otra: "la deuda" };
const nombrePrioridad: Record<string, string> = { imprescindible: "Imprescindible", importante: "Importante", deseable: "Deseable" };
const textoEstado = { cubierto: "Cubierto", parcial: "Cubierto a medias", sin_cubrir: "Sin cubrir" } as const;
const simboloEstado = { cubierto: "●", parcial: "◐", sin_cubrir: "○" } as const;

interface Props {
  datos: DatosGenerados;
  etfs: ListaEtfs;
  criterios: Criterios;
  perfil: string;
  tipo: TipoCartera;
  elegidos: Record<string, string>;
  situacion: Situacion;
  objetivos: Objetivo[];
  respuestas: Record<string, string>;
  anioActual: number;
  onIrASituacion: () => void;
}

export function PlanPatrimonial(props: Props) {
  const { datos, etfs, criterios, perfil, tipo, elegidos, situacion, objetivos, respuestas, anioActual } = props;
  const carteras = useMemo(() => carterasResumen(datos, etfs, tipo, elegidos), [datos, etfs, tipo, elegidos]);
  const plan = useMemo(
    () =>
      armarPlan({
        situacion,
        objetivos,
        perfil,
        perfiles: datos.perfiles.map((p) => p.id),
        carteras,
        criterios,
        respuestasTest: respuestas,
        anioActual,
        inflacion: datos.inflacionEEUU,
      }),
    [situacion, objetivos, perfil, datos, carteras, criterios, respuestas, anioActual],
  );

  if (plan.faltanDatos.length) {
    return (
      <div className="max-w-2xl">
        <h1 className="font-titular text-[40px] leading-tight sm:text-[52px]">Falta un dato.</h1>
        <p className="mt-5 text-[18px] leading-[1.6] text-[var(--gris)]">Para armar tu plan necesitamos {plan.faltanDatos.join(" y ")}.</p>
        <button type="button" onClick={props.onIrASituacion} className="mt-8 rounded-[3px] bg-[var(--tinta)] px-6 py-3.5 text-[16px] text-[var(--fondo)] hover:bg-black">
          Completar mi situación
        </button>
      </div>
    );
  }

  const nombrePerfil = datos.perfiles.find((p) => p.id === perfil)!.nombre;
  const cubiertos = plan.objetivos.filter((o) => o.estado === "cubierto").length;
  const ultimo = plan.proyeccion.at(-1)!;
  const pasos = proximosPasos(plan, situacion);
  const deudasACancelar = plan.deudas.filter((d) => d.cancelarPrimero);
  let n = 0;
  const numerar = () => String(++n).padStart(2, "0");

  return (
    <div>
      <p className="rotulo">Tu plan</p>
      <h1 className="font-titular mt-3 text-[40px] leading-[1.05] tracking-[-0.015em] sm:text-[56px]">Qué hacer con tu plata, y en qué orden.</h1>

      {/* Resumen de una página */}
      <section className="mt-10 border border-[var(--tinta)] p-5 sm:p-8" aria-labelledby="resumen">
        <h2 id="resumen" className="rotulo">
          Resumen
        </h2>
        <dl className="tabular mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-4">
          <Dato titulo="Perfil" valor={nombrePerfil} detalle={`Cartera ${datos.carteras[tipo].nombre.toLowerCase()}`} />
          <Dato titulo="Ahorro por mes" valor={dolares(situacion.ahorroMensual ?? 0)} detalle={plan.sobranteMensual > 1 ? `Te sobran ${dolares(plan.sobranteMensual)}` : undefined} />
          <Dato titulo="Objetivos cubiertos" valor={`${cubiertos} de ${plan.objetivos.length}`} detalle={plan.aporteFaltanteTotal > 1 ? `Faltan ${dolares(plan.aporteFaltanteTotal)} por mes` : undefined} />
          <Dato titulo={`Patrimonio en ${ultimo.anio}`} valor={dolares(ultimo.medio)} detalle={`Entre ${dolares(ultimo.malo)} y ${dolares(ultimo.bueno)}`} />
        </dl>
        <h3 className="mt-8 text-[17px]">Tus próximos tres pasos</h3>
        <ol className="mt-3 space-y-3">
          {pasos.map((p, i) => (
            <li key={p} className="grid grid-cols-[2rem_1fr] text-[16px] leading-[1.55]">
              <span className="font-titular text-[22px] leading-none">{i + 1}</span>
              <span>{p}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* 1. Colchón */}
      <Bloque numero={numerar()} titulo="Colchón primero">
        {plan.colchon.automatico ? (
          plan.colchon.objetivo === null ? (
            <p>
              No cargaste tus gastos por mes, así que no podemos calcular tu fondo de emergencia. Te recomendamos tener entre 3 y 6 meses de
              gastos en liquidez antes de invertir.{" "}
              <button type="button" onClick={props.onIrASituacion} className="text-[var(--tinta)] underline decoration-[var(--linea)] underline-offset-4">
                Cargar mis gastos
              </button>
            </p>
          ) : (
            <>
              <p>
                Antes de invertir, tené {plan.colchon.meses} meses de gastos guardados en liquidez en dólares:{" "}
                <span className="tabular text-[var(--tinta)]">{dolares(plan.colchon.objetivo)}</span>.{" "}
                {plan.colchon.meses === 6
                  ? "Son 6 y no 3 porque tus ingresos varían o tenés personas a cargo."
                  : "Con ingresos estables y sin personas a cargo, alcanza con 3."}
              </p>
              <p className="mt-3">
                {plan.colchon.faltante <= 0
                  ? "Con tus ahorros ya lo tenés completo."
                  : plan.colchon.mesesParaCompletar === null
                    ? `Te faltan ${dolares(plan.colchon.faltante)}.`
                    : `${plan.colchon.conAhorros > 0 ? `Con tus ahorros cubrís ${dolares(plan.colchon.conAhorros)}. ` : ""}Te faltan ${dolares(plan.colchon.faltante)}: con tu ahorro mensual lo completás en ${plan.colchon.mesesParaCompletar} ${plan.colchon.mesesParaCompletar === 1 ? "mes" : "meses"}, y recién después empezás con los objetivos.`}
              </p>
            </>
          )
        ) : (
          <p>Cargaste tu propio fondo de emergencia: va primero, antes que cualquier otro objetivo, y se guarda en liquidez.</p>
        )}
      </Bloque>

      {/* 2. Deudas */}
      {plan.deudas.length > 0 && (
        <Bloque numero={numerar()} titulo="Tus deudas">
          <ul className="space-y-4">
            {plan.deudas.map((d) => (
              <li key={d.deuda.id}>
                <span className="text-[var(--tinta)]">
                  {d.cancelarPrimero ? "Cancelá" : "Seguí pagando normalmente"} {nombreDeuda[d.deuda.tipo]} ({dolares(d.deuda.saldo)}
                  {d.deuda.tasa !== null ? `, ${numero(d.deuda.tasa, 1)}% anual` : ""})
                  {d.cancelarPrimero ? " antes de invertir." : "."}
                </span>{" "}
                {d.motivo}
                {d.pagadoConAhorros > 0 && ` Usá ${dolares(d.pagadoConAhorros)} de tus ahorros para eso.`}
              </li>
            ))}
          </ul>
          {deudasACancelar.length > 0 && plan.mesesAntesDeObjetivos !== null && plan.mesesAntesDeObjetivos > 0 && (
            <p className="mt-4">
              Entre el colchón y estas deudas, tu ahorro de los primeros {plan.mesesAntesDeObjetivos} meses va a eso. Los aportes a tus objetivos
              empiezan después.
            </p>
          )}
          {plan.mesesAntesDeObjetivos === null && (
            <p className="mt-4 text-[var(--tinta)]">
              Con tu ahorro mensual actual no alcanza para cancelar estas deudas. Antes de invertir, conviene revisar tus gastos o
              renegociarlas.
            </p>
          )}
        </Bloque>
      )}

      {/* 3. Objetivos */}
      <Bloque numero={numerar()} titulo="Una cartera para cada objetivo">
        {plan.objetivos.length === 0 ? (
          <p>
            No cargaste objetivos. Tu ahorro va entero a tu cartera de largo plazo.{" "}
            <button type="button" onClick={props.onIrASituacion} className="text-[var(--tinta)] underline decoration-[var(--linea)] underline-offset-4">
              Agregar objetivos
            </button>
          </p>
        ) : (
          <>
            <p>
              La plata que vas a usar pronto no puede estar en algo que oscila mucho. Por eso cada objetivo tiene su cartera según el plazo,
              sin pasar nunca tu perfil:
            </p>
            <ul className="tabular mt-3 space-y-1 text-[15px]">
              {criterios.plazos.map((t) => (
                <li key={t.texto}>· {t.texto}</li>
              ))}
            </ul>
            <div className="mt-8 space-y-4">
              {plan.objetivos.map((o) => (
                <TarjetaResultado key={o.objetivo.id} r={o} />
              ))}
            </div>
            <p className="mt-6 text-[14px]">
              Los aportes se calcularon con el retorno esperado de cada cartera, ya descontado lo que cobran los ETFs. La probabilidad sale de
              simular 500 escenarios de mercado y es aproximada.
            </p>
          </>
        )}
      </Bloque>

      {/* 4. Si no alcanza */}
      {plan.aporteFaltanteTotal > 1 && (
        <Bloque numero={numerar()} titulo="La plata no alcanza para todo">
          <p>
            Con tu ahorro de {dolares(situacion.ahorroMensual ?? 0)} por mes cubrimos primero lo imprescindible, después lo importante y al
            final lo deseable; dentro de cada grupo, lo que vence antes. Para cubrir todo te faltarían{" "}
            <span className="tabular text-[var(--tinta)]">{dolares(plan.aporteFaltanteTotal)} por mes</span>.
          </p>
          <p className="mt-3">Hay tres caminos, y se pueden combinar: ahorrar más, darle más tiempo a algún objetivo o bajar su monto. Cada tarjeta de arriba dice cuánto en cada caso.</p>
        </Bloque>
      )}
      {plan.sobranteMensual > 1 && plan.objetivos.length > 0 && (
        <p className="mt-6 max-w-[62ch] border-l-2 border-[var(--acento)] pl-5 text-[16px] leading-[1.6]">
          Después de cubrir tus objetivos te sobran <span className="tabular">{dolares(plan.sobranteMensual)}</span> por mes. Si los invertís en
          tu cartera {nombrePerfil.toLowerCase()}, suman a tu patrimonio de largo plazo (ya están incluidos en la proyección de abajo).
        </p>
      )}

      {/* 5. Patrimonio proyectado */}
      <Bloque numero={numerar()} titulo="Tu patrimonio, año a año">
        <p>
          Todo lo que tenés invertido, sumando el colchón y cada objetivo, en dólares de hoy (ya descontada la inflación de EE.UU. de{" "}
          {numero(datos.inflacionEEUU, 1)}% anual). Las bajadas son los años en que usás la plata de un objetivo; el retiro no baja, porque es el capital con el que te retirás.
        </p>
        <div className="mt-6 max-w-none">
          <GraficoPatrimonio puntos={plan.proyeccion} vencimientos={plan.objetivos.filter((o) => o.objetivo.categoria !== "retiro").map((o) => o.objetivo.anio)} />
        </div>
        <p className="mt-4 text-[14px]">
          La banda supone que todas tus carteras suben y bajan al mismo tiempo, así que exagera un poco el rango: es una aproximación
          prudente. No incluye la jubilación del BPS ni de la AFAP, ni tu vivienda.
        </p>
      </Bloque>

      <Avisos />
    </div>
  );
}

function Dato({ titulo, valor, detalle }: { titulo: string; valor: string; detalle?: string }) {
  return (
    <div>
      <dt className="text-[13px] text-[var(--gris)]">{titulo}</dt>
      <dd className="mt-1 text-[22px] leading-tight">{valor}</dd>
      {detalle && <dd className="mt-1 text-[13px] text-[var(--gris)]">{detalle}</dd>}
    </div>
  );
}

function Bloque({ numero: n, titulo, children }: { numero: string; titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-16">
      <p className="rotulo tabular">{n}</p>
      <h2 className="font-titular mt-2 text-[32px] leading-tight">{titulo}</h2>
      <div className="mt-4 max-w-[68ch] text-[17px] leading-[1.6] text-[var(--gris)]">{children}</div>
    </section>
  );
}

function TarjetaResultado({ r }: { r: ResultadoObjetivo }) {
  const o = r.objetivo;
  const faltaPorMes = r.aporteNecesario === null ? null : Math.max(0, r.aporteNecesario - r.aporte);
  return (
    <article className="rounded-[3px] border border-[var(--linea)] p-5 text-[var(--tinta)]">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="font-titular text-[26px] leading-tight">{o.nombre || "Objetivo"}</h3>
        <p className="text-[14px]">
          <span aria-hidden className="mr-1.5">
            {simboloEstado[r.estado]}
          </span>
          {textoEstado[r.estado]}
        </p>
      </div>
      <p className="tabular mt-1 text-[14px] text-[var(--gris)]">
        {nombrePrioridad[o.prioridad]} · {o.anio}, dentro de {r.anios} {r.anios === 1 ? "año" : "años"} · {dolares(o.monto)} de hoy ({dolares(r.montoNominal)} de{" "}
        {o.anio})
      </p>
      <dl className="tabular mt-5 grid gap-x-6 gap-y-4 text-[15px] sm:grid-cols-3">
        <div>
          <dt className="text-[13px] text-[var(--gris)]">Cartera</dt>
          <dd className="mt-0.5">
            {r.cartera.nombre}
            <span className="block text-[13px] text-[var(--gris)]">
              {numero(r.cartera.retornoCompuesto, 1)}% por año · riesgo {numero(r.cartera.volatilidad, 1)}%
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-[13px] text-[var(--gris)]">Ahorro para este objetivo</dt>
          <dd className="mt-0.5">
            {dolares(r.aporte)} por mes
            {r.conAhorros > 0 && <span className="block text-[13px] text-[var(--gris)]">más {dolares(r.conAhorros)} de tus ahorros hoy</span>}
          </dd>
        </div>
        <div>
          <dt className="text-[13px] text-[var(--gris)]">Probabilidad de llegar</dt>
          <dd className="mt-0.5">
            {r.probabilidad >= 0.995 ? "Casi segura" : `${numero(r.probabilidad * 100, 0)}%`}
            {r.aporte80 !== null && r.probabilidad < 0.8 && (
              <span className="block text-[13px] text-[var(--gris)]">Para 80%: {dolares(r.aporte80)} por mes</span>
            )}
          </dd>
        </div>
      </dl>
      {r.estado !== "cubierto" && (
        <div className="mt-5 border-t border-[var(--linea)] pt-4 text-[15px] leading-[1.6] text-[var(--gris)]">
          {r.aporteNecesario === null ? (
            <p>No queda tiempo para ahorrar para este objetivo antes de su fecha, después del colchón y las deudas. Conviene darle más tiempo.</p>
          ) : r.montoAlcanzable < 1 ? (
            <p>
              Tu ahorro de hoy se usa entero en objetivos con más prioridad o que vencen antes. Para cubrir este, necesitarías ahorrar{" "}
              <span className="tabular text-[var(--tinta)]">{dolares(faltaPorMes ?? 0)}</span> más por mes, o bajar el monto o la prioridad de
              otro objetivo.
            </p>
          ) : (
            <p>
              Con lo que alcanza llegás a unos <span className="tabular text-[var(--tinta)]">{dolares(r.montoAlcanzable)}</span> de hoy. Para cubrirlo
              entero: ahorrar <span className="tabular text-[var(--tinta)]">{dolares(faltaPorMes ?? 0)}</span> más por mes
              {r.aniosExtra ? (
                <>
                  , o esperar <span className="tabular text-[var(--tinta)]">{r.aniosExtra}</span> {r.aniosExtra === 1 ? "año" : "años"} más
                </>
              ) : null}
              , o bajar el monto a {dolares(r.montoAlcanzable)}.
            </p>
          )}
        </div>
      )}
    </article>
  );
}

/** Los tres pasos más importantes, en orden. */
function proximosPasos(plan: ResultadoPlan, s: Situacion): string[] {
  const pasos: string[] = [];
  if (plan.colchon.automatico && plan.colchon.objetivo === null) pasos.push("Calculá tus gastos por mes y separá entre 3 y 6 meses en liquidez en dólares: es tu fondo de emergencia.");
  if (plan.colchon.faltante > 0)
    pasos.push(`Completá tu fondo de emergencia: juntá ${dolares(plan.colchon.faltante)} más en liquidez en dólares, por ejemplo en un ETF de letras del Tesoro.`);
  for (const d of plan.deudas) if (d.cancelarPrimero && d.deuda.saldo > 0) pasos.push(`Cancelá ${nombreDeuda[d.deuda.tipo]} (${dolares(d.deuda.saldo)}) antes de invertir.`);
  pasos.push("Abrí una cuenta en un broker que te dé acceso a las bolsas europeas, comparando cuánto cobra y quién lo regula.");
  const aportes = plan.objetivos.reduce((t, o) => t + o.aporte, 0) + plan.sobranteMensual;
  if (aportes > 0) pasos.push(`Programá un aporte de ${dolares(aportes)} por mes y repartilo entre las carteras de tus objetivos como dice este plan.`);
  else if ((s.ahorros ?? 0) > 0) pasos.push("Invertí tus ahorros en las carteras de tus objetivos, como dice este plan.");
  if (plan.aporteFaltanteTotal > 1) pasos.push(`Decidí qué ajustar para cubrir todo: ahorrar ${dolares(plan.aporteFaltanteTotal)} más por mes, esperar más o bajar algún objetivo.`);
  pasos.push("Revisá este plan una vez por año, cuando rebalancees tu cartera.");
  return pasos.slice(0, 3);
}
